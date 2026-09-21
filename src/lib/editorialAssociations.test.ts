import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({
  upsert: vi.fn(async () => ({ error: null })),
  from: vi.fn(),
}));

database.from.mockImplementation(() => ({ upsert: database.upsert }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: database.from },
}));

import { saveEditorialEmbeds, saveEditorialMedia } from "./editorialAssociations";

describe("scrittura associazioni editoriali", () => {
  beforeEach(() => {
    database.from.mockClear();
    database.upsert.mockClear();
  });

  it("mantiene l'upsert media/link sul client autenticato", async () => {
    const media = [{ id: "video-1", kind: "video" }];
    await saveEditorialMedia("modulo-1", "blocco-a", media);

    expect(database.from).toHaveBeenCalledWith("editorial_associations");
    expect(database.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        module_id: "modulo-1",
        block_id: "blocco-a",
        media,
      }),
      { onConflict: "module_id,block_id" },
    );
  });

  it("mantiene l'upsert degli embed", async () => {
    const embeds = { intro: [{ id: "embed-1" }] };
    await saveEditorialEmbeds("modulo-1", "blocco-a", embeds);

    expect(database.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ embeds }),
      { onConflict: "module_id,block_id" },
    );
  });
});
