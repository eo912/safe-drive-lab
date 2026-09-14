import { Wifi, WifiOff, Coffee, AlertTriangle } from "lucide-react";
import type { AulaHeartbeat } from "@/lib/aulaSync";
import type { ModuleBlock } from "@/lib/moduleBlocks";
import { getAtmosphere } from "@/lib/pauseAtmosphere";
import { modules } from "@/lib/modules";

type Props = {
  blocks: ModuleBlock[];
  /** Dati forniti dalla Regia: una sola sottoscrizione per pagina. */
  heartbeat: AulaHeartbeat | null;
  online: boolean;
  sinceMs: number;
  foreignModulo: string | null;
};

const fmtSince = (ms: number) => {
  if (!isFinite(ms)) return "—";
  if (ms < 1000) return `${(ms / 1000).toFixed(1)} sec`;
  if (ms < 60_000) return `${Math.floor(ms / 1000)} sec fa`;
  return `${Math.floor(ms / 60_000)} min fa`;
};

/**
 * Indicatore Aula online/offline + ultimo sync.
 * Riceve heartbeat dall'Aula reale ogni ~1.5s. Se non arriva nulla per
 * oltre 6s, mostra stato offline con tempo trascorso dall'ultimo contatto.
 *
 * Caso a parte: Aula raggiungibile ma su un ALTRO modulo. Non è offline,
 * è disallineata — e va detto chiaramente, perché in quel caso i comandi
 * della Regia non arrivano alla schermata proiettata.
 *
 * Volutamente non-tecnico: niente ping/log/diagnostica.
 */
export const AulaStatusBadge = ({
  blocks,
  heartbeat,
  online,
  sinceMs,
  foreignModulo,
}: Props) => {
  const block = heartbeat
    ? blocks.find((b) => b.id === heartbeat.blocco) ?? null
    : null;
  const atm = heartbeat?.paused
    ? getAtmosphere(heartbeat.pauseAtmosphere)
    : null;

  if (foreignModulo) {
    const other = modules.find((m) => m.slug === foreignModulo);
    return (
      <div
        className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-amber-500/50 bg-amber-500/10 text-amber-400 shrink-0"
        title="L'Aula sta mostrando un altro modulo: i comandi della Regia non la raggiungono."
        aria-live="polite"
      >
        <AlertTriangle className="w-3 h-3" />
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] font-mono uppercase tracking-wider">
            Aula su altro modulo
          </span>
          <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
            {other ? other.title : foreignModulo} · allineamento in corso
          </span>
        </div>
      </div>
    );
  }

  const liveLabel = !heartbeat
    ? "Mai connessa"
    : heartbeat.paused
      ? `Pausa${atm ? ` – ${atm.label}` : ""}`
      : block
        ? `${String(block.index).padStart(2, "0")} · ${block.title}`
        : "—";

  return (
    <div
      className={`hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-[10px] font-mono uppercase tracking-wider shrink-0 transition-colors ${
        online
          ? heartbeat?.paused
            ? "border-amber-500/40 bg-amber-500/5 text-amber-500"
            : "border-emerald-500/40 bg-emerald-500/5 text-emerald-500"
          : "border-red-500/40 bg-red-500/5 text-red-500"
      }`}
      title={
        online
          ? `Aula online · sync ${fmtSince(sinceMs)}`
          : heartbeat
            ? `Aula offline · ultimo contatto ${fmtSince(sinceMs)}`
            : "Aula non ancora connessa"
      }
      aria-live="polite"
    >
      <span className="relative flex items-center justify-center">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            online
              ? heartbeat?.paused
                ? "bg-amber-500"
                : "bg-emerald-500 animate-pulse"
              : "bg-red-500"
          }`}
        />
      </span>
      {online ? (
        heartbeat?.paused ? (
          <Coffee className="w-3 h-3" />
        ) : (
          <Wifi className="w-3 h-3" />
        )
      ) : (
        <WifiOff className="w-3 h-3" />
      )}
      <div className="flex flex-col leading-tight normal-case tracking-normal font-sans">
        <span className="text-[10px] font-mono uppercase tracking-wider">
          {online ? "Aula online" : "Aula offline"}
        </span>
        <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
          {online
            ? `${liveLabel} · sync ${fmtSince(sinceMs)}`
            : heartbeat
              ? `Ultimo contatto: ${fmtSince(sinceMs)}`
              : "In attesa di Aula"}
        </span>
      </div>
    </div>
  );
};
