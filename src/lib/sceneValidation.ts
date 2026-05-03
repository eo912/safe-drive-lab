/**
 * ============================================================
 *  VALIDAZIONE SCENA — Safe Drive Lab
 * ============================================================
 *
 *  Controlla qualità e completezza di una bozza scena.
 *  Regola fondamentale: NON blocca mai l'uso. Solo suggerimenti.
 *
 *  Stato:
 *    🟢 completa     → nessun errore, nessun warning
 *    🟡 migliorabile → solo warning
 *    🔴 incompleta   → almeno un errore (campo critico mancante)
 */

import type { DraftContent } from "./contentDrawer";

export type ValidationLevel = "error" | "warning" | "info";

export type ValidationIssue = {
  id: string;
  level: ValidationLevel;
  field?: keyof DraftContent;
  message: string;
  /** breve suggerimento operativo per l'istruttore. */
  suggestion?: string;
};

export type ValidationStatus = "complete" | "improvable" | "incomplete";

export type ValidationResult = {
  status: ValidationStatus;
  issues: ValidationIssue[];
  /** punteggio 0-100, pesa errori (-25) e warning (-8). */
  score: number;
};

const wordCount = (s: string) =>
  (s ?? "").trim().split(/\s+/).filter(Boolean).length;

const isBlank = (s?: string) => !s || !s.trim();

// ---- regole di tempo (coerenti con fileImport.ts) ----

const expectedTimeBaseline = (d: DraftContent) => {
  let min = 2;
  if ((d.azione ?? "").trim()) min += 1;
  if (d.mediaResourceIds.length > 0) min += 1;
  return min * 60;
};

// ---- regole interazione ----

const interactionMarkers = [
  "?",
  "domanda",
  "chiedi",
  "riflett",
  "scegli",
  "confronta",
  "discuti",
  "vota",
  "indovina",
  "stima",
];

const hasInteraction = (d: DraftContent) => {
  const text = `${d.azione} ${d.stimolo}`.toLowerCase();
  return interactionMarkers.some((m) => text.includes(m));
};

// ---- validatore ----

