import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, Images, X } from "lucide-react";
import { studioCatalog } from "@/lib/studioCatalog";
import {
  clearPlaceholderImage,
  deleteLibraryImage,
  ICON_FOLDER,
  iconIdFor,
  listLibrary,
  placeholderIdFor,
  placeholderIdsUsingPath,
  setPlaceholderImage,
  uploadImage,
  usePlaceholderImage,
} from "@/lib/placeholderImages";

/** Etichetta leggibile ("Modulo 2 · Il fattore umano") per un id segnaposto. */
const describePlaceholderId = (id: string) => {
  for (const m of studioCatalog) {
    for (const b of m.blocks) {
      for (const p of b.placeholders) {
        if (placeholderIdFor(p.folder ?? m.folder, p.label) === id)
          return `${m.title} · ${b.title}`;
      }
      for (const ic of b.icons) {
        if (iconIdFor(m.folder, ic.label) === id)
          return `${m.title} · ${b.title} (icona ${ic.label})`;
      }
    }
  }
  return id;
};

type LibraryItem = { path: string; url: string };

type Props = {
  /** Slug del modulo (es. modulo-3-il-conducente). */
  modulo: string;
  /** Id del blocco attualmente selezionato nella scaletta. */
  blocco: string;
};

/**
 * Pannello Studio (Regia) per associare immagini reali ai segnaposto della
 * schermata selezionata. Salva su Supabase (bucket course-images + tabella
 * placeholder_images): la scelta compare subito nella vista Aula.
 */
