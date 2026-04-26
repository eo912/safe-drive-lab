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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  // permette di aggiungere ai contenuti collegati della slide attiva
  onAttachToSlide?: (r: Resource) => void;
};

export const ArchiveDrawer = ({ open, onOpenChange, onAttachToSlide }: Props) => {
  const { items, add, remove } = useArchive();
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({
    kind: "link" as ResourceKind,
    title: "",
    description: "",
    url: "",
  });

  const reset = () => setDraft({ kind: "link", title: "", description: "", url: "" });

  const submit = () => {
    if (!draft.title.trim() || !draft.url.trim()) return;
    add({ ...draft, title: draft.title.trim(), url: draft.url.trim() });
    reset();
    setShowForm(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="p-0 w-[380px] sm:w-[480px] flex flex-col">
        <SheetHeader className="p-4 border-b border-border/60 text-left">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Archive className="w-3.5 h-3.5 text-primary" />
              <SheetTitle className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground font-normal">
                Archivio · {items.length}
              </SheetTitle>
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
        </SheetHeader>

        {showForm && (
          <div className="p-4 border-b border-border/60 bg-card/40 space-y-3">
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

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {items.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-12">
              Nessuna risorsa nell'archivio.
            </p>
          ) : (
            items.map((r) => {
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
                  <div className="flex items-center gap-1.5 mt-2">
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
                        Slide
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
      </SheetContent>
    </Sheet>
  );
};
