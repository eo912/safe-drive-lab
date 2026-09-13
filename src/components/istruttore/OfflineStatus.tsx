import { useState } from "react";
import { CloudOff, DownloadCloud, Loader2 } from "lucide-react";
import { useOnline } from "@/lib/connectivity";
import { prepareOfflineSession } from "@/lib/placeholderImages";

/**
 * Indicatore discreto dello stato di connessione + comando per preparare
 * la sessione offline (scarica in anticipo le immagini dei moduli).
 */
export const OfflineStatus = () => {
  const online = useOnline();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [done, setDone] = useState(false);

  const prepare = async () => {
    setBusy(true);
    setDone(false);
    try {
      await prepareOfflineSession((d, t) => setProgress({ done: d, total: t }));
      setDone(true);
    } catch {
      setDone(false);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  if (!online) {
    return (
      <span
        title="Nessuna connessione: Regia e Aula restano sincronizzate, i contenuti arrivano dalla copia locale."
        className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-500 shrink-0"
      >
        <CloudOff className="h-3.5 w-3.5" />
        Offline
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={prepare}
      disabled={busy}
      title="Scarica ora i contenuti per poter lavorare senza connessione"
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-secondary transition-colors shrink-0 disabled:opacity-60"
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <DownloadCloud className="h-3.5 w-3.5" />
      )}
      <span className="hidden sm:inline">
        {busy
          ? progress
            ? `Preparo ${progress.done}/${progress.total}`
            : "Preparo…"
          : done
            ? "Pronto offline"
            : "Prepara offline"}
      </span>
    </button>
  );
};

/** Riquadro di avviso per le funzioni che richiedono internet. */
export const OfflineNotice = ({ what }: { what: string }) => (
  <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-500">
    <p className="flex items-center gap-2 font-medium">
      <CloudOff className="h-4 w-4" />
      Senza connessione
    </p>
    <p className="mt-1 text-amber-500/90">
      {what} richiede internet. Le schermate del corso continuano a funzionare
      normalmente in Regia e in Aula.
    </p>
  </div>
);
