import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const realtime = vi.hoisted(() => {
  const subscriptions: Array<(status: string) => void> = [];
  let receive: ((message: { payload: unknown }) => void) | null = null;
  const send = vi.fn(async (_message: { payload: Record<string, unknown> }) => "ok" as const);
  const channel = {
    on: vi.fn((_type: string, _filter: unknown, callback: typeof receive) => {
      receive = callback;
      return channel;
    }),
    subscribe: vi.fn((callback: (status: string) => void) => {
      subscriptions.push(callback);
      return channel;
    }),
    send,
  };
  return {
    channel,
    channelFactory: vi.fn(() => channel),
    removeChannel: vi.fn(async () => "ok"),
    send,
    subscriptions,
    emit(payload: unknown) {
      receive?.({ payload });
    },
    reset() {
      subscriptions.length = 0;
      receive = null;
      send.mockClear();
      this.channelFactory.mockClear();
      this.removeChannel.mockClear();
      channel.on.mockClear();
      channel.subscribe.mockClear();
    },
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    channel: realtime.channelFactory,
    removeChannel: realtime.removeChannel,
  },
}));

const envelope = (kind: string, payload: unknown, isNavigation?: boolean) => ({
  kind,
  roomId: "test-room",
  senderInstanceId: "other-window",
  eventId: `event-${Math.random()}`,
  sentAt: Date.now(),
  moduleId: "modulo-test",
  payload,
  isNavigation,
});

describe("Aula realtime contract", () => {
  beforeEach(() => {
    cleanup();
    vi.resetModules();
    realtime.reset();
    localStorage.clear();
    window.history.replaceState({}, "", "/istruttore/modulo-test?room=test-room");
  });

  afterEach(cleanup);

  it("inizializza la posizione Regia dal primo aula_position senza inviare comandi", async () => {
    const { useAulaPublisher } = await import("./aulaSync");

    const Regia = () => {
      const { liveState } = useAulaPublisher("modulo-test", "a");
      return <div>{liveState ? `${liveState.blocco}:${liveState.step}` : "vuoto"}</div>;
    };

    render(<Regia />);
    expect(screen.getByText("vuoto")).toBeInTheDocument();
    act(() => realtime.subscriptions[0]?.("SUBSCRIBED"));
    expect(realtime.send).not.toHaveBeenCalled();

    act(() => {
      realtime.emit(
        envelope("aula_position", {
          modulo: "modulo-test",
          blocco: "c",
          step: "scenario",
          paused: false,
          ts: Date.now(),
        }),
      );
    });

    expect(await screen.findByText("c:scenario")).toBeInTheDocument();
    expect(realtime.send).not.toHaveBeenCalled();
  });

  it("applica solo la navigazione esplicita e al reconnect dichiara la posizione corrente", async () => {
    const { useAulaHeartbeat, useAulaSubscriber } = await import("./aulaSync");

    const Aula = () => {
      const state = useAulaSubscriber("modulo-test", "a");
      useAulaHeartbeat(true, {
        modulo: "modulo-test",
        blocco: state.blocco,
        step: state.step,
        paused: false,
      });
      return <div>{`${state.blocco}:${state.step}`}</div>;
    };

    render(<Aula />);
    act(() => realtime.subscriptions[0]?.("SUBSCRIBED"));
    await waitFor(() => expect(realtime.send).toHaveBeenCalledTimes(1));
    expect(realtime.send.mock.calls[0]![0].payload.kind).toBe("aula_position");

    act(() => {
      realtime.emit(
        envelope(
          "navigation_command",
          {
            modulo: "modulo-test",
            blocco: "c",
            step: "scenario",
            cmdTs: Date.now(),
            ts: Date.now(),
          },
          true,
        ),
      );
    });
    expect(await screen.findByText("c:scenario")).toBeInTheDocument();

    realtime.send.mockClear();
    act(() => realtime.subscriptions[0]?.("SUBSCRIBED"));
    await waitFor(() => expect(realtime.send).toHaveBeenCalledTimes(1));
    const reconnectPayload = realtime.send.mock.calls[0]![0].payload;
    expect(reconnectPayload.kind).toBe("aula_position");
    expect(reconnectPayload.blockId).toBe("c");
    expect(screen.getByText("c:scenario")).toBeInTheDocument();
  });

  it("marca come navigazione solo l'azione esplicita della Regia", async () => {
    const { useAulaPublisher } = await import("./aulaSync");

    const Regia = () => {
      const { publish } = useAulaPublisher("modulo-test", "a");
      return (
        <button
          onClick={() => publish({ blocco: "c", step: "scenario" }, { isNavigation: true })}
        >
          Invia in Aula
        </button>
      );
    };

    render(<Regia />);
    act(() => realtime.subscriptions[0]?.("SUBSCRIBED"));
    fireEvent.click(screen.getByRole("button", { name: "Invia in Aula" }));

    await waitFor(() => expect(realtime.send).toHaveBeenCalledTimes(1));
    const command = realtime.send.mock.calls[0]![0].payload;
    expect(command.kind).toBe("navigation_command");
    expect(command.isNavigation).toBe(true);
    expect(command.blockId).toBe("c");
  });

  it("non apre alcun canale per embed=mini", async () => {
    window.history.replaceState(
      {},
      "",
      "/aula/modulo-test?embed=mini&room=test-room&blocco=a&step=intro",
    );
    const { useAulaHeartbeat, useAulaSubscriber } = await import("./aulaSync");

    const Preview = () => {
      const state = useAulaSubscriber("modulo-test", "a");
      useAulaHeartbeat(false, {
        modulo: "modulo-test",
        blocco: state.blocco,
        step: state.step,
        paused: false,
      });
      return null;
    };

    render(<Preview />);
    expect(realtime.channelFactory).not.toHaveBeenCalled();
    expect(realtime.send).not.toHaveBeenCalled();
  });

  it("configura Broadcast con ack server-side", async () => {
    const { useAulaPublisher } = await import("./aulaSync");
    const Regia = () => {
      useAulaPublisher("modulo-test", "a");
      return null;
    };
    render(<Regia />);

    expect(realtime.channelFactory).toHaveBeenCalledWith(
      "safedrivelab-aula-live:test-room",
      { config: { broadcast: { self: false, ack: true } } },
    );
  });
});
