import { useCallback, useEffect, useMemo, useState } from "react";
import type { ModuleBlock } from "./moduleBlocks";

/**
 * ============================================================
 *  FORMATO CORSO — Flash / Standard / Full
 * ============================================================
 *
 *  Regola priorità → inclusione blocco:
 *    CORE     → sempre
 *    STANDARD → Standard + Full
 *    FULL     → solo Full
 *
 *  Tempo: usa il tempo previsto della scena (override istruttore se presente),
 *  somma i blocchi inclusi e attivi, mostra confronto con target.
 *
 *  Regola: nessun autoplay. Il sistema suggerisce, l'istruttore decide
 *  (può abilitare/disabilitare singole scene oltre a cambiare il formato).
 */

export type CourseFormat = "FLASH" | "STANDARD" | "FULL";
export type ScenePriority = "CORE" | "STANDARD" | "FULL";

export const FORMAT_LABEL: Record<CourseFormat, string> = {
  FLASH: "Flash",
  STANDARD: "Standard",
  FULL: "Full",
};

/** Durata target in secondi per ciascun formato. */
export const FORMAT_TARGET_SECONDS: Record<CourseFormat, number> = {
  FLASH: 60 * 60,      // 1h
  STANDARD: 3 * 60 * 60, // 3h
  FULL: 6 * 60 * 60,   // 6h
};

/** Una priorità è inclusa in un formato? */
export const isPriorityIncluded = (
  priority: ScenePriority,
  format: CourseFormat,
): boolean => {
  if (priority === "CORE") return true;
  if (priority === "STANDARD") return format === "STANDARD" || format === "FULL";
  return format === "FULL"; // FULL solo in Full
};

// ---- Default priority per blocco (euristica per kind) ----

const KIND_PRIORITY: Record<ModuleBlock["kind"], ScenePriority> = {
  intro: "CORE",
  dati: "CORE",
  scenario: "CORE",
  riflessione: "STANDARD",
  video: "STANDARD",
  chiusura: "CORE",
  cta: "CORE",
};

export const defaultBlockPriority = (block: ModuleBlock): ScenePriority =>
  KIND_PRIORITY[block.kind] ?? "STANDARD";

// ---- Persistenza ----

type ModuleConfig = {
  format: CourseFormat;
  /** Override priorità per blockId. */
  priorityOverrides: Record<string, ScenePriority>;
  /** blockId → false se l'istruttore l'ha disattivato esplicitamente. */
  enabledOverrides: Record<string, boolean>;
};

const STORAGE_PREFIX = "safedrivelab-course-format:";

const emptyConfig = (): ModuleConfig => ({
  format: "STANDARD",
  priorityOverrides: {},
  enabledOverrides: {},
});

const readConfig = (modulo: string): ModuleConfig => {
  if (typeof window === "undefined") return emptyConfig();
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + modulo);
    if (!raw) return emptyConfig();
    return { ...emptyConfig(), ...(JSON.parse(raw) as Partial<ModuleConfig>) };
  } catch {
    return emptyConfig();
  }
};

const writeConfig = (modulo: string, cfg: ModuleConfig) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_PREFIX + modulo, JSON.stringify(cfg));
  } catch {
    /* ignore */
  }
};

// ---- Hook ----

export type BlockPlanEntry = {
  block: ModuleBlock;
  priority: ScenePriority;
  /** incluso dal formato (in base a priority) */
  includedByFormat: boolean;
  /** override istruttore: attivo o spento */
  enabled: boolean;
  /** effettivo: incluso E attivo */
  active: boolean;
  expectedSeconds: number;
};

export const useCourseFormat = (
  modulo: string,
  blocks: ModuleBlock[],
  /** opzionale: getter del tempo reale (override istruttore via useSlideTimes). */
  getExpected?: (b: ModuleBlock) => number,
) => {
  const [cfg, setCfg] = useState<ModuleConfig>(() => readConfig(modulo));

  useEffect(() => {
    setCfg(readConfig(modulo));
  }, [modulo]);

  const persist = useCallback(
    (next: ModuleConfig) => {
      setCfg(next);
      writeConfig(modulo, next);
    },
    [modulo],
  );

  const setFormat = useCallback(
    (format: CourseFormat) => persist({ ...cfg, format }),
    [cfg, persist],
  );

  const setBlockPriority = useCallback(
    (blockId: string, priority: ScenePriority) =>
      persist({
        ...cfg,
        priorityOverrides: { ...cfg.priorityOverrides, [blockId]: priority },
      }),
    [cfg, persist],
  );

  const setBlockEnabled = useCallback(
    (blockId: string, enabled: boolean) =>
      persist({
        ...cfg,
        enabledOverrides: { ...cfg.enabledOverrides, [blockId]: enabled },
      }),
    [cfg, persist],
  );

  const getPriority = useCallback(
    (block: ModuleBlock): ScenePriority =>
      cfg.priorityOverrides[block.id] ?? defaultBlockPriority(block),
    [cfg.priorityOverrides],
  );

  const plan: BlockPlanEntry[] = useMemo(() => {
    return blocks.map((block) => {
      const priority = getPriority(block);
      const includedByFormat = isPriorityIncluded(priority, cfg.format);
      const enabledOverride = cfg.enabledOverrides[block.id];
      // default attivo se incluso dal formato; spento se non incluso.
      const enabled =
        typeof enabledOverride === "boolean" ? enabledOverride : includedByFormat;
      const expectedSeconds = getExpected
        ? getExpected(block)
        : block.expectedSeconds ?? 120;
      return {
        block,
        priority,
        includedByFormat,
        enabled,
        active: includedByFormat && enabled,
        expectedSeconds,
      };
    });
  }, [blocks, cfg.format, cfg.enabledOverrides, getPriority, getExpected]);

  const totalSeconds = useMemo(
    () => plan.reduce((acc, p) => (p.active ? acc + p.expectedSeconds : acc), 0),
    [plan],
  );

  const targetSeconds = FORMAT_TARGET_SECONDS[cfg.format];
  const deltaSeconds = totalSeconds - targetSeconds;

  return {
    format: cfg.format,
    setFormat,
    getPriority,
    setBlockPriority,
    setBlockEnabled,
    plan,
    totalSeconds,
    targetSeconds,
    deltaSeconds,
  };
};

export const formatDuration = (seconds: number): string => {
  const sign = seconds < 0 ? "-" : "";
  const abs = Math.abs(seconds);
  const h = Math.floor(abs / 3600);
  const m = Math.round((abs % 3600) / 60);
  if (h > 0) return `${sign}${h}h ${String(m).padStart(2, "0")}m`;
  return `${sign}${m}m`;
};
