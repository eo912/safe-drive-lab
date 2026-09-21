import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const persistence = vi.hoisted(() => ({
  load: vi.fn(),
  saveMedia: vi.fn(async () => undefined),
  saveEmbeds: vi.fn(async () => undefined),
}));

vi.mock("./editorialAssociations", () => ({
  loadEditorialAssociation: persistence.load,
  saveEditorialMedia: persistence.saveMedia,
  saveEditorialEmbeds: persistence.saveEmbeds,
}));

import { useLinkedContent } from "./instructorStorage";
import { useSceneMedia } from "./sceneMedia";

describe("persistenza associazioni editoriali", () => {
  beforeEach(() => {
    localStorage.clear();
    persistence.load.mockReset();
    persistence.saveMedia.mockClear();
    persistence.saveEmbeds.mockClear();
  });

  it("recupera media e link da Supabase al caricamento della Regia", async () => {
    persistence.load.mockResolvedValue({
      media: [
        {
          id: "video-1",
          kind: "video",
          title: "Video sicurezza",
          url: "https://example.test/video",
          createdAt: 1,
        },
      ],
      embeds: {},
    });

    const View = () => {
      const { items } = useLinkedContent("modulo-test", "blocco-a");
      return <div>{items.map((item) => item.title).join(",") || "vuoto"}</div>;
    };

    render(<View />);
    expect(await screen.findByText("Video sicurezza")).toBeInTheDocument();
    expect(persistence.load).toHaveBeenCalledWith("modulo-test", "blocco-a");
  });

  it("recupera gli embed dello step senza coinvolgere liveState", async () => {
    persistence.load.mockResolvedValue({
      media: [],
      embeds: {
        scenario: [
          {
            id: "placement-1",
            resourceId: "video-1",
            mode: "embedded",
            visibility: "aula",
            x: 8,
            y: 60,
            w: 30,
            h: 30,
            autoplay: false,
            createdAt: 1,
          },
        ],
      },
    });

    const View = () => {
      const { items } = useSceneMedia("modulo-test", "blocco-a", "scenario");
      return <div>{items[0]?.resourceId ?? "vuoto"}</div>;
    };

    render(<View />);
    await waitFor(() => expect(screen.getByText("video-1")).toBeInTheDocument());
  });
});
