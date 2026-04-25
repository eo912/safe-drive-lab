import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { modules } from "@/lib/modules";

const Aula = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-primary mb-6">
          Modalità Aula
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
          Seleziona il modulo
        </h1>

        <div className="space-y-2">
          {modules.map((m, i) => (
            <button
              key={m.slug}
              type="button"
              disabled={!m.available}
              onClick={() => navigate(`/aula/${m.slug}`)}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-md border border-border bg-card text-left hover:border-primary/60 hover:bg-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:bg-card"
            >
              <span className="font-mono text-xs text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-foreground font-medium">{m.title}</span>
            </button>
          ))}
        </div>

        <Link
          to="/"
          className="inline-block mt-10 text-xs font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Esci
        </Link>
      </div>
    </div>
  );
};

export default Aula;
