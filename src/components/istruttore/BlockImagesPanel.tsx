import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, Images, X } from "lucide-react";
import { studioCatalog } from "@/lib/studioCatalog";
import {
  clearPlaceholderImage,
  ICON_FOLDER,
  iconIdFor,
  listLibrary,
  placeholderIdFor,
  setPlaceholderImage,
  uploadImage,
  usePlaceholderImage,
} from "@/lib/placeholderImages";

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
  const [picker, setPicker] = useState<{ id: string; label: string } | null>(
    null,
  );

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

      {!block || block.placeholders.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Nessun segnaposto immagine in questa schermata.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {block.placeholders.map((p) => (
            <PlaceholderCard
              key={p.label}
              folder={folder}
              label={p.label}
              onPick={(id) => setPicker({ id, label: p.label })}
            />
          ))}
        </div>
      )}

      {picker && (
        <LibraryDialog
          library={library}
          folder={folder}
          label={picker.label}
          onUploaded={refreshLibrary}
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const path = await uploadImage(file, folder);
      await setPlaceholderImage(id, path);
    } finally {
      setBusy(false);
    }
  };

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
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-md border border-primary/60 bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/20 disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            {busy ? "Caricamento…" : "Carica immagine"}
          </button>
          <button
            type="button"
            onClick={() => onPick(id)}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-foreground/80 hover:text-foreground"
          >
            <Images className="w-3.5 h-3.5" />
            Scegli dalla libreria
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
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
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
  onClose,
}: {
  library: LibraryItem[];
  folder: string;
  label: string;
  onSelect: (path: string) => void;
  onUploaded: () => void;
  onClose: () => void;
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

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
              <button
                key={img.path}
                type="button"
                onClick={() => onSelect(img.path)}
                className="rounded-md overflow-hidden border border-border/60 hover:border-primary"
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
