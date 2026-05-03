import { useMemo, useState } from "react";
import {
  Inbox,
  Plus,
  Trash2,
  Sparkles,
  Link as LinkIcon,
  FileText,
  Video,
  Image as ImageIcon,
  FileType,
  CheckCircle2,
  FileInput,
  ChevronLeft,
  ChevronRight,
  Wand2,
  X,
} from "lucide-react";
import {
  parseSceneDocument,
  parsedSceneToDraft,
  SCENE_TEMPLATE,
} from "@/lib/sceneFormat";
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

const rawKindMeta: Record<
  DraftContent["rawKind"],
  { label: string; icon: typeof Video }
> = {
  text: { label: "Testo", icon: FileText },
  link: { label: "Link", icon: LinkIcon },
  pdf: { label: "PDF", icon: FileType },
  document: { label: "Doc", icon: FileText },
  image: { label: "Immagine", icon: ImageIcon },
  video: { label: "Video", icon: Video },
};

const priorities: ScenePriority[] = ["CORE", "STANDARD", "FULL"];
const formats: SceneFormat[] = ["FLASH", "STANDARD", "FULL"];

const statusMeta: Record<
  DerivedStatus,
  { label: string; cls: string }
> = {
  bozza: {
    label: "Bozza",
    cls: "bg-muted text-muted-foreground border-border",
  },
  pronto: {
    label: "Pronto",
    cls: "bg-primary/10 text-primary border-primary/40",
  },
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

  // wizard
  const [editingId, setEditingId] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // import box
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState(SCENE_TEMPLATE);

  // file upload
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadInfo, setUploadInfo] = useState<string | null>(null);

  const editing = forModule.find((d) => d.id === editingId) ?? null;

  const openWizard = (id: string) => {
    setEditingId(id);
    setStep(1);
  };

  const handleNew = () => {
    const created = add({ moduloSlug });
    openWizard(created.id);
  };

  const handleImport = () => {
    const doc = parseSceneDocument(importText);
    if (!doc.scene.length) return;
    let lastId: string | null = null;
    for (const s of doc.scene) {
      const created = add(parsedSceneToDraft(s, moduloSlug));
      lastId = created.id;
    }
    setImportOpen(false);
    if (lastId) openWizard(lastId);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    setUploadError(null);
    setUploadInfo(null);
    try {
      let totalScenes = 0;
      let lastId: string | null = null;
      for (const file of Array.from(files)) {
        if (!detectKind(file)) {
          throw new Error(`Formato non supportato: ${file.name}`);
        }
        const text = await extractFileText(file);
        const scenes = parseAnyContent(text);
        if (!scenes.length) {
          // nessuna struttura: crea un'unica bozza grezza
          const created = add({
            moduloSlug,
            rawTitle: file.name.replace(/\.[^.]+$/, ""),
            rawText: text.slice(0, 4000),
            rawKind: "text",
          });
          lastId = created.id;
          totalScenes += 1;
          continue;
        }
        for (const s of scenes) {
          const created = add(sceneToImportedDraft(s, moduloSlug));
          lastId = created.id;
          totalScenes += 1;
        }
      }
      setUploadInfo(`${totalScenes} bozza/e create. Revisiona prima di confermare.`);
      if (lastId && totalScenes === 1) openWizard(lastId);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Errore di importazione");
    } finally {
      setUploading(false);
    }
  };

  const closeWizard = () => {
    setEditingId(null);
    setStep(1);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="p-0 w-[420px] sm:w-[600px] flex flex-col"
      >
        <SheetHeader className="p-4 border-b border-border/60 text-left">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Inbox className="w-3.5 h-3.5 text-primary" />
              <SheetTitle className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground font-normal">
                Cassetto contenuti · {forModule.length}
              </SheetTitle>
            </div>
            {!editing && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setImportOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                >
                  <FileInput className="w-3.5 h-3.5" />
                  Importa
                </button>
                <button
                  type="button"
                  onClick={handleNew}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nuovo contenuto
                </button>
              </div>
            )}
            {editing && (
              <button
                type="button"
                onClick={closeWizard}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
                Chiudi
              </button>
            )}
          </div>
          {!editing && importOpen && (
            <div className="mt-3 space-y-2 border border-dashed border-primary/40 rounded-md p-2 bg-primary/5">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">
                Formato standard · una SCENA: per blocco
              </p>
              <Textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="min-h-[160px] font-mono text-[11px] leading-relaxed"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setImportText(SCENE_TEMPLATE)}
                  className="text-[10px] text-muted-foreground hover:text-foreground"
                >
                  Reset template
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
                >
                  Crea bozze
                </button>
              </div>
            </div>
          )}
          {!editing && (
            <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
              Inserisci materiale, trasformalo in scena, conferma. Niente arriva
              in Aula senza il tuo invio dalla regia.
            </p>
          )}
        </SheetHeader>

        {/* LISTA */}
        {!editing && (
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {forModule.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-12">
                Nessun contenuto. Clicca «Nuovo contenuto» per iniziare.
              </p>
            ) : (
              forModule.map((d) => (
                <DraftRow
                  key={d.id}
                  draft={d}
                  onOpen={() => openWizard(d.id)}
                  onRemove={() => remove(d.id)}
                />
              ))
            )}
          </div>
        )}

        {/* WIZARD */}
        {editing && (
          <Wizard
            draft={editing}
            step={step}
            setStep={setStep}
            scenes={scenes.map((s) => ({ id: s.id, title: s.title }))}
            archive={archive}
            moduloSlug={moduloSlug}
            onChange={(patch) => update(editing.id, patch)}
            onSaveDraft={() => {
              update(editing.id, { status: "draft" });
              closeWizard();
            }}
            onConfirm={() => {
              promote(editing.id);
              update(editing.id, { status: "ready" });
              closeWizard();
            }}
            onCancel={closeWizard}
            onRemove={() => {
              remove(editing.id);
              closeWizard();
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
  const RawIcon = rawKindMeta[draft.rawKind].icon;
  const status = deriveStatus(draft);
  const meta = statusMeta[status];

  return (
    <div className="group border border-border rounded-md bg-card/40 hover:bg-card/70 transition-colors flex items-center gap-2 pr-2">
      <button
        type="button"
        onClick={onOpen}
        className="flex-1 flex items-center gap-2 p-3 text-left min-w-0"
      >
        <RawIcon className="w-3.5 h-3.5 text-primary shrink-0" />
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
// WIZARD
// ----------------------------------------------------------------

const Wizard = ({
  draft,
  step,
  setStep,
  scenes,
  archive,
  moduloSlug,
  onChange,
  onSaveDraft,
  onConfirm,
  onCancel,
  onRemove,
}: {
  draft: DraftContent;
  step: 1 | 2 | 3;
  setStep: (s: 1 | 2 | 3) => void;
  scenes: { id: string; title: string }[];
  archive: { id: string; title: string; kind: ResourceKind }[];
  moduloSlug: string;
  onChange: (patch: Partial<DraftContent>) => void;
  onSaveDraft: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onRemove: () => void;
}) => {
  const stepLabel = step === 1 ? "Base" : step === 2 ? "Trasforma" : "Conferma";

  const toggleMedia = (id: string) => {
    const has = draft.mediaResourceIds.includes(id);
    onChange({
      mediaResourceIds: has
        ? draft.mediaResourceIds.filter((x) => x !== id)
        : [...draft.mediaResourceIds, id],
    });
  };

  const handleAutofill = () => {
    const f = autofillFromRaw({
      title: draft.rawTitle,
      text: draft.rawText,
      url: draft.rawUrl,
    });
    onChange({
      obiettivo: draft.obiettivo || f.obiettivo,
      stimolo: draft.stimolo || f.stimolo,
      azione: draft.azione || f.azione,
      chiusura: draft.chiusura || f.chiusura,
      mediaResourceIds: draft.mediaResourceIds,
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Stepper */}
      <div className="px-4 py-3 border-b border-border/60 flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.2em]">
        {([1, 2, 3] as const).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setStep(n)}
            className={`flex items-center gap-1.5 ${
              step === n ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
                step === n
                  ? "border-primary bg-primary/10"
                  : "border-border"
              }`}
            >
              {n}
            </span>
            {n === 1 ? "Base" : n === 2 ? "Trasforma" : "Conferma"}
          </button>
        ))}
        <span className="ml-auto text-muted-foreground/60">{stepLabel}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {step === 1 && (
          <>
            <Section title="Titolo">
              <Input
                placeholder="Titolo contenuto"
                value={draft.rawTitle}
                onChange={(e) => onChange({ rawTitle: e.target.value })}
              />
            </Section>

            <Section title="Tipo">
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(rawKindMeta) as DraftContent["rawKind"][]).map(
                  (k) => {
                    const M = rawKindMeta[k];
                    const active = draft.rawKind === k;
                    const Icon = M.icon;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => onChange({ rawKind: k })}
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
                  },
                )}
              </div>
            </Section>

            <Section title="Modulo · Scena">
              <Input
                placeholder="Modulo"
                value={draft.moduloSlug ?? moduloSlug}
                onChange={(e) => onChange({ moduloSlug: e.target.value })}
              />
              <Select
                label="Scena (collega a esistente o nuova)"
                value={draft.linkedSceneId ?? ""}
                onChange={(v) =>
                  onChange({ linkedSceneId: v === "" ? undefined : v })
                }
                options={[
                  { value: "", label: "Nuova scena" },
                  ...scenes.map((s) => ({ value: s.id, label: s.title })),
                ]}
              />
            </Section>

            <Section title="Priorità · Formato · Tempo">
              <div className="grid grid-cols-2 gap-2">
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
              </div>
              <NumberField
                label="Tempo (sec)"
                value={draft.expectedSeconds}
                onChange={(v) => onChange({ expectedSeconds: v })}
              />
            </Section>

            <Section title="Contenuto grezzo">
              {draft.rawKind !== "text" && (
                <Input
                  placeholder="URL"
                  value={draft.rawUrl ?? ""}
                  onChange={(e) => onChange({ rawUrl: e.target.value })}
                />
              )}
              <Textarea
                placeholder="Testo / appunti / trascrizione…"
                value={draft.rawText ?? ""}
                onChange={(e) => onChange({ rawText: e.target.value })}
                className="min-h-[120px] text-sm"
              />
            </Section>

            <Section title="Media (dall'archivio)">
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
            </Section>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
                Trasforma in scena
              </p>
              <button
                type="button"
                onClick={handleAutofill}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-primary/40 text-primary text-[11px] hover:bg-primary/10"
                title="Precompila dai campi grezzi"
              >
                <Wand2 className="w-3 h-3" />
                Precompila da grezzo
              </button>
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
              label="Azione (interazione)"
              value={draft.azione}
              onChange={(v) => onChange({ azione: v })}
            />
            <LabeledArea
              label="Chiusura"
              value={draft.chiusura}
              onChange={(v) => onChange({ chiusura: v })}
            />
            <LabeledArea
              label="Note regia (mai in Aula)"
              value={draft.notesRegia}
              onChange={(v) => onChange({ notesRegia: v })}
            />

            <Section title="Destinazione · Tempo">
              <PillGroup<ContentTarget>
                label="Destinazione"
                options={["aula", "regia-notes"]}
                value={draft.target}
                onChange={(v) => onChange({ target: v })}
                renderLabel={(v) => (v === "aula" ? "Aula" : "Note regia")}
              />
              <NumberField
                label="Tempo previsto (sec)"
                value={draft.expectedSeconds}
                onChange={(v) => onChange({ expectedSeconds: v })}
              />
            </Section>
          </>
        )}

        {step === 3 && (
          <Summary draft={draft} scenes={scenes} archive={archive} />
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
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((step - 1) as 1 | 2 | 3)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Indietro
            </button>
          )}

          {step < 3 && (
            <button
              type="button"
              onClick={() => setStep((step + 1) as 1 | 2 | 3)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20"
            >
              Avanti
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 3 && (
            <>
              <button
                type="button"
                onClick={onCancel}
                className="px-2.5 py-1.5 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground"
              >
                Annulla
              </button>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------
// SUMMARY
// ----------------------------------------------------------------

const Summary = ({
  draft,
  scenes,
  archive,
}: {
  draft: DraftContent;
  scenes: { id: string; title: string }[];
  archive: { id: string; title: string; kind: ResourceKind }[];
}) => {
  const sceneTitle = draft.linkedSceneId
    ? scenes.find((s) => s.id === draft.linkedSceneId)?.title ?? "—"
    : "Nuova scena";
  const linkedMedia = archive.filter((r) =>
    draft.mediaResourceIds.includes(r.id),
  );

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
        Riepilogo prima del salvataggio
      </p>

      <SummaryRow label="Titolo scena" value={draft.rawTitle || "—"} />
      <SummaryRow label="Modulo" value={draft.moduloSlug ?? "—"} />
      <SummaryRow label="Scena" value={sceneTitle} />
      <SummaryRow label="Priorità" value={draft.priority} />
      <SummaryRow label="Formato" value={draft.format} />
      <SummaryRow
        label="Tempo"
        value={`${Math.round(draft.expectedSeconds / 60)} min`}
      />
      <SummaryRow
        label="Destinazione"
        value={draft.target === "aula" ? "Aula" : "Note regia"}
      />
      <SummaryRow
        label="Media"
        value={
          linkedMedia.length
            ? linkedMedia.map((r) => r.title).join(" · ")
            : "Nessuno"
        }
      />

      <div className="border-t border-border/60 pt-3 space-y-2 text-xs">
        <Field label="Obiettivo" value={draft.obiettivo} />
        <Field label="Stimolo" value={draft.stimolo} />
        <Field label="Azione" value={draft.azione} />
        <Field label="Chiusura" value={draft.chiusura} />
        {draft.notesRegia && (
          <Field label="Note regia" value={draft.notesRegia} />
        )}
      </div>

      <p className="text-[10px] text-muted-foreground italic pt-2">
        Conferma scena = pronta in regia. Niente viene mostrato in Aula finché
        non la invii dalla regia.
      </p>
    </div>
  );
};

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline gap-3 text-xs">
    <span className="w-28 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
      {label}
    </span>
    <span className="flex-1 text-foreground/90">{value}</span>
  </div>
);

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
      {label}
    </p>
    <p className="text-foreground/85 whitespace-pre-wrap">{value || "—"}</p>
  </div>
);

// ----------------------------------------------------------------
// micro UI
// ----------------------------------------------------------------

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm bg-secondary text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
    {children}
  </span>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
      {title}
    </p>
    {children}
  </div>
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

const Select = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) => (
  <div>
    <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
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

const NumberField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) => (
  <div>
    <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
    <Input
      type="number"
      min={10}
      step={10}
      value={value}
      onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      className="h-9 text-sm"
    />
  </div>
);
