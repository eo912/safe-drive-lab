import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Session } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  })),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(async () => ({ error: null })),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth },
}));

import { InstructorAuthGate } from "./InstructorAuthGate";

const sessionWithRole = (role?: string) =>
  ({
    access_token: "access",
    refresh_token: "refresh",
    expires_in: 3600,
    token_type: "bearer",
    user: {
      id: "user-1",
      app_metadata: role ? { role } : {},
      user_metadata: {},
      aud: "authenticated",
      created_at: "2026-01-01T00:00:00.000Z",
    },
  }) as unknown as Session;

describe("InstructorAuthGate", () => {
  beforeEach(() => {
    auth.getSession.mockReset();
    auth.signInWithPassword.mockReset();
    auth.onAuthStateChange.mockClear();
    auth.signOut.mockClear();
  });

  it("blocca /istruttore quando non esiste una sessione", async () => {
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });

    render(
      <InstructorAuthGate>
        <div>Regia privata</div>
      </InstructorAuthGate>,
    );

    expect(await screen.findByRole("heading", { name: "Accesso Regia" })).toBeInTheDocument();
    expect(screen.queryByText("Regia privata")).not.toBeInTheDocument();
  });

  it("nega la Regia a un utente autenticato senza ruolo instructor", async () => {
    auth.getSession.mockResolvedValue({
      data: { session: sessionWithRole("viewer") },
      error: null,
    });

    render(
      <InstructorAuthGate>
        <div>Regia privata</div>
      </InstructorAuthGate>,
    );

    expect(
      await screen.findByRole("heading", { name: "Accesso non autorizzato" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Regia privata")).not.toBeInTheDocument();
  });

  it("ripristina al refresh una sessione instructor già persistita", async () => {
    auth.getSession.mockResolvedValue({
      data: { session: sessionWithRole("instructor") },
      error: null,
    });

    render(
      <InstructorAuthGate>
        <div>Regia privata</div>
      </InstructorAuthGate>,
    );

    expect(await screen.findByText("Regia privata")).toBeInTheDocument();
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("consente l'accesso dopo login di un instructor", async () => {
    const session = sessionWithRole("instructor");
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    auth.signInWithPassword.mockResolvedValue({
      data: { session, user: session.user },
      error: null,
    });

    render(
      <InstructorAuthGate>
        <div>Regia privata</div>
      </InstructorAuthGate>,
    );

    fireEvent.change(await screen.findByLabelText("Email"), {
      target: { value: "istruttore@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password-locale" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Accedi" }));

    await waitFor(() => expect(screen.getByText("Regia privata")).toBeInTheDocument());
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: "istruttore@example.test",
      password: "password-locale",
    });
  });
});
