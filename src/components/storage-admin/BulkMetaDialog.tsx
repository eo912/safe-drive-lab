import { useState } from "react";
import {
  parseTags,
  saveMediaAssetsBulk,
  STATI,
  type MediaAsset,
  type MediaStato,
  type MetaPatch,
} from "@/lib/mediaAssets";
import { moduliOptions, tipoFromName } from "@/lib/storageAdmin";

type Props = {
  paths: string[];
  existing: Record<string, MediaAsset>;
  onClose: () => void;
  onDone: () => void;
};

/** Applica categoria, modulo, stato e tag a tutti i file selezionati. */
export const BulkMetaDialog = ({ paths, existing, onClose, onDone }: Props) => {
  const [categoria, setCategoria] = useState("");
  const [modulo, setModulo] = useState("");
  const [stato, setStato] = useState("");
  const [tag, setTag] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  const applica = async () => {
    const patch: MetaPatch = {};
    if (categoria.trim()) patch.categoria = categoria.trim();
    if (modulo) patch.modulo = modulo;
    if (stato) patch.stato = stato as MediaStato;
    const tags = parseTags(tag);
    if (tags.length > 0) patch.tag = tags;

    setSalvando(true);
    try {
      await saveMediaAssetsBulk(paths, patch, existing, (p) =>
        tipoFromName(p.split("/").pop() ?? p),
      );
      onDone();
      onClose();
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Non è stato possibile salvare.");
    } finally {
      setSalvando(false);
    }
  };

  const input = "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-5">
        <h2 className="text-base font-semibold">Modifica {paths.length} file</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          I campi lasciati vuoti restano come sono. I tag si aggiungono a quelli già presenti.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs uppercase tracking-wide text-muted-foreground">
              Categoria
            </label>
            <input value={categoria} onChange={(e) => setCategoria(e.target.value)} className={input} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-muted-foreground">
              Modulo di riferimento
            </label>
            <select value={modulo} onChange={(e) => setModulo(e.target.value)} className={input}>
              <option value="">Invariato</option>
              {moduliOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-muted-foreground">Stato</label>
            <select value={stato} onChange={(e) => setStato(e.target.value)} className={input}>
              <option value="">Invariato</option>
              {STATI.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-muted-foreground">
              Tag da aggiungere (separati da virgola)
            </label>
            <input value={tag} onChange={(e) => setTag(e.target.value)} className={input} />
          </div>
        </div>

        {errore && <p className="mt-3 text-sm text-destructive">{errore}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/60"
          >
            Annulla
          </button>
          <button
            type="button"
            disabled={salvando}
            onClick={applica}
            className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            {salvando ? "Salvataggio…" : "Applica"}
          </button>
        </div>
      </div>
    </div>
  );
};
