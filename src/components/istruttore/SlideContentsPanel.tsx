import { useState } from "react";
import {
  Plus,
  ExternalLink,
  Trash2,
  Video,
  Image as ImageIcon,
  FileText,
  Link as LinkIcon,
  FileType,
  Monitor,
  EyeOff,
  Paperclip,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLinkedContent } from "@/lib/instructorStorage";
import type { Resource, ResourceKind } from "@/lib/instructorTypes";

const kindMeta: Record<ResourceKind, { label: string; icon: typeof Video }> = {
  video: { label: "Video", icon: Video },
  image: { label: "Immagine", icon: ImageIcon },
  document: { label: "Documento", icon: FileText },
  link: { label: "Link", icon: LinkIcon },
  pdf: { label: "PDF", icon: FileType },
};

type Props = {
  modulo: string;
  blocco: string;
  // media correntemente proiettato in Aula (per evidenziare e disabilitare)
  liveMediaId: string | null;
  onProject: (r: Resource) => void;
  onHide: () => void;
  onOpenArchive: () => void;
};

/**
 * Sezione "Contenuti collegati" alla slide selezionata.
 * - Aggiungere risorse direttamente o dall'archivio
 * - Mostrare/nascondere in Aula con controllo manuale (no autoplay)
 * - Mai visibile in Aula
 */
export const SlideContentsPanel = ({
  modulo,
  blocco,
  liveMediaId,
  onProject,
  onHide,
  onOpenArchive,
}: Props) => {
  const { items, add, remove } = useLinkedContent(modulo, blocco);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({
    kind: "image" as ResourceKind,
    title: "",
    description: "",
    url: "",
  });

  const reset = () =>
    setDraft({ kind: "image", title: "", description: "", url: "" });

  const submit = () => {
    if (!draft.title.trim() || !draft.url.trim()) return;
    add({ ...draft, title: draft.title.trim(), url: draft.url.trim() });
    reset();
    setShowForm(false);
  };

  return (
    <section
      aria-label="Contenuti collegati alla slide"
      className="mt-8 border border-border/60 rounded-lg bg-card/30"
    >
      <header className="flex items-center justify-between gap-2 p-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Paperclip className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
            Contenuti collegati · {items.length}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          {liveMediaId && (
            <button
              type="button"
              onClick={onHide}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-sm border border-amber-500/40 bg-amber-500/10 text-amber-500 text-[10px] font-mono uppercase tracking-wider hover:bg-amber-500/20 transition-colors"
            >
              <EyeOff className="w-3 h-3" />
              Nascondi media
            </button>
          )}
          <button
            type="button"
            onClick={onOpenArchive}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-sm border border-border text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            Archivio
          </button>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-sm bg-primary/10 text-primary text-[10px] font-mono uppercase tracking-wider hover:bg-primary/20 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Aggiungi
          </button>
        </div>
      </header>

      {showForm && (
        <div className="p-3 border-b border-border/60 space-y-2 bg-background/40">
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(kindMeta) as ResourceKind[]).map((k) => {
              const M = kindMeta[k];
              const Icon = M.icon;
              const active = draft.kind === k;
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
            placeholder="Descrizione (opzionale)"
            value={draft.description}
            onChange={(e) =>
              setDraft((d) => ({ ...d, description: e.target.value }))
            }
            className="min-h-[50px] text-sm"
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

      <div className="p-3">
        {items.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-6">
            Nessun contenuto collegato a questa slide.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((r) => {
              const Icon = kindMeta[r.kind].icon;
              const isLive = liveMediaId === r.id;
              const projectLabel =
                r.kind === "image"
                  ? "Mostra immagine"
                  : r.kind === "video"
                    ? "Mostra video"
                    : "Apri in Aula";
              return (
                <li
                  key={r.id}
                  className={`border rounded-md p-2.5 flex items-center gap-3 transition-colors ${
                    isLive
                      ? "border-emerald-500/50 bg-emerald-500/5"
                      : "border-border bg-card/40 hover:bg-card/70"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground/90 truncate">
                      {r.title}
                    </p>
                    {r.description && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {r.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-sm border border-border text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Anteprima"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      type="button"
                      onClick={() => onProject(r)}
                      disabled={isLive}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] font-mono uppercase tracking-wider transition-colors ${
                        isLive
                          ? "bg-emerald-500/15 text-emerald-500 cursor-default"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      <Monitor className="w-3 h-3" />
                      {isLive ? "In Aula" : projectLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(r.id)}
                      className="inline-flex items-center px-1.5 py-1 rounded-sm text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Rimuovi collegamento"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};
