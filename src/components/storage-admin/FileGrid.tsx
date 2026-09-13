import { Film, Link2 } from "lucide-react";
import { humanSize, type StorageFile } from "@/lib/storageAdmin";

type Props = {
  files: StorageFile[];
  selected: Set<string>;
  usage: Record<string, string[]>;
  onToggle: (path: string) => void;
};

/** Griglia di miniature con casella di selezione multipla. */
export const FileGrid = ({ files, selected, usage, onToggle }: Props) => {
  if (files.length === 0) {
    return (
      <p className="p-8 text-sm text-muted-foreground">
        Nessun file in questa cartella.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {files.map((f) => {
        const on = selected.has(f.path);
        const used = (usage[f.path] ?? []).length > 0;
        return (
          <button
            key={f.path}
            type="button"
            onClick={() => onToggle(f.path)}
            className={`group relative overflow-hidden rounded-lg border text-left transition-colors ${
              on ? "border-primary ring-2 ring-primary/40" : "border-border/60 hover:border-border"
            }`}
          >
            <div className="relative flex aspect-video items-center justify-center bg-muted/40">
              {f.isVideo ? (
                <Film className="h-8 w-8 text-muted-foreground" />
              ) : (
                <img
                  src={f.url}
                  alt={f.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              )}
              <span
                className={`absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded border text-[11px] font-bold ${
                  on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background/80 text-transparent"
                }`}
              >
                ✓
              </span>
              {used && (
                <span
                  title="In uso in una schermata"
                  className="absolute right-2 top-2 rounded bg-background/85 p-1"
                >
                  <Link2 className="h-3.5 w-3.5 text-primary" />
                </span>
              )}
            </div>
            <div className="px-2 py-1.5">
              <p className="truncate text-xs text-foreground/90">{f.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {humanSize(f.size)}
                {f.updatedAt
                  ? ` · ${new Date(f.updatedAt).toLocaleDateString("it-IT")}`
                  : ""}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
