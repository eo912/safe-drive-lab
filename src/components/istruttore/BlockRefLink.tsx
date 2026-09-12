import { useEffect, useState } from "react";
import { ExternalLink, Link2, Trash2 } from "lucide-react";
import { clearRefLink, setRefLink, useRefLink } from "@/lib/placeholderImages";

type Props = {
  modulo: string;
  blocco: string;
};

/**
 * Link di riferimento del blocco: utile all'istruttore (video YouTube di
 * ispirazione, articoli, schede tecniche). Salvato nel database insieme alle
 * altre associazioni, MAI mostrato in Aula.
 */
export const BlockRefLink = ({ modulo, blocco }: Props) => {
  const saved = useRefLink(modulo, blocco);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setDraft("");
    setErr(null);
  }, [modulo, blocco]);

  const save = async () => {
    const url = draft.trim();
    if (!url) return;
    setBusy(true);
    setErr(null);
    try {
      await setRefLink(modulo, blocco, url);
      setDraft("");
    } catch {
      setErr("Link non salvato. Riprova.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 pt-4 border-t border-border/60">
      <p className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        <Link2 className="w-3.5 h-3.5" />
        Link di riferimento
      </p>

      {saved && (
        <div className="mb-2 flex items-start gap-2">
          <a
            href={saved}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-w-0 items-center gap-1.5 text-xs text-primary underline underline-offset-2 hover:text-primary/80"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{saved}</span>
          </a>
          <button
            type="button"
            onClick={() => clearRefLink(modulo, blocco)}
            aria-label="Rimuovi link di riferimento"
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="url"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
          }}
          placeholder={saved ? "Sostituisci con un altro link…" : "Incolla un link (YouTube, articolo…)"}
          aria-label="Link di riferimento per l'istruttore"
          className="min-w-0 flex-1 rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <button
          type="button"
          disabled={busy || draft.trim() === ""}
          onClick={save}
          className="rounded-md border border-primary/60 bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/20 disabled:opacity-50"
        >
          Salva
        </button>
      </div>
      {err && <p className="mt-2 text-[11px] text-destructive">{err}</p>}

      <p className="mt-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
        Suggerimenti didattici · mai visibili in Aula
      </p>
    </div>
  );
};
