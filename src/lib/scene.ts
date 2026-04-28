import type { Resource } from "./instructorTypes";
import type { AulaStep } from "./aulaSync";
import type { ModuleBlock } from "./moduleBlocks";

/**
 * ============================================================
 *  SCENA — unità base didattica della piattaforma Safe Drive Lab.
 * ============================================================
 *
 * Una Scena rappresenta un singolo momento didattico controllabile dalla regia
 * istruttore. È più ricca di una semplice "slide": può contenere contenuto
 * Aula, interazione, media collegati, note istruttore e tempo previsto.
 *
 * Questa è una definizione di SOLO STRUTTURA DATI: nessun cambiamento di UI.
 * I componenti Aula esistenti (AulaPerche, ecc.) restano invariati e
 * continuano a renderizzare i blocchi attuali. Le Scene vengono derivate dai
 * `ModuleBlock` tramite `buildScenesFromBlocks`, in modo che la regia
 * istruttore possa indicizzarle, ordinarle e gestirne tempo / contenuti
 * collegati / note in modo uniforme.
 *
 * In futuro (login + cloud) le scene potranno essere persistite singolarmente
 * e arricchite di interazioni e note personali.
 */

// ---------- Tipi ----------

export type SceneType =
  | "intro" // apertura concetto, frase forte, nessuna interazione
  | "scenario" // situazione realistica, contesto visivo
  | "scelta" // domanda o scelta binaria/multipla, opzioni cliccabili
  | "conseguenza" // risultato della scelta, impatto visivo o numerico
  | "spiegazione" // spazio per comprensione, testo breve
  | "micro-test" // domanda rapida + feedback
  | "media" // video / immagine / documento
  | "pausa"; // schermata pausa dedicata

/** Opzione di una scena di tipo "scelta" o "micro-test". */
export type SceneChoiceOption = {
  id: string;
  label: string;
  /** id della scena conseguenza collegata (opzionale). */
  consequenceSceneId?: string;
  /** feedback testuale per micro-test. */
  feedback?: string;
  /** indica se è la risposta corretta (per micro-test). */
  correct?: boolean;
};

export type SceneInteraction =
  | {
      kind: "choice";
      prompt: string;
      multi?: boolean;
      options: SceneChoiceOption[];
    }
  | {
      kind: "quick-test";
      prompt: string;
      options: SceneChoiceOption[];
    }
  | {
      kind: "none";
    };

/**
 * Riferimento alla resa Aula di una scena. Tiene insieme blocco + step usati
 * dalla pagina Aula attuale. Quando in futuro le scene avranno render proprio,
 * questo campo potrà essere sostituito da un componente dedicato.
 */
export type SceneAulaRef = {
  /** id del blocco renderizzato in `AulaPerche` (es. "hero", "numeri"). */
  blockId: string;
  /** step interno del blocco. Default: "intro". */
  step: AulaStep;
};

export type Scene = {
  id: string;
  /** ordine lineare nel modulo (1-based). */
  order: number;
  title: string;
  type: SceneType;
  /** riferimento a ciò che viene mostrato in Aula. */
  aula: SceneAulaRef;
  /** tempo previsto in secondi; modificabile dall'istruttore via storage. */
  expectedSeconds: number;
  /** note istruttore predefinite (mai mostrate in Aula). */
  instructorNotes: string;
  /** id risorse collegate (riferimento all'archivio + linked storage). */
  linkedResourceIds: string[];
  /** interazione opzionale legata alla scena. */
  interaction?: SceneInteraction;
};

// ---------- Derivazione da ModuleBlock ----------

/**
 * Mappa un blocco esistente nello/negli oggetti Scena corrispondenti.
 * Un blocco può generare 1..N scene a seconda dei suoi step disponibili
 * (intro / scenario / esiti / spiegazione / approfondimento).
 *
 * Questa funzione NON modifica la UI: serve all'istruttore per indicizzare
 * tutto il modulo come sequenza unica di scene.
 */