export const validateDraft = (d: DraftContent): ValidationResult => {
  const issues: ValidationIssue[] = [];

  // --- struttura base ---
  if (isBlank(d.rawTitle)) {
    issues.push({
      id: "title-missing",
      level: "error",
      field: "rawTitle",
      message: "Titolo mancante",
      suggestion: "Aggiungi un titolo breve e specifico (max 8 parole).",
    });
  } else if (wordCount(d.rawTitle) > 12) {
    issues.push({
      id: "title-long",
      level: "warning",
      field: "rawTitle",
      message: "Titolo lungo",
      suggestion: "Sintetizza in massimo 8 parole.",
    });
  }

  if (isBlank(d.moduloSlug)) {
    issues.push({
      id: "module-missing",
      level: "error",
      field: "moduloSlug",
      message: "Modulo non assegnato",
      suggestion: "Collega la scena al modulo di riferimento.",
    });
  }

  if (!d.priority) {
    issues.push({
      id: "priority-missing",
      level: "error",
      field: "priority",
      message: "Priorità non impostata",
      suggestion: "Scegli CORE, STANDARD o FULL.",
    });
  }

  if (!d.format) {
    issues.push({
      id: "format-missing",
      level: "warning",
      field: "format",
      message: "Formato non impostato",
      suggestion: "Indica Flash, Standard o Full per il piano corso.",
    });
  }

  // --- contenuto didattico ---
  if (isBlank(d.obiettivo)) {
    issues.push({
      id: "obiettivo-missing",
      level: "error",
      field: "obiettivo",
      message: "Obiettivo mancante",
      suggestion: "Una frase: cosa deve restare al partecipante.",
    });
  } else if (wordCount(d.obiettivo) < 4) {
    issues.push({
      id: "obiettivo-short",
      level: "warning",
      field: "obiettivo",
      message: "Obiettivo troppo vago",
      suggestion: "Chiarisci l'obiettivo: cosa cambia per chi ascolta?",
    });
  } else if (wordCount(d.obiettivo) > 40) {
    issues.push({
      id: "obiettivo-long",
      level: "warning",
      field: "obiettivo",
      message: "Obiettivo lungo",
      suggestion: "Riduci a una sola idea forte.",
    });
  }

  if (isBlank(d.stimolo)) {
    issues.push({
      id: "stimolo-missing",
      level: "warning",
      field: "stimolo",
      message: "Stimolo Aula mancante",
      suggestion: "Aggiungi cosa vede o sente l'aula in apertura.",
    });
  } else if (wordCount(d.stimolo) > 60) {
    issues.push({
      id: "stimolo-long",
      level: "warning",
      field: "stimolo",
      message: "Stimolo lungo",
      suggestion: "Riduci il testo: lo stimolo deve essere breve e diretto.",
    });
  }

  if (isBlank(d.azione)) {
    issues.push({
      id: "azione-missing",
      level: "error",
      field: "azione",
      message: "Azione/interazione mancante",
      suggestion: "Aggiungi una domanda, scelta o esercizio per l'aula.",
    });
  }

  if (isBlank(d.chiusura)) {
    issues.push({
      id: "chiusura-missing",
      level: "warning",
      field: "chiusura",
      message: "Chiusura non definita",
      suggestion: "Sintesi finale in una riga: cosa portarsi via.",
    });
  }

  if (isBlank(d.notesRegia)) {
    issues.push({
      id: "notes-missing",
      level: "info",
      field: "notesRegia",
      message: "Note regia assenti",
      suggestion: "Aggiungi indicazioni operative per condurre la scena.",
    });
  }

  // --- didattica: scena passiva? ---
  if (!hasInteraction(d) && !isBlank(d.azione)) {
    issues.push({
      id: "passive-scene",
      level: "warning",
      message: "Scena potenzialmente passiva",
      suggestion: "Aggiungi una domanda o una scelta per coinvolgere l'aula.",
    });
  }

  // --- coerenza tempo ---
  if (!d.expectedSeconds || d.expectedSeconds < 30) {
    issues.push({
      id: "time-low",
      level: "warning",
      field: "expectedSeconds",
      message: "Tempo previsto molto basso",
      suggestion: "Almeno 60 secondi per una scena gestibile dal vivo.",
    });
  } else {
    const baseline = expectedTimeBaseline(d);
    const ratio = d.expectedSeconds / baseline;
    if (ratio < 0.5) {
      issues.push({
        id: "time-under",
        level: "warning",
        field: "expectedSeconds",
        message: "Tempo sotto il baseline didattico",
        suggestion: `Suggerito ~${Math.round(baseline / 60)} min in base ad azione e media.`,
      });
    } else if (ratio > 2.5) {
      issues.push({
        id: "time-over",
        level: "warning",
        field: "expectedSeconds",
        message: "Tempo sopra il baseline didattico",
        suggestion: "Verifica se la scena va spezzata in più momenti.",
      });
    }
  }

  // --- score / status ---
  const errors = issues.filter((i) => i.level === "error").length;
  const warnings = issues.filter((i) => i.level === "warning").length;
  const score = Math.max(0, 100 - errors * 25 - warnings * 8);
  const status: ValidationStatus =
    errors > 0 ? "incomplete" : warnings > 0 ? "improvable" : "complete";

  return { status, issues, score };
};

export const STATUS_META: Record<
  ValidationStatus,
  { dot: string; label: string; cls: string }
> = {
  complete: {
    dot: "🟢",
    label: "Completa",
    cls: "text-emerald-500 border-emerald-500/40 bg-emerald-500/5",
  },
  improvable: {
    dot: "🟡",
    label: "Migliorabile",
    cls: "text-amber-500 border-amber-500/40 bg-amber-500/5",
  },
  incomplete: {
    dot: "🔴",
    label: "Incompleta",
    cls: "text-destructive border-destructive/40 bg-destructive/5",
  },
};
