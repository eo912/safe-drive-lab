import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { LockKeyhole } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isInstructorSession } from "@/lib/instructorAuth";

type Props = { children: ReactNode };

export const InstructorAuthGate = ({ children }: Props) => {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSession(data.session);
      })
      .catch(() => {
        if (active) setSession(null);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) setSession(nextSession);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (signInError) {
      setError("Credenziali non valide o accesso non disponibile.");
      return;
    }
    setSession(data.session);
  };

  if (session === undefined) {
    return (
      <main className="min-h-screen bg-background text-foreground grid place-items-center">
        <p className="text-sm font-mono text-muted-foreground">Verifica accesso Regia…</p>
      </main>
    );
  }

  if (session && !isInstructorSession(session)) {
    return (
      <main className="min-h-screen bg-background text-foreground grid place-items-center px-6">
        <section className="w-full max-w-sm rounded-lg border border-border bg-card p-6 text-center">
          <LockKeyhole className="mx-auto mb-4 h-6 w-6 text-amber-500" />
          <h1 className="text-lg font-semibold">Accesso non autorizzato</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            L’account autenticato non possiede il ruolo istruttore.
          </p>
          <button
            type="button"
            onClick={() => void supabase.auth.signOut()}
            className="mt-5 rounded-md border border-border px-4 py-2 text-sm hover:bg-secondary"
          >
            Esci
          </button>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-background text-foreground grid place-items-center px-6">
        <form
          onSubmit={signIn}
          className="w-full max-w-sm rounded-lg border border-border bg-card p-6"
        >
          <LockKeyhole className="mb-4 h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">Accesso Regia</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Inserisci le credenziali dell’account istruttore.
          </p>
          <label className="mt-5 block text-sm">
            Email
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
            />
          </label>
          <label className="mt-3 block text-sm">
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
            />
          </label>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-5 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {submitting ? "Accesso…" : "Accedi"}
          </button>
        </form>
      </main>
    );
  }

  return children;
};
