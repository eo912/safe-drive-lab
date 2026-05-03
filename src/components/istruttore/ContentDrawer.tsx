import { useMemo, useState } from "react";
import {
  Inbox,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Link as LinkIcon,
  FileText,
  Video,
  Image as ImageIcon,
  FileType,
  CheckCircle2,
  FileInput,
} from "lucide-react";
import {
  parseSceneDocument,
  parsedSceneToDraft,
  SCENE_TEMPLATE,
} from "@/lib/sceneFormat";
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
  type DraftContent,
  type ScenePriority,
  type SceneFormat,
  type ContentTarget,
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
  const { forModule, add, update, remove, promote } = useContentDrawer(moduloSlug);
  const { items: archive } = useArchive();
  const scenes = useMemo(() => buildScenesFromBlocks(blocks), [blocks]);

  const [expanded, setExpanded] = useState<string | null>(null);

  const handleAdd = () => {
    const created = add({ moduloSlug });
    setExpanded(created.id);
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
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuovo contenuto
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
            Importa materiale grezzo e trasformalo in scena (Obiettivo · Stimolo
            · Azione · Chiusura). Nulla compare in Aula finché non lo invii dalla regia.
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {forModule.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-12">
              Nessun contenuto nel cassetto. Aggiungine uno per iniziare.
            </p>
          ) : (
            forModule.map((d) => (
              <DraftCard
                key={d.id}
                draft={d}
                expanded={expanded === d.id}
                onToggle={() =>
                  setExpanded((e) => (e === d.id ? null : d.id))
                }
                onChange={(patch) => update(d.id, patch)}
                onRemove={() => remove(d.id)}
                onPromote={() => promote(d.id)}
                scenes={scenes.map((s) => ({ id: s.id, title: s.title }))}
                archive={archive}
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ----------------------------------------------------------------

const DraftCard = ({
  draft,
  expanded,
  onToggle,
  onChange,
  onRemove,
  onPromote,
  scenes,
  archive,
}: {
  draft: DraftContent;
  expanded: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<DraftContent>) => void;
  onRemove: () => void;
  onPromote: () => void;
  scenes: { id: string; title: string }[];
  archive: { id: string; title: string; kind: ResourceKind }[];
}) => {
  const RawIcon = rawKindMeta[draft.rawKind].icon;
  const isScene = draft.status === "scene";

  const toggleMedia = (id: string) => {
    const has = draft.mediaResourceIds.includes(id);
    onChange({
      mediaResourceIds: has
        ? draft.mediaResourceIds.filter((x) => x !== id)
        : [...draft.mediaResourceIds, id],
    });
  };

  return (
    <div
      className={`border rounded-md bg-card/40 transition-colors ${
        isScene
          ? "border-emerald-500/40"
          : "border-border hover:bg-card/70"
      }`}
    >
      {/* Header riga */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start gap-2 p-3 text-left"
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
        )}
        <RawIcon className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground/90 leading-tight truncate">
            {draft.rawTitle || "Senza titolo"}
          </p>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <Tag>{draft.priority}</Tag>
            <Tag>{draft.format}</Tag>
            <Tag>{draft.target === "aula" ? "Aula" : "Note regia"}</Tag>
            {isScene && (
              <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-emerald-500">
                <CheckCircle2 className="w-3 h-3" /> scena
              </span>
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border/60 pt-3">
          {/* Materiale grezzo */}
          <Section title="Materiale grezzo">
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
            <Input
              placeholder="Titolo"
              value={draft.rawTitle}
              onChange={(e) => onChange({ rawTitle: e.target.value })}
            />
            {draft.rawKind !== "text" && (
              <Input
                placeholder="URL"
                value={draft.rawUrl ?? ""}
                onChange={(e) => onChange({ rawUrl: e.target.value })}
              />
            )}
            <Textarea
              placeholder="Testo / appunti grezzi"
              value={draft.rawText ?? ""}
              onChange={(e) => onChange({ rawText: e.target.value })}
              className="min-h-[60px] text-sm"
            />
          </Section>

          {/* Struttura scena */}
          <Section title="Trasforma in scena">
            <LabeledArea
              label="Obiettivo"
              value={draft.obiettivo}
              onChange={(v) => onChange({ obiettivo: v })}
            />
            <LabeledArea
              label="Stimolo"
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
          </Section>

          {/* Assegnazione */}
          <Section title="Assegnazione scena">
            <Select
              label="Collega a scena esistente"
              value={draft.linkedSceneId ?? ""}
              onChange={(v) =>
                onChange({ linkedSceneId: v === "" ? undefined : v })
              }
              options={[
                { value: "", label: "Nuova scena" },
                ...scenes.map((s) => ({ value: s.id, label: s.title })),
              ]}
            />
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

          {/* Media collegati */}
          <Section title="Media collegati (dall'archivio)">
            {archive.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                Archivio vuoto. Aggiungi prima dei materiali nell'archivio.
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

          {/* Note regia */}
          <Section title="Note regia (mai visibili in Aula)">
            <Textarea
              placeholder="Suggerimenti per condurre la scena"
              value={draft.notesRegia}
              onChange={(e) => onChange({ notesRegia: e.target.value })}
              className="min-h-[60px] text-sm"
            />
          </Section>

          {/* Azioni */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-sm text-[11px] text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Elimina
            </button>
            <button
              type="button"
              onClick={onPromote}
              disabled={isScene}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isScene
                  ? "bg-emerald-500/15 text-emerald-500 cursor-default"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isScene ? "Già scena" : "Promuovi a scena"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ---- micro UI ----

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
    <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="min-h-[44px] text-sm"
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
