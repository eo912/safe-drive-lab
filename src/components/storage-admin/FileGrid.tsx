import { Film, Link2 } from "lucide-react";
import { humanSize, type StorageFile } from "@/lib/storageAdmin";

type Props = {
  files: StorageFile[];
  selected: Set<string>;
  usage: Record<string, string[]>;
  activePath?: string | null;
  onToggle: (path: string) => void;
  onOpen: (file: StorageFile) => void;
};

const STATO_STILE: Record<string, string> = {
  approvato: "bg-emerald-500/15 text-emerald-400",
  "da-valutare": "bg-amber-500/15 text-amber-400",
  scartato: "bg-red-500/15 text-red-400",
};

/**
 * Griglia di anteprime: il riquadro apre la scheda del file, la casella in
 * alto a sinistra serve per la selezione multipla.
 */
export const FileGrid = ({
  files,
  selected,
  usage,
  activePath,
  onToggle,
  onOpen,
}: Props) => {
  if (files.length === 0) {
    return (
      <p className="p-8 text-sm text-muted-foreground">
        Nessun file con questi filtri.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {files.map((f) => {
        const on = selected.has(f.path);
        const used = (usage[f.path] ?? []).length > 0;
        const attivo = activePath === f.path;
        const stato = f.meta?.stato ?? "";
        return (
          <div
            key={f.path}
            role="button"
            tabIndex={0}
            onClick={() => onOpen(f)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen(f);
              }
            }}
            className={`group relative cursor-pointer overflow-hidden rounded-lg border text-left transition-colors ${
              attivo
                ? "border-primary ring-2 ring-primary/50"
                : on
                  ? "border-primary/70 ring-1 ring-primary/30"
                  : "border-border/60 hover:border-border"
            }`}
          >
            <div className="relative flex aspect-video items-center justify-center bg-muted/40">
              {f.isVideo ? (
                <>
                  <video
                    src={`${f.url}#t=0.5`}
                    preload="metadata"
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                  <Film className="absolute h-7 w-7 text-white/80 drop-shadow" />
                </>
              ) : (
                <img
                  src={f.url}
                  alt={f.meta?.nome || f.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              )}
              <span
                role="checkbox"
                aria-checked={on}
                aria-label="Seleziona file"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(f.path);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggle(f.path);
                  }
                }}
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
              {stato && (
                <span
                  className={`absolute bottom-2 left-2 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    STATO_STILE[stato] ?? "bg-muted text-muted-foreground"
                  }`}
                >
                  {stato === "da-valutare" ? "da valutare" : stato}
                </span>
              )}
            </div>
            <div className="px-2 py-1.5">
              <p className="truncate text-xs text-foreground/90">
                {f.meta?.nome || f.name}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {humanSize(f.size)}
                {f.meta?.tag.length ? ` · ${f.meta.tag.join(", ")}` : ""}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
