import { cleanup, render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("ModuloNextNav", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    window.history.replaceState(
      {},
      "",
      "/aula/modulo-1-il-sistema-guida?room=room-corso",
    );
  });

  afterEach(cleanup);

  it("mantiene la room nel passaggio al modulo successivo", async () => {
    const { ModuloNextNav } = await import("./ModuloNextNav");

    render(
      <BrowserRouter>
        <ModuloNextNav
          to="/aula/modulo-2-sicurezza-e-rischio"
          label="Modulo successivo"
        />
      </BrowserRouter>,
    );

    const destination = new URL(screen.getByRole("link").getAttribute("href")!, window.location.origin);
    expect(`${destination.pathname}${destination.search}`).toBe(
      "/aula/modulo-2-sicurezza-e-rischio?room=room-corso",
    );
  });
});
