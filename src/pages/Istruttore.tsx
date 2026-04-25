import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, BookOpen } from "lucide-react";
import { modules } from "@/lib/modules";

const Istruttore = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border/50">
        <div className="container mx-auto max-w-5xl flex items-center justify-between px-6 h-14">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
          <p className="text-xs font-mono tracking-[0.25em] uppercase text-primary">
            Modalità Istruttore
          </p>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-6 py-12">
        <div className="mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Moduli del corso
          </h1>
          <p className="text-sm text-muted-foreground">
            Apri un modulo per consultarlo, oppure avvialo direttamente in aula.
          </p>
        </div>

        <div className="space-y-3">
          {modules.map((m, i) => (
            <div
              key={m.slug}
              className="border border-border rounded-md bg-card p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="flex items-start gap-4 min-w-0">
                <span className="font-mono text-xs text-primary mt-1 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <h2 className="font-semibold text-foreground truncate">
                    {m.title}
                  </h2>
                  <p className="text-sm text-muted-foreground truncate">
                    {m.short}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  disabled={!m.available}
                  onClick={() => navigate(`/istruttore/${m.slug}`)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm text-foreground hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <BookOpen className="w-4 h-4" />
                  Apri modulo
                </button>
                <button
                  type="button"
                  disabled={!m.available}
                  onClick={() => navigate(`/aula/${m.slug}`)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4" />
                  Avvia aula
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-text-dim mt-8 font-mono tracking-wider">
          I moduli non disponibili sono in preparazione.
        </p>
      </main>
    </div>
  );
};

export default Istruttore;