export const BlockImagesPanel = ({ modulo, blocco }: Props) => {
  const mod = studioCatalog.find((m) => m.slug === modulo);
  const block = mod?.blocks.find((b) => b.blockId === blocco);
  const folder = mod?.folder ?? "generico";

  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [picker, setPicker] = useState<{
    id: string;
    label: string;
    folder: string;
  } | null>(null);

  const refreshLibrary = () => listLibrary().then(setLibrary);

  useEffect(() => {
    refreshLibrary();
  }, []);

  return (
    <div className="rounded-md border border-border p-4 bg-card/40">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
          Immagini della schermata
        </p>
        <p className="text-[10px] font-mono text-muted-foreground">
          {library.length} in libreria
        </p>
      </div>

      {!block || (block.placeholders.length === 0 && block.icons.length === 0) ? (
        <p className="text-xs text-muted-foreground">
          Nessun segnaposto immagine in questa schermata.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {block.placeholders.map((p) => (
            <PlaceholderCard
              key={p.label}
              folder={p.folder ?? folder}
              label={p.label}
              onPick={(id) =>
                setPicker({ id, label: p.label, folder: p.folder ?? folder })
              }
            />
          ))}
        </div>
      )}

      {block && block.icons.length > 0 && (
        <div className="mt-6 border-t border-border/60 pt-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground mb-3">
            Icone delle tessere
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {block.icons.map((ic) => (
              <IconCard
                key={ic.label}
                folder={folder}
                label={ic.label}
                onPick={(id) =>
                  setPicker({ id, label: ic.label, folder: ICON_FOLDER })
                }
              />
            ))}
          </div>
        </div>
      )}

      {picker && (
        <LibraryDialog
          library={library}
          folder={picker.folder}
          label={picker.label}
          onUploaded={refreshLibrary}
          onDeleted={refreshLibrary}
          onSelect={async (path) => {
            await setPlaceholderImage(picker.id, path);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
};

/**
 * Tessera con icona: caricamento di una singola icona (PNG/SVG) o scelta
 * dalla libreria icone. Formato piccolo, distinto dalle foto grandi.
 */
const IconCard = ({
  folder,
  label,
  onPick,
}: {
  folder: string;
  label: string;
  onPick: (id: string) => void;
}) => {
  const id = iconIdFor(folder, label);
  const url = usePlaceholderImage(id);

  return (
    <div className="rounded-lg border border-border/60 bg-background/60 p-3 flex items-center gap-3">
      <div className="w-12 h-12 shrink-0 rounded-md border border-border/50 bg-muted/20 flex items-center justify-center overflow-hidden">
        {url ? (
          <img src={url} alt={label} className="w-full h-full object-contain" />
        ) : (
          <span className="font-mono text-[9px] text-muted-foreground">icona</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-foreground/85 truncate">{label}</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onPick(id)}
            className="rounded-md border border-primary/60 bg-primary/10 px-2 py-1 text-[11px] text-primary hover:bg-primary/20"
          >
            Scegli icona
          </button>
          {url && (
            <button
              type="button"
              onClick={() => clearPlaceholderImage(id)}
              className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              Rimuovi
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const PlaceholderCard = ({
  folder,
  label,
  onPick,
}: {
  folder: string;
  label: string;
  onPick: (id: string) => void;
}) => {
  const id = placeholderIdFor(folder, label);
  const url = usePlaceholderImage(id);

  return (
    <div className="rounded-lg border border-border/60 bg-background/60 overflow-hidden">
      <div className="h-40 bg-muted/20 flex items-center justify-center">
        {url ? (
          <img src={url} alt={label} className="h-full w-full object-cover" />
        ) : (
          <p className="px-4 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Segnaposto vuoto
          </p>
        )}
      </div>
      <div className="p-3 space-y-2">
        <p className="text-xs leading-relaxed text-foreground/85">{label}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onPick(id)}
            className="inline-flex items-center gap-2 rounded-md border border-primary/60 bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/20"
          >
            <Images className="w-3.5 h-3.5" />
            Scegli immagine
          </button>
          {url && (
            <button
              type="button"
              onClick={() => clearPlaceholderImage(id)}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Rimuovi
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const LibraryDialog = ({
  library,
  folder,
  label,
  onSelect,
  onUploaded,
  onDeleted,
  onClose,
}: {
  library: LibraryItem[];
  folder: string;
  label: string;
  onSelect: (path: string) => void;
  onUploaded: () => void;
  onDeleted: () => void;
  onClose: () => void;
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onDelete = async (path: string) => {
    const used = placeholderIdsUsingPath(path);
    const message =
      used.length > 0
        ? `Questa immagine è usata in:\n\n${used
            .map((id) => `• ${describePlaceholderId(id)}`)
            .join("\n")}\n\nEliminandola quelle schermate torneranno senza immagine. Eliminare comunque?`
        : "Eliminare questa immagine dalla libreria?";
    if (!window.confirm(message)) return;
    setBusy(true);
    try {
      await deleteLibraryImage(path);
      onDeleted();
    } finally {
      setBusy(false);
    }
  };


  return (
    <div
      className="fixed inset-0 z-[200] bg-background/90 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-lg border border-border bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-primary">
              Libreria
            </p>
            <p className="text-sm text-foreground/80 mt-1">{label}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Chiudi">
            <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="mb-6 inline-flex items-center gap-2 rounded-md border border-primary/60 bg-primary/10 px-4 py-2 text-sm text-primary hover:bg-primary/20 disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {busy ? "Caricamento…" : "Carica una nuova immagine"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setBusy(true);
            try {
              const path = await uploadImage(f, folder);
              onUploaded();
              onSelect(path);
            } finally {
              setBusy(false);
            }
          }}
        />

        {library.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nessuna immagine nell'archivio.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {library.map((img) => (
              <div
                key={img.path}
                className="group relative rounded-md overflow-hidden border border-border/60 hover:border-primary"
              >
                <button
                  type="button"
                  onClick={() => onSelect(img.path)}
                  className="block w-full text-left"
                >
                  <img
                    src={img.url}
                    alt={img.path}
                    className="w-full h-28 object-cover"
                  />
                  <span className="block px-2 py-1 text-[10px] font-mono text-muted-foreground truncate">
                    {img.path}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Elimina ${img.path}`}
                  onClick={() => onDelete(img.path)}
                  className="absolute top-1.5 right-1.5 rounded-md border border-destructive/60 bg-background/85 p-1.5 text-destructive opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 hover:bg-destructive/15"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
