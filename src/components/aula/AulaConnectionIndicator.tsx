import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useAulaConnectionStatus } from "@/lib/aulaSync";
import { ROOM_ID } from "@/lib/aulaRoom";

/**
 * Stato del canale e room visibile: consente di riconoscere subito quando
 * Regia e Aula sono state aperte in stanze diverse.
 */
export const AulaConnectionIndicator = () => {
  const status = useAulaConnectionStatus();
  const reconnecting = status === "connecting";
  const connected = status === "connected";

  return (
    <div
      data-aula-conn-status={status}
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-md bg-background/70 backdrop-blur border text-[11px] font-mono uppercase tracking-wider ${
        connected
          ? "border-emerald-500/40 text-emerald-500"
          : "border-amber-500/40 text-amber-500"
      }`}
    >
      {connected ? (
        <Wifi className="w-3.5 h-3.5" />
      ) : reconnecting ? (
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <WifiOff className="w-3.5 h-3.5" />
      )}
      <span>{connected ? "Canale attivo" : reconnecting ? "Riconnessione..." : "Disconnesso"}</span>
      <span className="normal-case text-foreground/70">Room {ROOM_ID}</span>
    </div>
  );
};
