import { useState } from "react";
import {
  Archive,
  Plus,
  Trash2,
  ExternalLink,
  Video,
  Image as ImageIcon,
  FileText,
  Link as LinkIcon,
  FileType,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useArchive } from "@/lib/instructorStorage";
import type { Resource, ResourceKind } from "@/lib/instructorTypes";

const kindMeta: Record<ResourceKind, { label: string; icon: typeof Video }> = {
  video: { label: "Video", icon: Video },
  image: { label: "Immagine", icon: ImageIcon },
  document: { label: "Documento", icon: FileText },
  link: { label: "Link", icon: LinkIcon },
  pdf: { label: "PDF", icon: FileType },
};

const KIND_FILTERS: (ResourceKind | "all")[] = [
  "all",
  "video",
  "image",
  "document",
  "link",
  "pdf",
];

type Props = {
  onAttachToSlide?: (r: Resource) => void;
  attachLabel?: string;
};

/**
 * Pannello Archivio inline (versione "page") — stessa logica del drawer
 * ma pensato per occupare un'area dedicata nell'interfaccia regia.
 */
export const ArchivePanel = ({ onAttachToSlide, attachLabel = "Slide" }: Props) => {
  const { items, add, remove } = useArchive();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<ResourceKind | "all">("all");
  const [draft, setDraft] = useState({
    kind: "link" as ResourceKind,
    title: "",
    description: "",
    url: "",
  });

  const reset = () =>
    setDraft({ kind: "link", title: "", description: "", url: "" });

  const submit = () => {
    if (!draft.title.trim() || !draft.url.trim()) return;
    add({ ...draft, title: draft.title.trim(), url: draft.url.trim() });
    reset();
    setShowForm(false);
  };

  const filtered = filter === "all" ? items : items.filter((r) => r.kind === filter);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Archive className="w-3.5 h-3.5 text-primary" />
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
            Archivio · {items.length}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Aggiungi
        </button>
      </div>

      {/* Filtri tipo */}
      <div className="flex flex-wrap gap-1.5 py-3">
        {KIND_FILTERS.map((k) => {
          const active = filter === k;
          const label = k === "all" ? "Tutti" : kindMeta[k].label;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={`px-2 py-1 rounded-md border text-[10px] font-mono uppercase tracking-wider transition-colors ${
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {showForm && (
        <div className="p-4 mb-3 border border-border rounded-md bg-card/40 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(kindMeta) as ResourceKind[]).map((k) => {
              const M = kindMeta[k];
              const active = draft.kind === k;
              const Icon = M.icon;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, kind: k }))}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] transition-colors ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {M.label}
                </button>
              );
            })}
          </div>
          <Input
            placeholder="Titolo *"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          />
          <Input
            placeholder="URL *"
            value={draft.url}
            onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
          />
          <Textarea
            placeholder="Descrizione breve"
            value={draft.description}
            onChange={(e) =>
              setDraft((d) => ({ ...d, description: e.target.value }))
            }
            className="min-h-[60px] text-sm"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                reset();
                setShowForm(false);
              }}
              className="px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!draft.title.trim() || !draft.url.trim()}
              className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Salva
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
        {filtered.length === 0 ? (
          <p className="col-span-full text-center text-xs text-muted-foreground py-12">
            Nessuna risorsa.
          </p>
        ) : (
          filtered.map((r) => {
            const Icon = kindMeta[r.kind].icon;
            return (
              <div
                key={r.id}
                className="border border-border rounded-md p-3 bg-card/40 hover:bg-card/70 transition-colors"
              >
                <div className="flex items-start gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm font-medium text-foreground/90 leading-tight flex-1 min-w-0">
                    {r.title}
                  </p>
                </div>
                {r.description && (
                  <p className="text-[11px] text-muted-foreground mb-2 line-clamp-2">
                    {r.description}
                  </p>
                )}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-sm border border-border text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Apri
                  </a>
                  {onAttachToSlide && (
                    <button
                      type="button"
                      onClick={() => onAttachToSlide(r)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-sm bg-primary/10 text-primary text-[10px] font-mono uppercase tracking-wider hover:bg-primary/20 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      {attachLabel}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(r.id)}
                    className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Rimuovi dall'archivio"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
