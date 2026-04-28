import { useState } from "react";
import { Clock, RotateCcw, Pencil, Check } from "lucide-react";
import { formatMMSS } from "@/lib/slideTiming";

type Props = {
  /** Tempo previsto in secondi (default + override). */
  expectedSeconds: number;
  /** Tempo corrente live in secondi (0 se nessuna slide live). */
  liveSeconds: number;
  /** Vero se questa slide è quella live in Aula. */
  isLive: boolean;
  onChange: (seconds: number) => void;
  onReset: () => void;
};

/**
 * Indicatore "tempo per slide": mostra previsto + attuale (solo per live)
 * con stato verde (entro previsto) / arancione (superato) e barra di avanzamento.
 *
 * L'istruttore può modificare il previsto inline. Salvataggio su localStorage.
 */
export const SlideTimeIndicator = ({
  expectedSeconds,
  liveSeconds,
  isLive,
  onChange,
  onReset,
}: Props) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(Math.round(expectedSeconds / 60)));

  const overTime = isLive && liveSeconds > expectedSeconds;
  const ratio = expectedSeconds > 0 ? Math.min(2, liveSeconds / expectedSeconds) : 0;
  const barWidth = `${Math.min(100, (ratio / 1) * 100)}%`;
  // Stato colore
  const stateClass = !isLive
    ? "text-muted-foreground"
    : overTime
      ? "text-amber-500"
      : "text-emerald-500";
  const dotClass = !isLive
    ? "bg-muted-foreground/40"
    : overTime
      ? "bg-amber-500"
      : "bg-emerald-500 animate-pulse";
  const barClass = !isLive
    ? "bg-muted-foreground/30"
    : overTime
      ? "bg-amber-500"
      : "bg-emerald-500";

  const apply = () => {
    const m = parseFloat(draft.replace(",", "."));
    if (Number.isFinite(m) && m > 0) {
      onChange(Math.round(m * 60));
    }
    setEditing(false);
  };

  return (
    <div className="rounded-md border border-border/60 bg-card/40 p-2.5">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Clock className={`w-3 h-3 shrink-0 ${stateClass}`} />
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Tempo slide
          </span>
        </div>
        <span className={`inline-flex items-center gap-1 text-[10px] font-mono ${stateClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
          {isLive ? (overTime ? "fuori tempo" : "in tempo") : "non live"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        {/* Previsto editabile */}
        <div className="rounded-sm bg-background/40 px-2 py-1.5">
          <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/70 mb-0.5">
            Previsto
          </p>
          {editing ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") apply();
                  if (e.key === "Escape") setEditing(false);
                }}
                autoFocus
                className="w-12 min-w-0 px-1 py-0 rounded-sm bg-background border border-border text-[11px] font-mono text-foreground focus:outline-none focus:border-primary"
              />
              <span className="text-[10px] font-mono text-muted-foreground">min</span>
              <button
                type="button"
                onClick={apply}
                className="ml-auto text-primary hover:text-primary/80"
                aria-label="Applica"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDraft(String(Math.round(expectedSeconds / 60)));
                setEditing(true);
              }}
              className="group flex items-center gap-1.5 text-sm font-mono text-foreground/90 tabular-nums hover:text-primary transition-colors"
              title="Modifica tempo previsto"
            >
              {formatMMSS(expectedSeconds)}
              <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>

        {/* Attuale (live) */}
        <div className="rounded-sm bg-background/40 px-2 py-1.5">
          <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/70 mb-0.5">
            Attuale
          </p>
          <p className={`text-sm font-mono tabular-nums ${stateClass}`}>
            {isLive ? formatMMSS(liveSeconds) : "—"}
          </p>
        </div>
      </div>

      {/* Barra avanzamento */}
      <div className="h-1 w-full bg-background/60 rounded-full overflow-hidden">
        <div
          className={`h-full transition-[width] duration-500 ${barClass}`}
          style={{ width: barWidth }}
        />
      </div>

      <div className="mt-2 flex items-center justify-end">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          title="Ripristina tempo predefinito di blocco"
        >
          <RotateCcw className="w-2.5 h-2.5" />
          Default
        </button>
      </div>
    </div>
  );
};
