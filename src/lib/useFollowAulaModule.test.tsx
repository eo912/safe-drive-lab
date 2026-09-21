import { act, renderHook } from "@testing-library/react";
import type { NavigateFunction } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFollowAulaModule } from "./useFollowAulaModule";

type AulaPosition = {
  moduleId: string;
  blockId?: string;
  step?: string;
};

const bus = vi.hoisted(() => ({
  listener: null as null | ((event: AulaPosition) => void),
  useBusListener: vi.fn(
    (_kind: string, listener: (event: AulaPosition) => void) => {
      bus.listener = listener;
    },
  ),
}));

vi.mock("./aulaSync", () => ({
  useBusListener: bus.useBusListener,
}));

describe("useFollowAulaModule", () => {
  beforeEach(() => {
    bus.listener = null;
    bus.useBusListener.mockClear();
  });

  it("segue una sola volta il cambio modulo valido comunicato dall'Aula", () => {
    const navigate = vi.fn();
    renderHook(() =>
      useFollowAulaModule(
        "modulo-1-il-sistema-guida",
        navigate as unknown as NavigateFunction,
      ),
    );

    const position = {
      moduleId: "modulo-2-sicurezza-e-rischio",
      blockId: "sicurezza-rischio",
      step: "intro",
    };
    act(() => bus.listener?.(position));
    act(() => bus.listener?.(position));

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(
      "/istruttore/modulo-2-sicurezza-e-rischio?blocco=sicurezza-rischio&step=intro",
      { replace: true },
    );
  });

  it("ignora posizioni dello stesso modulo o con blocco non valido", () => {
    const navigate = vi.fn();
    renderHook(() =>
      useFollowAulaModule(
        "modulo-1-il-sistema-guida",
        navigate as unknown as NavigateFunction,
      ),
    );

    act(() =>
      bus.listener?.({
        moduleId: "modulo-1-il-sistema-guida",
        blockId: "sistema-guida",
        step: "intro",
      }),
    );
    act(() =>
      bus.listener?.({
        moduleId: "modulo-2-sicurezza-e-rischio",
        blockId: "blocco-inesistente",
        step: "intro",
      }),
    );

    expect(navigate).not.toHaveBeenCalled();
  });
});
