import { beforeEach, describe, expect, it, vi } from "vitest";

describe("room Aula/Regia", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it("dà priorità a ?room e la propaga sempre nell'URL Aula", async () => {
    localStorage.setItem("sdl-aula-room", "room-sessione");
    window.history.replaceState({}, "", "/istruttore/modulo-test?room=room-url");
    const { ROOM_ID, withRoom } = await import("./aulaRoom");

    expect(ROOM_ID).toBe("room-url");
    expect(withRoom("/aula/modulo-test?blocco=a")).toContain("room=room-url");
  });

  it("mantiene room differenti distinguibili quando gli URL non coincidono", async () => {
    window.history.replaceState({}, "", "/aula/modulo-test?room=room-aula");
    const aula = await import("./aulaRoom");

    vi.resetModules();
    window.history.replaceState({}, "", "/istruttore/modulo-test?room=room-regia");
    const regia = await import("./aulaRoom");

    expect(aula.ROOM_ID).toBe("room-aula");
    expect(regia.ROOM_ID).toBe("room-regia");
    expect(aula.ROOM_ID).not.toBe(regia.ROOM_ID);
  });
});
