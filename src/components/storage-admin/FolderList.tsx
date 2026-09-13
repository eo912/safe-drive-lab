import { folderLabel } from "@/lib/storageAdmin";

type Props = {
  folders: string[];
  counts: Record<string, number>;
  active: string;
  onSelect: (folder: string) => void;
};

/** Colonna laterale con le categorie (cartelle) del bucket. */
export const FolderList = ({ folders, counts, active, onSelect }: Props) => (
  <nav className="flex w-56 shrink-0 flex-col gap-1 border-r border-border/60 p-3">
    <p className="px-2 pb-2 text-xs uppercase tracking-widest text-muted-foreground">
      Categorie
    </p>
    {folders.map((f) => {
      const on = f === active;
      return (
        <button
          key={f}
          type="button"
          onClick={() => onSelect(f)}
          className={`flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
            on
              ? "bg-primary/15 text-primary"
              : "text-foreground/80 hover:bg-muted/60"
          }`}
        >
          <span className="truncate">{folderLabel(f)}</span>
          {counts[f] !== undefined && (
            <span className="ml-2 shrink-0 text-xs text-muted-foreground">
              {counts[f]}
            </span>
          )}
        </button>
      );
    })}
  </nav>
);
