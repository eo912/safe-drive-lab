import { useEffect, useRef, useState } from "react";
import { Plus, X, Upload, Trash2 } from "lucide-react";
import { useEditMode } from "@/lib/editMode";
import {
  clearPlaceholderImage,
  currentModuleFolder,
  listLibrary,
  placeholderId,
  setPlaceholderImage,
  uploadImage,
  usePlaceholderImage,
} from "@/lib/placeholderImages";

type Props = {
  /** Etichetta descrittiva del segnaposto: genera l'id stabile */
  label: string;
  className?: string;
  /** Contenuto segnaposto originale, mostrato quando non c'è immagine */
  children: React.ReactNode;
};

/**
 * Avvolge un segnaposto: se esiste un'immagine associata la mostra,
 * altrimenti lascia il segnaposto invariato. Il pulsante "+" compare
 * solo in modalità modifica.
 */
export const EditableImageSlot = ({ label, className = "", children }: Props) => {
  const editMode = useEditMode();
  const id = placeholderId(label);
  const url = usePlaceholderImage(id);
  const [open, setOpen] = useState(false);

  if (!url && !editMode) return <>{children}</>;

  return (
    <div className={`relative ${className}`}>
      {url ? (
        <img
          src={url}
          alt={label}
          className="w-full h-full object-cover rounded-lg border border-border/50"
        />
      ) : (
        children
      )}

      {editMode && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Modifica immagine: ${label}`}
          className="absolute top-2 right-2 z-30 w-8 h-8 rounded-full bg-background/85 border border-primary/70 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}

      {open && (
        <ImagePickerDialog
          id={id}
          label={label}
          hasImage={Boolean(url)}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
};

const ImagePickerDialog = ({
  id,
  label,
  hasImage,
  onClose,
}: {
  id: string;
  label: string;
  hasImage: boolean;
  onClose: () => void;
}) => {
  const [library, setLibrary] = useState<{ path: string; url: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listLibrary().then(setLibrary);
  }, []);

  const onUpload = async (file: File) => {
    setBusy(true);
    try {
      const path = await uploadImage(file, currentModuleFolder());
      await setPlaceholderImage(id, path);
      onClose();
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
        className="w-full max-w-3xl max-h-[80vh] overflow-y-auto rounded-lg border border-border bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-primary">
              Modalità modifica
            </p>
            <p className="text-sm text-foreground/80 mt-1">{label}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Chiudi">
            <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        <div className="flex flex-wrap gap-3 mb-5">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-md border border-primary/60 bg-primary/10 px-4 py-2 text-sm text-primary hover:bg-primary/20 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {busy ? "Caricamento…" : "Carica dal computer"}
          </button>
          {hasImage && (
            <button
              type="button"
              onClick={async () => {
                await clearPlaceholderImage(id);
                onClose();
              }}
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="w-4 h-4" />
              Rimuovi immagine
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
            }}
          />
        </div>

        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Immagini già caricate
        </p>
        {library.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessuna immagine nell'archivio.</p>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {library.map((img) => (
              <button
                key={img.path}
                type="button"
                onClick={async () => {
                  await setPlaceholderImage(id, img.path);
                  onClose();
                }}
                className="group rounded-md overflow-hidden border border-border/60 hover:border-primary"
              >
                <img src={img.url} alt={img.path} className="w-full h-24 object-cover" />
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
