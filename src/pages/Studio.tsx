import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Upload, Trash2, Images, X } from "lucide-react";
import { useEditMode } from "@/lib/editMode";
import { studioCatalog } from "@/lib/studioCatalog";
import {
  clearPlaceholderImage,
  listLibrary,
  placeholderIdFor,
  setPlaceholderImage,
  uploadImage,
  usePlaceholderImage,
} from "@/lib/placeholderImages";

type LibraryItem = { path: string; url: string };

const Studio = () => {
  const editMode = useEditMode();
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [picker, setPicker] = useState<{ id: string; folder: string; label: string } | null>(
    null,
  );

  const refreshLibrary = () => listLibrary().then(setLibrary);

  useEffect(() => {
    if (editMode) refreshLibrary();
  }, [editMode]);

  const totale = useMemo(
    () =>
      studioCatalog.reduce(
        (n, m) => n + m.blocks.reduce((k, b) => k + b.placeholders.length, 0),
        0,
      ),
    [],
  );

  if (!editMode) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-foreground">Area non disponibile</h1>
          <p className="mt-3 text-muted-foreground">
            Questa pagina è riservata alla preparazione dei materiali.
          </p>
          <Link to="/" className="mt-6 inline-block text-primary hover:underline">
            Torna alla home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur px-6 md:px-10 py-5">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Studio</p>
            <h1 className="text-2xl md:text-3xl font-semibold mt-1">
              Gestione immagini delle schermate
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {totale} segnaposto · {library.length} immagini in libreria
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 space-y-14">
        {studioCatalog.map((mod) => (
          <section key={mod.slug}>
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border/60 pb-3 mb-6">
              <h2 className="text-xl md:text-2xl font-semibold">{mod.title}</h2>
              <a
                href={mod.aulaPath}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs uppercase tracking-widest text-primary hover:underline"
              >
                Apri la vista aula
              </a>
            </div>

            <div className="space-y-8">
              {mod.blocks.map((block) => (
                <article
                  key={block.blockId}
                  className="rounded-xl border border-border/60 bg-card/60 p-6 md:p-8"
                >
                  <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    {mod.folder} · {block.blockId}
                  </p>
                  <h3 className="text-lg md:text-2xl font-semibold mt-2">{block.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-foreground/80 max-w-4xl">
                    {block.notes}
                  </p>

                  {block.placeholders.length === 0 ? (
                    <p className="mt-5 text-sm text-muted-foreground">
                      Nessun segnaposto immagine in questa schermata.
                    </p>
                  ) : (
                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                      {block.placeholders.map((p) => (
                        <PlaceholderCard
                          key={p.label}
                          folder={mod.folder}
                          label={p.label}
                          onPick={(id) => setPicker({ id, folder: mod.folder, label: p.label })}
                        />
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      {picker && (
        <LibraryDialog
          library={library}
          folder={picker.folder}
          label={picker.label}
          onUploaded={refreshLibrary}
          onSelect={async (path) => {
            await setPlaceholderImage(picker.id, path);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </main>
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
      <div className="h-56 bg-muted/20 flex items-center justify-center">
        {url ? (
          <img src={url} alt={label} className="h-full w-full object-cover" />
        ) : (
          <p className="px-6 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Segnaposto vuoto
          </p>
        )}
      </div>
      <div className="p-4 space-y-3">
        <p className="text-sm leading-relaxed text-foreground/85">{label}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-md border border-primary/60 bg-primary/10 px-3 py-2 text-sm text-primary hover:bg-primary/20 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {busy ? "Caricamento…" : "Carica immagine"}
          </button>
          <button
            type="button"
            onClick={() => onPick(id)}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground/80 hover:text-foreground"
          >
            <Images className="w-4 h-4" />
            Scegli dalla libreria
          </button>
          {url && (
            <button
              type="button"
              onClick={() => clearPlaceholderImage(id)}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="w-4 h-4" />
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
            <p className="font-mono text-xs uppercase tracking-widest text-primary">Libreria</p>
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
          <p className="text-sm text-muted-foreground">Nessuna immagine nell'archivio.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {library.map((img) => (
              <button
                key={img.path}
                type="button"
                onClick={() => onSelect(img.path)}
                className="rounded-md overflow-hidden border border-border/60 hover:border-primary"
              >
                <img src={img.url} alt={img.path} className="w-full h-28 object-cover" />
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

export default Studio;
