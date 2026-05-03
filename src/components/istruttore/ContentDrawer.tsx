import { useMemo, useState } from "react";
import {
  Inbox,
  Trash2,
  CheckCircle2,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Upload,
} from "lucide-react";
import {
  extractFileText,
  parseAnyContent,
  sceneToImportedDraft,
  detectKind,
} from "@/lib/fileImport";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useContentDrawer,
  autofillFromRaw,
  deriveStatus,
  type DraftContent,
  type ScenePriority,
  type SceneFormat,
  type ContentTarget,
  type DerivedStatus,
} from "@/lib/contentDrawer";
import { useArchive } from "@/lib/instructorStorage";
import type { ResourceKind } from "@/lib/instructorTypes";
import { buildScenesFromBlocks } from "@/lib/scene";
import type { ModuleBlock } from "@/lib/moduleBlocks";
import { validateDraft } from "@/lib/sceneValidation";

const priorities: ScenePriority[] = ["CORE", "STANDARD", "FULL"];
const formats: SceneFormat[] = ["FLASH", "STANDARD", "FULL"];

const statusMeta: Record<DerivedStatus, { label: string; cls: string }> = {
  bozza: { label: "Bozza", cls: "bg-muted text-muted-foreground border-border" },
  pronto: { label: "Pronto", cls: "bg-primary/10 text-primary border-primary/40" },
  collegato: {
    label: "Collegato",
    cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/40",
  },
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  moduloSlug: string;
  blocks: ModuleBlock[];
};

const estimateTime = (azione: string, mediaCount: number) => {
  let m = 2;
  if (azione.trim()) m += 1;
  if (mediaCount > 0) m += 1;
  return m * 60;
};

/** Genera una bozza scena da un input grezzo (testo libero). */
const generateFromInput = (raw: string) => {
  const text = raw.trim();
  const f = autofillFromRaw({ text });
  // titolo: prima riga troncata
  const firstLine = text.split(/\n+/)[0] ?? "";
  const title = firstLine.length > 60 ? firstLine.slice(0, 57) + "…" : firstLine;
  return {
    rawTitle: title || "Nuova scena",
    rawText: text,
    rawKind: "text" as const,
    obiettivo: f.obiettivo,
    stimolo: f.stimolo,
    azione: f.azione,
    chiusura: f.chiusura,
    expectedSeconds: estimateTime(f.azione, 0),
  };
};

