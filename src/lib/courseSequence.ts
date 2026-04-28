import type { ModuleBlock } from "./moduleBlocks";
import type { AulaStep } from "./aulaSync";

/**
 * Posizione canonica nel corso = (id blocco, step).
 * La sequenza lineare definisce l'ordine "tipo slide" usato dal telecomando.
 *
 * Regola (lineare = essenziale, salta tutto ciò che è opzionale):
 * - per ogni blocco includiamo lo step "intro"
 * - se il blocco è di kind "scenario" o "video" includiamo anche lo step "scenario"
 *   (è il contenuto principale di quel blocco e va mostrato in sequenza)
 *
 * Gli altri step (esiti, spiegazione, approfondimento) restano on-demand
 * solo dalla regia istruttore.
 */
export type CoursePosition = {
  blocco: string;
  step: AulaStep;
};

export const buildLinearSequence = (blocks: ModuleBlock[]): CoursePosition[] => {
  const seq: CoursePosition[] = [];
  for (const b of blocks) {
    seq.push({ blocco: b.id, step: "intro" });
    if (b.kind === "scenario" || b.kind === "video") {
      seq.push({ blocco: b.id, step: "scenario" });
    }
  }
  return seq;
};

/**
 * Trova l'indice della posizione corrente nella sequenza lineare.
 * Se non c'è match esatto (es. l'istruttore in regia ha attivato uno step
 * opzionale come "esiti"), torna l'indice del blocco corrente più vicino.
 */
export const findPositionIndex = (
  seq: CoursePosition[],
  blocco: string,
  step: AulaStep,
): number => {
  const exact = seq.findIndex((p) => p.blocco === blocco && p.step === step);
  if (exact !== -1) return exact;
  // Fallback: stesso blocco, primo step disponibile in sequenza
  const sameBlock = seq.findIndex((p) => p.blocco === blocco);
  return sameBlock;
};