const stepToSceneType = (
  step: AulaStep,
  blockKind: ModuleBlock["kind"],
): SceneType => {
  switch (step) {
    case "intro":
      // i blocchi cta/chiusura usano lo stesso step "intro" come unico contenuto
      return blockKind === "cta" || blockKind === "chiusura"
        ? "spiegazione"
        : "intro";
    case "scenario":
      return blockKind === "video" ? "media" : "scenario";
    case "esiti":
      return "conseguenza";
    case "spiegazione":
      return "spiegazione";
    case "approfondimento":
      return "spiegazione";
    default:
      return "intro";
  }
};

const buildBlockScenes = (
  block: ModuleBlock,
  startOrder: number,
): Scene[] => {
  const scenes: Scene[] = [];
  let order = startOrder;

  const push = (step: AulaStep, titleSuffix?: string) => {
    scenes.push({
      id: `${block.id}:${step}`,
      order: order++,
      title: titleSuffix ? `${block.title} — ${titleSuffix}` : block.title,
      type: stepToSceneType(step, block.kind),
      aula: { blockId: block.id, step },
      // tempo previsto: per ora lo associamo allo step "intro";
      // gli altri step ereditano una stima proporzionale.
      expectedSeconds:
        step === "intro"
          ? (block.expectedSeconds ?? 120)
          : Math.max(60, Math.round((block.expectedSeconds ?? 120) / 2)),
      instructorNotes: step === "intro" ? block.notes : "",
      linkedResourceIds: [],
      interaction: { kind: "none" },
    });
  };

  // step "intro" sempre presente
  push("intro");
  if (block.hasScenario) push("scenario", "Scenario");
  if (block.hasOutcomes) push("esiti", "Esiti");
  if (block.hasExplanation) push("spiegazione", "Spiegazione");
  if (block.hasDeepDive) push("approfondimento", "Approfondimento");

  return scenes;
};

/**
 * Costruisce la lista completa di scene di un modulo a partire dai suoi blocchi.
 * L'ordine lineare segue l'ordine dei blocchi e, all'interno di ciascuno,
 * l'ordine degli step (intro → scenario → esiti → spiegazione → approfondimento).
 */
export const buildScenesFromBlocks = (blocks: ModuleBlock[]): Scene[] => {
  const all: Scene[] = [];
  let order = 1;
  for (const b of blocks) {
    const s = buildBlockScenes(b, order);
    all.push(...s);
    order += s.length;
  }
  return all;
};

// ---------- Lookup utilities ----------

export const findSceneById = (scenes: Scene[], id: string): Scene | undefined =>
  scenes.find((s) => s.id === id);

export const findSceneByAula = (
  scenes: Scene[],
  blockId: string,
  step: AulaStep,
): Scene | undefined =>
  scenes.find((s) => s.aula.blockId === blockId && s.aula.step === step);

export const nextScene = (scenes: Scene[], currentId: string): Scene | undefined => {
  const i = scenes.findIndex((s) => s.id === currentId);
  return i >= 0 && i < scenes.length - 1 ? scenes[i + 1] : undefined;
};

export const prevScene = (scenes: Scene[], currentId: string): Scene | undefined => {
  const i = scenes.findIndex((s) => s.id === currentId);
  return i > 0 ? scenes[i - 1] : undefined;
};

// ---------- Stato tempo ----------

export type SceneTimeStatus = "ok" | "over";

export const sceneTimeStatus = (
  elapsedSeconds: number,
  expectedSeconds: number,
): SceneTimeStatus => (elapsedSeconds > expectedSeconds ? "over" : "ok");

// ---------- Resource attach helper ----------

/**
 * Restituisce le `Resource` collegate alla scena, dato il pool di linked
 * resources caricato per il blocco corrispondente. Mantiene l'ordine dichiarato
 * in `linkedResourceIds` e ignora gli id non più presenti.
 */
export const resolveSceneResources = (
  scene: Scene,
  pool: Resource[],
): Resource[] => {
  if (!scene.linkedResourceIds.length) return [];
  const map = new Map(pool.map((r) => [r.id, r]));
  return scene.linkedResourceIds
    .map((id) => map.get(id))
    .filter((r): r is Resource => Boolean(r));
};
