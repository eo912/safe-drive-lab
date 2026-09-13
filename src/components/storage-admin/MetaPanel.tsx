import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { studioCatalog } from "@/lib/studioCatalog";
import {
  placeholderIdFor,
  setPlaceholderImage,
  setPlaceholderVideoPath,
} from "@/lib/placeholderImages";
import {
  parseTags,
  saveMediaAsset,
  STATI,
  TIPI,
  type MediaAsset,
  type MediaStato,
  type MediaTipo,
} from "@/lib/mediaAssets";
import {
  describePlaceholderId,
  moduliOptions,
  tipoFromName,
  type StorageFile,
} from "@/lib/storageAdmin";

type Props = {
  file: StorageFile;
  usage: Record<string, string[]>;
  categorie: string[];
  onClose: () => void;
  onSaved: () => void;
};

/** Pannello laterale: scheda del file e assegnazione a una schermata. */
export const MetaPanel = ({ file, usage, categorie, onClose, onSaved }: Props) => {
  const base: MediaAsset = useMemo(
    () =>
      file.meta ?? {
        storagePath: file.path,
        nome: file.name,
        tipo: tipoFromName(file.name),
        categoria: file.folder,
        modulo: null,
        tag: [],
        stato: "da-valutare",
        descrizione: null,
      },
    [file],
  );

  const [nome, setNome] = useState(base.nome);
  const [tipo, setTipo] = useState<MediaTipo>(base.tipo);
  const [categoria, setCategoria] = useState(base.categoria ?? "");
  const [modulo, setModulo] = useState(base.modulo ?? "");
  const [tag, setTag] = useState(base.tag.join(", "));
  const [stato, setStato] = useState<MediaStato>(base.stato);
  const [descrizione, setDescrizione] = useState(base.descrizione ?? "");
  const [salvando, setSalvando] = useState(false);
  const [esito, setEsito] = useState<string | null>(null);

  const [modSel, setModSel] = useState(studioCatalog[0]?.slug ?? "");
  const [slotSel, setSlotSel] = useState("");
  const [assegnando, setAssegnando] = useState(false);

  useEffect(() => {
    setNome(base.nome);
    setTipo(base.tipo);
    setCategoria(base.categoria ?? "");
    setModulo(base.modulo ?? "");
    setTag(base.tag.join(", "));
    setStato(base.stato);
    setDescrizione(base.descrizione ?? "");
    setEsito(null);
  }, [base]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const moduloCorrente = studioCatalog.find((m) => m.slug === modSel);
  const slots = useMemo(() => {
    if (!moduloCorrente) return [] as { id: string; label: string }[];
    const out: { id: string; label: string }[] = [];
    for (const b of moduloCorrente.blocks) {
      for (const p of b.placeholders) {
        out.push({
          id: placeholderIdFor(p.folder ?? moduloCorrente.folder, p.label),
          label: `${b.title} · ${p.label}`,
        });
      }
    }
    return out;
  }, [moduloCorrente]);

  useEffect(() => {
    setSlotSel(slots[0]?.id ?? "");
  }, [slots]);

  const salva = async () => {
    setSalvando(true);
    try {
      await saveMediaAsset({
        storagePath: file.path,
        nome: nome.trim() || file.name,
        tipo,
        categoria: categoria.trim() || null,
        modulo: modulo || null,
        tag: parseTags(tag),
        stato,
        descrizione: descrizione.trim() || null,
      });
      setEsito("Scheda salvata.");
      onSaved();
    } catch (e) {
      setEsito(e instanceof Error ? e.message : "Salvataggio non riuscito.");
    } finally {
      setSalvando(false);
    }
  };

  const assegna = async () => {
    if (!slotSel) return;
    setAssegnando(true);
    try {
      if (file.isVideo) await setPlaceholderVideoPath(slotSel, file.path);
      else await setPlaceholderImage(slotSel, file.path);
      setEsito("Assegnato alla schermata scelta.");
      onSaved();
    } catch (e) {
      setEsito(e instanceof Error ? e.message : "Assegnazione non riuscita.");
    } finally {
      setAssegnando(false);
    }
  };

  const usato = usage[file.path] ?? [];
  const input =
    "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm";

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-auto border-l border-border/60 bg-background">
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
        <h2 className="truncate text-sm font-semibold">{file.name}</h2>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4">
        <div className="overflow-hidden rounded-lg border border-border/60 bg-muted/30">
          {file.isVideo ? (
            <video src={file.url} controls className="aspect-video w-full" />
          ) : (
            <img src={file.url} alt={file.name} className="aspect-video w-full object-cover" />
          )}
        </div>
        <p className="mt-2 break-all text-[11px] text-muted-foreground">{file.path}</p>
      </div>

      <div className="space-y-3 px-4 pb-4">
        <div>
          <label className="text-xs uppercase tracking-wide text-muted-foreground">Titolo</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} className={input} />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide text-muted-foreground">Tipo</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as MediaTipo)}
            className={input}
          >
            {TIPI.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide text-muted-foreground">
            Categoria
          </label>
          <input
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            list="categorie-note"
            className={input}
          />
          <datalist id="categorie-note">
            {categorie.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide text-muted-foreground">
            Modulo di riferimento
          </label>
          <select value={modulo} onChange={(e) => setModulo(e.target.value)} className={input}>
            <option value="">Nessuno</option>
            {moduliOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide text-muted-foreground">
            Tag (separati da virgola)
          </label>
          <input value={tag} onChange={(e) => setTag(e.target.value)} className={input} />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide text-muted-foreground">Stato</label>
          <select
            value={stato}
            onChange={(e) => setStato(e.target.value as MediaStato)}
            className={input}
          >
            {STATI.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide text-muted-foreground">
            Descrizione
          </label>
          <textarea
            value={descrizione}
            onChange={(e) => setDescrizione(e.target.value)}
            rows={3}
            className={input}
          />
        </div>

        <button
          type="button"
          disabled={salvando}
          onClick={salva}
          className="w-full rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
        >
          {salvando ? "Salvataggio…" : "Salva scheda"}
        </button>
        {esito && <p className="text-xs text-muted-foreground">{esito}</p>}
      </div>

      <div className="border-t border-border/60 p-4">
        <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Usato in</h3>
        {usato.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">Non ancora usato.</p>
        ) : (
          <ul className="mt-1 space-y-1 text-sm">
            {usato.map((id) => (
              <li key={id}>{describePlaceholderId(id)}</li>
            ))}
          </ul>
        )}

        <h3 className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">
          Assegna a una schermata
        </h3>
        <select
          value={modSel}
          onChange={(e) => setModSel(e.target.value)}
          className={input}
        >
          {studioCatalog.map((m) => (
            <option key={m.slug} value={m.slug}>
              {m.title}
            </option>
          ))}
        </select>
        <select
          value={slotSel}
          onChange={(e) => setSlotSel(e.target.value)}
          className={input}
        >
          {slots.length === 0 && <option value="">Nessun segnaposto in questo modulo</option>}
          {slots.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={assegnando || !slotSel}
          onClick={assegna}
          className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/60 disabled:opacity-50"
        >
          {assegnando ? "Assegnazione…" : "Assegna questo file"}
        </button>
      </div>
    </aside>
  );
};
