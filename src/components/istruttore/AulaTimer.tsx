import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Clock } from "lucide-react";

const DEFAULT_TOTAL = 45 * 60; // 45 minuti

const fmt = (s: number) => {
  const sign = s < 0 ? "-" : "";
  const abs = Math.abs(s);
  const m = Math.floor(abs / 60);
  const sec = abs % 60;
  return `${sign}${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const fmtClock = (d: Date) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;

export const AulaTimer = ({ compact = false }: { compact?: boolean }) => {
  const [totalSec, setTotalSec] = useState(DEFAULT_TOTAL);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const lastTickRef = useRef<number | null>(null);

  // Orario corrente
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Timer
  useEffect(() => {
    if (!running) {
      lastTickRef.current = null;
      return;
    }
    const id = setInterval(() => {
      const t = performance.now();
      const last = lastTickRef.current ?? t;
      const delta = (t - last) / 1000;
      lastTickRef.current = t;
      setElapsed((e) => e + delta);
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  const remaining = Math.round(totalSec - elapsed);
  const ratio = elapsed / totalSec;

  const status: "ok" | "warn" | "danger" =
    ratio < 0.7 ? "ok" : ratio < 0.9 ? "warn" : "danger";

  const statusColor =
    status === "ok"
      ? "text-emerald-500"
      : status === "warn"
        ? "text-amber-500"
        : "text-red-500";

  const statusDot =
    status === "ok"
      ? "bg-emerald-500"
      : status === "warn"
        ? "bg-amber-500"
        : "bg-red-500";

  const reset = () => {
    setRunning(false);
    setElapsed(0);
  };

  return (
    <div className={`rounded-md border border-border bg-card/40 ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
            Timer regia
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono ${statusColor}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
          {fmtClock(now)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-sm bg-background/40 px-2 py-1.5">
          <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/70">
            Totale
          </p>
          <p className="text-sm font-mono text-foreground/90 tabular-nums">{fmt(totalSec)}</p>
        </div>
        <div className="rounded-sm bg-background/40 px-2 py-1.5">
          <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/70">
            Rimanente
          </p>
          <p className={`text-sm font-mono tabular-nums ${statusColor}`}>{fmt(remaining)}</p>
        </div>
      </div>

      {/* Barra progresso */}
      <div className="h-1 w-full bg-background/60 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full transition-all ${
            status === "ok"
              ? "bg-emerald-500"
              : status === "warn"
                ? "bg-amber-500"
                : "bg-red-500"
          }`}
          style={{ width: `${Math.min(100, Math.max(0, ratio * 100))}%` }}
        />
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-sm bg-primary/10 text-primary text-[11px] font-medium uppercase tracking-wider hover:bg-primary/20 transition-colors"
        >
          {running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          {running ? "Pausa" : "Start"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-sm border border-border text-foreground/70 text-[11px] font-medium uppercase tracking-wider hover:bg-secondary transition-colors"
          aria-label="Reset timer"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* Selettore durata totale */}
      <div className="flex items-center gap-1 mt-2">
        {[15, 30, 45, 60].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setTotalSec(m * 60);
              setElapsed(0);
              setRunning(false);
            }}
            className={`flex-1 text-[10px] font-mono py-1 rounded-sm transition-colors ${
              totalSec === m * 60
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            {m}m
          </button>
        ))}
      </div>
    </div>
  );
};
