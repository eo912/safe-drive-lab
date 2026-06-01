import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  Coffee,
  BellOff,
  Plus,
  X,
  Eye,
} from "lucide-react";
import { AulaPauseScreen } from "@/components/aula/AulaPauseScreen";


const DEFAULT_TOTAL = 45 * 60; // 45 minuti
const WARN_AT = 30; // secondi rimanenti per il warning

const fmt = (s: number) => {
  const sign = s < 0 ? "-" : "";
  const abs = Math.abs(s);
  const m = Math.floor(abs / 60);
  const sec = abs % 60;
  return `${sign}${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const fmtClock = (d: Date) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;

import { PAUSE_ATMOSPHERES, type PauseAtmosphere } from "@/lib/pauseAtmosphere";

type Props = {
  compact?: boolean;
  /**
   * Callback per attivare la pausa Aula. Riceve i minuti consigliati di pausa
   * e l'atmosfera scelta dall'istruttore.
   */
  onRequestAulaPause?: (minutes: number, atmosphere: PauseAtmosphere) => void;
  /**
   * Callback per uscire dalla pausa Aula (riprende slide live precedente).
   */
  onRequestAulaResume?: () => void;
  /**
   * True se l'Aula e' attualmente in modalita' pausa.
   */
  aulaPaused?: boolean;
};

export const AulaTimer = ({
  compact = false,
  onRequestAulaPause,
  onRequestAulaResume,
  aulaPaused = false,
}: Props) => {
  const [atmosphere, setAtmosphere] = useState<PauseAtmosphere>("sun");
  const [totalSec, setTotalSec] = useState(DEFAULT_TOTAL);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [customOpen, setCustomOpen] = useState(false);
  const [customMin, setCustomMin] = useState("45");
  const [warned, setWarned] = useState(false);
  const [showWarn, setShowWarn] = useState(false);
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

  // Warning a -30 secondi (una sola volta per ciclo)
  useEffect(() => {
    if (running && remaining <= WARN_AT && remaining > 0 && !warned) {
      setWarned(true);
      setShowWarn(true);
    }
    if (remaining > WARN_AT && warned) {
      // l'utente ha aggiunto tempo: re-armare l'avviso
      setWarned(false);
    }
  }, [remaining, running, warned]);

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
    setWarned(false);
    setShowWarn(false);
  };

  const applyCustom = () => {
    const m = parseInt(customMin, 10);
    if (Number.isFinite(m) && m > 0 && m <= 240) {
      setTotalSec(m * 60);
      setElapsed(0);
      setRunning(false);
      setWarned(false);
      setShowWarn(false);
      setCustomOpen(false);
    }
  };

  const addTwoMinutes = () => {
    setTotalSec((t) => t + 2 * 60);
    setShowWarn(false);
  };

  const triggerPause = () => {
    setRunning(false);
    setShowWarn(false);
    onRequestAulaPause?.(5, atmosphere);
  };

  return (
    <>
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
                setWarned(false);
              }}
              className={`flex-1 text-[10px] font-mono py-1 rounded-sm transition-colors ${
                totalSec === m * 60 && !customOpen
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              {m}m
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCustomOpen((o) => !o)}
            className={`flex-1 text-[10px] font-mono py-1 rounded-sm transition-colors ${
              customOpen
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
            aria-label="Tempo personalizzato"
          >
            …
          </button>
        </div>

        {/* Input personalizzato */}
        {customOpen && (
          <div className="mt-2 flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              max={240}
              value={customMin}
              onChange={(e) => setCustomMin(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyCustom();
              }}
              className="flex-1 min-w-0 px-2 py-1 rounded-sm bg-background border border-border text-[11px] font-mono text-foreground focus:outline-none focus:border-primary"
              placeholder="min"
            />
            <button
              type="button"
              onClick={applyCustom}
              className="px-2 py-1 rounded-sm bg-primary/15 text-primary text-[10px] font-mono uppercase tracking-wider hover:bg-primary/25 transition-colors"
            >
              Applica
            </button>
          </div>
        )}

        {/* Selettore atmosfera per la schermata di pausa Aula */}
        {onRequestAulaPause && (
          <div className="mt-3 pt-3 border-t border-border/40">
            <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/70 mb-1.5">
              Atmosfera pausa
            </p>
            <div className="grid grid-cols-4 gap-1">
              {PAUSE_ATMOSPHERES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAtmosphere(a.id)}
                  className={`text-[9px] font-mono py-1 rounded-sm transition-colors ${
                    atmosphere === a.id
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                  title={a.label}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pausa Aula manuale */}
        {onRequestAulaPause && (
          <button
            type="button"
            onClick={triggerPause}
            disabled={aulaPaused}
            className={`mt-2 w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-sm text-[10px] font-mono uppercase tracking-wider transition-colors ${
              aulaPaused
                ? "bg-amber-500/10 text-amber-500/70 cursor-default"
                : "border border-border text-foreground/70 hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/40"
            }`}
          >
            <Coffee className="w-3 h-3" />
            {aulaPaused ? "Aula in pausa" : "Pausa aula"}
          </button>
        )}

        {/* DEV: Test Pausa — stesso canale della pausa reale, sincronizza Aula */}
        {onRequestAulaPause && import.meta.env.DEV && (
          <div className="mt-1.5 flex gap-1.5">
            <button
              type="button"
              onClick={() => onRequestAulaPause(5, atmosphere)}
              disabled={aulaPaused}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-sm border border-dashed border-amber-500/40 text-amber-500/80 text-[10px] font-mono uppercase tracking-wider hover:bg-amber-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Solo sviluppo — attiva pausa aula immediata (shortcut: P)"
            >
              <Coffee className="w-3 h-3" />
              Test pausa (dev)
            </button>
            {aulaPaused && onRequestAulaResume && (
              <button
                type="button"
                onClick={onRequestAulaResume}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-sm border border-dashed border-emerald-500/40 text-emerald-500/90 text-[10px] font-mono uppercase tracking-wider hover:bg-emerald-500/10 transition-colors"
                title="Esce dalla pausa di test e torna alla slide live precedente"
              >
                Riprendi da test
              </button>
            )}
          </div>
        )}
      </div>

      {/* POPUP WARNING -30s */}
      {showWarn && (
        <div
          role="alert"
          className="fixed bottom-4 right-4 z-[60] w-[300px] rounded-md border border-amber-500/40 bg-card/95 backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="p-3.5">
            <div className="flex items-start gap-2 mb-3">
              <span className="mt-0.5 inline-flex w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-500 mb-1">
                  Avviso tempo
                </p>
                <p className="text-sm text-foreground/90 leading-snug">
                  Sta per terminare il tempo
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowWarn(false)}
                aria-label="Chiudi avviso"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setShowWarn(false)}
                className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-sm border border-border text-foreground/80 text-[10px] font-mono uppercase tracking-wider hover:bg-secondary transition-colors"
              >
                <BellOff className="w-3 h-3" />
                Tacita
              </button>
              <button
                type="button"
                onClick={addTwoMinutes}
                className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-sm bg-primary/15 text-primary text-[10px] font-mono uppercase tracking-wider hover:bg-primary/25 transition-colors"
              >
                <Plus className="w-3 h-3" />
                2 min
              </button>
              <button
                type="button"
                onClick={triggerPause}
                disabled={!onRequestAulaPause}
                className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-sm bg-amber-500/15 text-amber-500 text-[10px] font-mono uppercase tracking-wider hover:bg-amber-500/25 transition-colors disabled:opacity-50"
              >
                <Coffee className="w-3 h-3" />
                Pausa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
