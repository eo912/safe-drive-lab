import { Clock, Layers } from "lucide-react";
import {
  formatDuration,
  FORMAT_LABEL,
  FORMAT_TARGET_SECONDS,
  type CourseFormat,
  type ScenePriority,
  type BlockPlanEntry,
} from "@/lib/courseFormat";

/**
 * Pannello "Formato corso" — l'istruttore sceglie Flash/Standard/Full,
 * vede quali blocchi sono inclusi (in base alla priorità) e può
 * attivare/disattivare singoli blocchi o cambiarne la priorità.
 *
 * Regola: il sistema suggerisce, l'istruttore decide. Niente autoplay.
 */

const FORMATS: CourseFormat[] = ["FLASH", "STANDARD", "FULL"];
const PRIORITIES: ScenePriority[] = ["CORE", "STANDARD", "FULL"];

type Props = {
  format: CourseFormat;
  setFormat: (f: CourseFormat) => void;
  plan: BlockPlanEntry[];
  totalSeconds: number;
  targetSeconds: number;
  deltaSeconds: number;
  setBlockPriority: (blockId: string, p: ScenePriority) => void;
  setBlockEnabled: (blockId: string, enabled: boolean) => void;
};

export const CourseFormatPanel = ({
  format,
  setFormat,
  plan,
  totalSeconds,
  targetSeconds,
  deltaSeconds,
  setBlockPriority,
  setBlockEnabled,
}: Props) => {
  const overshoot = deltaSeconds > 0;
  const undershoot = deltaSeconds < -120; // più di 2 min sotto

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Layers className="w-3.5 h-3.5 text-primary" />
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
          Formato corso
        </p>
      </div>

      {/* Switch formato */}
      <div className="grid grid-cols-3 gap-1 p-1 rounded-md border border-border bg-background/40">
        {FORMATS.map((f) => {
          const active = f === format;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={`px-2 py-1.5 rounded-sm text-[11px] font-mono uppercase tracking-wider transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              {FORMAT_LABEL[f]}
            </button>
          );
        })}
      </div>

      {/* Tempo totale */}
      <div className="rounded-md border border-border p-2.5 bg-card/40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span className="text-[10px] font-mono uppercase tracking-wider">
              Totale stimato
            </span>
          </div>
          <span
            className={`font-mono text-sm font-semibold ${
              overshoot
                ? "text-amber-500"
                : undershoot
                  ? "text-muted-foreground"
                  : "text-emerald-500"
            }`}
          >
            {formatDuration(totalSeconds)}
          </span>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
          <span>
            Target {formatDuration(FORMAT_TARGET_SECONDS[format])}
          </span>
          <span
            className={
              overshoot
                ? "text-amber-500"
                : undershoot
                  ? "text-muted-foreground"
                  : "text-emerald-500"
            }
          >
            {deltaSeconds === 0
              ? "in linea"
              : `${deltaSeconds > 0 ? "+" : ""}${formatDuration(deltaSeconds)}`}
          </span>
        </div>
        {/* barra */}
        <div className="mt-2 h-1 rounded-full bg-border overflow-hidden">
          <div
            className={`h-full transition-all ${
              overshoot
                ? "bg-amber-500"
                : undershoot
                  ? "bg-muted-foreground/40"
                  : "bg-emerald-500"
            }`}
            style={{
              width: `${Math.min(
                100,
                Math.round((totalSeconds / targetSeconds) * 100),
              )}%`,
            }}
          />
        </div>
      </div>

      {/* Lista scene con priorità + toggle */}
      <div className="space-y-1">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Scene · {plan.filter((p) => p.active).length}/{plan.length} attive
        </p>
        <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
          {plan.map((entry) => (
            <PlanRow
              key={entry.block.id}
              entry={entry}
              onPriority={(p) => setBlockPriority(entry.block.id, p)}
              onToggle={(v) => setBlockEnabled(entry.block.id, v)}
            />
          ))}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
        Suggerimento automatico in base al formato. L'istruttore decide cosa
        attivare. Nessuna scena viene mostrata in Aula senza invio manuale.
      </p>
    </div>
  );
};

const PRIORITY_CLASS: Record<ScenePriority, string> = {
  CORE: "text-primary border-primary/40 bg-primary/5",
  STANDARD: "text-foreground/80 border-border bg-background/40",
  FULL: "text-muted-foreground border-border bg-background/20",
};

const PlanRow = ({
  entry,
  onPriority,
  onToggle,
}: {
  entry: BlockPlanEntry;
  onPriority: (p: ScenePriority) => void;
  onToggle: (v: boolean) => void;
}) => {
  const dimmed = !entry.includedByFormat;
  return (
    <div
      className={`rounded-md border p-2 flex items-center gap-2 ${
        entry.active
          ? "border-border bg-card/60"
          : "border-border/50 bg-background/20 opacity-70"
      }`}
    >
      <input
        type="checkbox"
        checked={entry.enabled}
        onChange={(e) => onToggle(e.target.checked)}
        className="w-3.5 h-3.5 accent-primary cursor-pointer"
        aria-label={`Attiva ${entry.block.title}`}
      />
      <div className="min-w-0 flex-1">
        <p
          className={`text-xs leading-tight truncate ${
            dimmed ? "text-muted-foreground line-through" : "text-foreground/90"
          }`}
        >
          {String(entry.block.index).padStart(2, "0")} · {entry.block.title}
        </p>
        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
          {Math.round(entry.expectedSeconds / 60)}m
        </p>
      </div>
      <select
        value={entry.priority}
        onChange={(e) => onPriority(e.target.value as ScenePriority)}
        className={`text-[10px] font-mono uppercase tracking-wider rounded-sm border px-1.5 py-0.5 cursor-pointer ${PRIORITY_CLASS[entry.priority]}`}
        aria-label="Priorità scena"
      >
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    </div>
  );
};