export const ContentDrawer = ({
  open,
  onOpenChange,
  moduloSlug,
  blocks,
}: Props) => {
  const { forModule, add, update, remove, promote } =
    useContentDrawer(moduloSlug);
  const { items: archive } = useArchive();
  const scenes = useMemo(() => buildScenesFromBlocks(blocks), [blocks]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const editing = forModule.find((d) => d.id === editingId) ?? null;

  const openDraft = (id: string) => setEditingId(id);
  const closeDraft = () => setEditingId(null);

  const handleCreate = () => {
    const text = input.trim();
    if (!text) return;
    const data = generateFromInput(text);
    const created = add({ moduloSlug, ...data });
    setInput("");
    openDraft(created.id);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    setUploadError(null);
    try {
      let lastId: string | null = null;
      for (const file of Array.from(files)) {
        if (!detectKind(file)) {
          throw new Error(`Formato non supportato: ${file.name}`);
        }
        const text = await extractFileText(file);
        const parsed = parseAnyContent(text);
        if (!parsed.length) {
          const data = generateFromInput(text);
          const created = add({
            moduloSlug,
            ...data,
            rawTitle: file.name.replace(/\.[^.]+$/, "") || data.rawTitle,
          });
          lastId = created.id;
        } else {
          for (const s of parsed) {
            const created = add(sceneToImportedDraft(s, moduloSlug));
            lastId = created.id;
          }
        }
      }
      if (lastId) openDraft(lastId);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Errore di importazione");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="p-0 w-[420px] sm:w-[560px] flex flex-col"
      >
        <SheetHeader className="p-4 border-b border-border/60 text-left">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Inbox className="w-3.5 h-3.5 text-primary" />
              <SheetTitle className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground font-normal">
                Cassetto contenuti · {forModule.length}
              </SheetTitle>
            </div>
            {editing && (
              <button
                type="button"
                onClick={closeDraft}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
                Chiudi
              </button>
            )}
          </div>
        </SheetHeader>

        {!editing && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* INPUT rapido */}
            <div className="space-y-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Incolla o scrivi qui il contenuto…"
                className="min-h-[120px] text-sm"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!input.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Crea scena
                </button>
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  {uploading ? "…" : "File"}
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt,.md"
                    multiple
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      handleFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
                <span className="ml-auto text-[10px] text-muted-foreground">
                  Genera titolo, obiettivo, stimolo, azione, chiusura, tempo.
                </span>
              </div>
              {uploadError && (
                <p className="text-[10px] text-destructive">{uploadError}</p>
              )}
            </div>

            {/* LISTA */}
            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
                Bozze · {forModule.length}
              </p>
              {forModule.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-8">
                  Nessuna scena. Scrivi un contenuto e premi «Crea scena».
                </p>
              ) : (
                forModule.map((d) => (
                  <DraftRow
                    key={d.id}
                    draft={d}
                    onOpen={() => openDraft(d.id)}
                    onRemove={() => remove(d.id)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {editing && (
          <Review
            draft={editing}
            scenes={scenes.map((s) => ({ id: s.id, title: s.title }))}
            archive={archive}
            moduloSlug={moduloSlug}
            onChange={(patch) => update(editing.id, patch)}
            onSaveDraft={() => {
              update(editing.id, { status: "draft" });
              closeDraft();
            }}
            onConfirm={() => {
              promote(editing.id);
              update(editing.id, { status: "ready" });
              closeDraft();
            }}
            onRemove={() => {
              remove(editing.id);
              closeDraft();
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};

// ----------------------------------------------------------------
// LISTA
// ----------------------------------------------------------------

const DraftRow = ({
  draft,
  onOpen,
  onRemove,
}: {
  draft: DraftContent;
  onOpen: () => void;
  onRemove: () => void;
}) => {
  const status = deriveStatus(draft);
  const meta = statusMeta[status];

  return (
    <div className="group border border-border rounded-md bg-card/40 hover:bg-card/70 transition-colors flex items-center gap-2 pr-2">
      <button
        type="button"
        onClick={onOpen}
        className="flex-1 flex items-center gap-2 p-3 text-left min-w-0"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground/90 leading-tight truncate">
            {draft.rawTitle || "Senza titolo"}
          </p>
          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded-sm border text-[9px] font-mono uppercase tracking-wider ${meta.cls}`}
            >
              {meta.label}
            </span>
            <Tag>{draft.priority}</Tag>
            <Tag>{Math.round(draft.expectedSeconds / 60)}m</Tag>
          </div>
        </div>
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1"
        title="Elimina"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

// ----------------------------------------------------------------
// REVIEW (singola schermata)
// ----------------------------------------------------------------

const Review = ({
  draft,
  scenes,
  archive,
  moduloSlug,
  onChange,
  onSaveDraft,
  onConfirm,
  onRemove,
}: {
  draft: DraftContent;
  scenes: { id: string; title: string }[];
  archive: { id: string; title: string; kind: ResourceKind }[];
  moduloSlug: string;
  onChange: (patch: Partial<DraftContent>) => void;
  onSaveDraft: () => void;
  onConfirm: () => void;
  onRemove: () => void;
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const validation = validateDraft(draft);
  // Solo suggerimenti: errori e warning trattati uniformemente.
  const suggestions = validation.issues
    .filter((i) => i.suggestion)
    .slice(0, 4);

  const toggleMedia = (id: string) => {
    const has = draft.mediaResourceIds.includes(id);
    onChange({
      mediaResourceIds: has
        ? draft.mediaResourceIds.filter((x) => x !== id)
        : [...draft.mediaResourceIds, id],
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
            Titolo
          </p>
          <Input
            value={draft.rawTitle}
            onChange={(e) => onChange({ rawTitle: e.target.value })}
            placeholder="Titolo scena"
          />
        </div>

        <LabeledArea
          label="Obiettivo"
          value={draft.obiettivo}
          onChange={(v) => onChange({ obiettivo: v })}
        />
        <LabeledArea
          label="Stimolo (Aula)"
          value={draft.stimolo}
          onChange={(v) => onChange({ stimolo: v })}
        />
        <LabeledArea
          label="Azione"
          value={draft.azione}
          onChange={(v) => onChange({ azione: v })}
        />
        <LabeledArea
          label="Chiusura"
          value={draft.chiusura}
          onChange={(v) => onChange({ chiusura: v })}
        />

        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
            Tempo (min)
          </p>
          <Input
            type="number"
            min={1}
            step={1}
            value={Math.round(draft.expectedSeconds / 60)}
            onChange={(e) =>
              onChange({
                expectedSeconds: Math.max(60, Number(e.target.value) * 60 || 60),
              })
            }
            className="h-9 text-sm w-24"
          />
        </div>

        {/* Suggerimenti soft */}
        {suggestions.length > 0 && (
          <div className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-1.5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Suggerimenti
            </p>
            <ul className="space-y-1">
              {suggestions.map((s) => (
                <li key={s.id} className="text-[11px] text-muted-foreground leading-snug">
                  · {s.suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Avanzate */}
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          {showAdvanced ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
          Avanzate
        </button>

        {showAdvanced && (
          <div className="space-y-3 border-t border-border/40 pt-3">
            <div>
              <p className="text-[10px] text-muted-foreground mb-1">Modulo</p>
              <Input
                value={draft.moduloSlug ?? moduloSlug}
                onChange={(e) => onChange({ moduloSlug: e.target.value })}
              />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-1">
                Scena collegata
              </p>
              <select
                value={draft.linkedSceneId ?? ""}
                onChange={(e) =>
                  onChange({
                    linkedSceneId: e.target.value || undefined,
                  })
                }
                className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="">Nuova scena</option>
                {scenes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
            <PillGroup<ScenePriority>
              label="Priorità"
              options={priorities}
              value={draft.priority}
              onChange={(v) => onChange({ priority: v })}
            />
            <PillGroup<SceneFormat>
              label="Formato"
              options={formats}
              value={draft.format}
              onChange={(v) => onChange({ format: v })}
            />
            <PillGroup<ContentTarget>
              label="Destinazione"
              options={["aula", "regia-notes"]}
              value={draft.target}
              onChange={(v) => onChange({ target: v })}
              renderLabel={(v) => (v === "aula" ? "Aula" : "Note regia")}
            />
            <LabeledArea
              label="Note regia"
              value={draft.notesRegia}
              onChange={(v) => onChange({ notesRegia: v })}
            />
            <div>
              <p className="text-[10px] text-muted-foreground mb-1">
                Media (archivio)
              </p>
              {archive.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  Archivio vuoto.
                </p>
              ) : (
                <div className="space-y-1">
                  {archive.map((r) => {
                    const checked = draft.mediaResourceIds.includes(r.id);
                    return (
                      <label
                        key={r.id}
                        className="flex items-center gap-2 text-xs cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleMedia(r.id)}
                          className="accent-primary"
                        />
                        <span className="text-foreground/80 truncate">
                          {r.title}
                        </span>
                        <span className="ml-auto text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                          {r.kind}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* footer */}
      <div className="border-t border-border/60 p-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onRemove}
          className="text-[11px] text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          Elimina
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onSaveDraft}
            className="px-2.5 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-card/70"
          >
            Salva bozza
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Conferma scena
          </button>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------
// micro UI
// ----------------------------------------------------------------

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm bg-secondary text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
    {children}
  </span>
);

const LabeledArea = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div>
    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
      {label}
    </p>
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="min-h-[60px] text-sm"
    />
  </div>
);

function PillGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  renderLabel,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  renderLabel?: (v: T) => string;
}) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => {
          const active = value === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              className={`px-2 py-1 rounded-md border text-[10px] font-mono uppercase tracking-wider transition-colors ${
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {renderLabel ? renderLabel(o) : o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
