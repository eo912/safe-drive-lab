import { Link2, Link2Off } from "lucide-react";
import { isSyncEnabled, setSyncEnabled, useSyncEnabled } from "@/lib/syncEnabled";

type Props = {
  className?: string;
};

/**
 * Unico controllo visibile della sincronizzazione, identico in Regia e Aula.
 * Diciture esatte: "SINCRONIZZAZIONE ON" / "SINCRONIZZAZIONE OFF".
 */
export const SyncToggle = ({ className = "" }: Props) => {
  const on = useSyncEnabled();
  return (
    <button
      type="button"
      onClick={() => setSyncEnabled(!isSyncEnabled())}
      aria-pressed={on}
      data-sync-toggle={on ? "on" : "off"}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border text-[11px] font-mono uppercase tracking-wider shrink-0 transition-colors ${
        on
          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
          : "border-border bg-secondary text-muted-foreground hover:bg-secondary/70"
      } ${className}`}
    >
      {on ? <Link2 className="w-3.5 h-3.5" /> : <Link2Off className="w-3.5 h-3.5" />}
      {on ? "SINCRONIZZAZIONE ON" : "SINCRONIZZAZIONE OFF"}
    </button>
  );
};
