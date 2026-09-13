import { FolderInput, Tags, Trash2, X } from "lucide-react";

type Props = {
  count: number;
  busy: boolean;
  onMove: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClear: () => void;
};

/** Barra azioni visibile solo con almeno un file selezionato. */
export const BulkActionsBar = ({
  count,
  busy,
  onMove,
  onEdit,
  onDelete,
  onClear,
}: Props) => {
  if (count === 0) return null;
  return (
    <div className="sticky bottom-0 z-10 flex items-center gap-3 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur">
      <span className="text-sm text-foreground/90">{count} selezionati</span>
      <button
        type="button"
        disabled={busy}
        onClick={onMove}
        className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted/60 disabled:opacity-50"
      >
        <FolderInput className="h-4 w-4" /> Sposta in…
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onEdit}
        className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted/60 disabled:opacity-50"
      >
        <Tags className="h-4 w-4" /> Modifica schede…
      </button>

      <button
        type="button"
        disabled={busy}
        onClick={onDelete}
        className="flex items-center gap-2 rounded-md border border-destructive/60 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" /> Elimina selezionati
      </button>
      <button
        type="button"
        onClick={onClear}
        className="ml-auto flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" /> Deseleziona
      </button>
    </div>
  );
};
