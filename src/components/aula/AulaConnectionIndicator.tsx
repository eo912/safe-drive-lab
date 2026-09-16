import { RefreshCw, WifiOff } from "lucide-react";
import { useAulaConnectionStatus } from "@/lib/aulaSync";

/**
 * Indicatore minimale in Aula: invisibile a canale connesso, compare solo
 * mentre il canale realtime è disconnesso o in fase di riconnessione.
 */
export const AulaConnectionIndicator = () => {
  const status = useAulaConnectionStatus();
  if (status === "connected") return null;

  const reconnecting = status === "connecting";

  return (
    <div
      data-aula-conn-status={status}
      className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-md bg-background/70 backdrop-blur border border-amber-500/40 text-[11px] font-mono uppercase tracking-wider text-amber-500"
    >
      {reconnecting ? (
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <WifiOff className="w-3.5 h-3.5" />
      )}
      {reconnecting ? "Riconnessione..." : "Disconnesso"}
    </div>
  );
};
