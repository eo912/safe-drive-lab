/**
 * ============================================================
 *  FORMATO STANDARD CONTENUTI — Safe Drive Lab
 * ============================================================
 *
 *  Specifica testuale che l'istruttore puo' incollare nel Cassetto
 *  Contenuti per generare automaticamente bozze scena coerenti.
 *
 *  Il parser e' STRETTO: legge solo le etichette riconosciute,
 *  ignora qualsiasi testo fuori struttura, NON fa interpretazione
 *  libera del contenuto.
 *
 *  ────────────────────────────────────────────────────────────
 *  ESEMPIO
 *  ────────────────────────────────────────────────────────────
 *
 *  MODULO: Perche' la guida sicura
 *  DURATA: STANDARD
 *
 *  SCENA: 1 — Perche' siamo qui
 *  PRIORITA: CORE
 *  FORMATO: STANDARD
 *  TEMPO: 3
 *  TAG: introduzione, motivazione
 *  STATO: bozza
 *
 *  OBIETTIVO:
 *  Ancorare i partecipanti al senso del corso.
 *
 *  STIMOLO:
 *  Una frase forte sul rischio reale.
 *
 *  AZIONE:
 *  Domanda aperta in plenaria.
 *
 *  CHIUSURA:
 *  Sintesi in una riga.
 *
 *  NOTE REGIA:
 *  Tenere ritmo basso. Non commentare risposte.
 *
 *  MEDIA:
 *  - tipo: video
 *    descrizione: POV distrazione
 *    link: https://...
 *  - tipo: pdf
 *    descrizione: Scheda dati Aosta
 *    link: https://...
 *
 *  ────────────────────────────────────────────────────────────
 *  REGOLE
 *  ────────────────────────────────────────────────────────────
 *  - "MODULO:" e "DURATA:" sono header opzionali a inizio file.
 *  - Ogni nuova scena inizia con "SCENA:".
 *  - Le etichette di campo terminano con ":" e sono case-insensitive.
 *  - Tutto cio' che non e' un'etichetta riconosciuta dentro una scena
 *    viene assegnato all'ultimo campo aperto (multilinea).
 *  - Testo fuori da SCENA viene ignorato.
 *  - I MEDIA sono una lista di blocchi "- tipo: ... descrizione: ... link: ...".
 */

import type {
  DraftContent,
  ScenePriority,
  SceneFormat,
} from "./contentDrawer";
import type { ResourceKind } from "./instructorTypes";

export type ModuleDuration = "FLASH" | "STANDARD" | "FULL";

export type ParsedMedia = {
  kind: ResourceKind;
  description: string;
  url: string;
};

export type ParsedScene = {
  numero?: number;
  titolo: string;
  priorita: ScenePriority;
  formato: SceneFormat;
  tempoMin: number;
  tag: string[];
  stato: string;
  obiettivo: string;
  stimolo: string;
  azione: string;
  chiusura: string;
  noteRegia: string;
  media: ParsedMedia[];
};

export type ParsedDocument = {
  modulo?: string;
  durata?: ModuleDuration;
  scene: ParsedScene[];
};

// ---- mapping etichette ----

type FieldKey =
  | "obiettivo"
  | "stimolo"
  | "azione"
  | "chiusura"
  | "noteRegia"
  | "media";

const fieldLabels: Record<string, FieldKey> = {
  "obiettivo": "obiettivo",
  "stimolo": "stimolo",
  "stimolo (aula)": "stimolo",
  "azione": "azione",
  "azione (interazione)": "azione",
  "chiusura": "chiusura",
  "note regia": "noteRegia",
  "media": "media",
};

const inlineLabels = new Set([
  "priorita",
  "priorità",
  "formato",
  "tempo",
  "tag",
  "stato",
]);

// ---- normalizzazione ----

const norm = (s: string) => s.trim().toLowerCase().replace(/à/g, "a");

const parsePriority = (s: string): ScenePriority => {
  const v = s.trim().toUpperCase();
  return v === "CORE" || v === "FULL" ? v : "STANDARD";
};

const parseFormat = (s: string): SceneFormat => {
  const v = s.trim().toUpperCase();
  return v === "FLASH" || v === "FULL" ? v : "STANDARD";
};

const parseDuration = (s: string): ModuleDuration => {
  const v = s.trim().toUpperCase();
  return v === "FLASH" || v === "FULL" ? v : "STANDARD";
};

const parseTempoMin = (s: string): number => {
  const m = s.match(/(\d+)/);
  return m ? Number(m[1]) : 0;
};

const parseKind = (s: string): ResourceKind => {
  const v = s.trim().toLowerCase();
  if (v === "video" || v === "image" || v === "document" || v === "link" || v === "pdf") return v;
  if (v === "immagine") return "image";
  if (v === "documento") return "document";
  return "link";
};

const emptyScene = (): ParsedScene => ({
  titolo: "",
  priorita: "STANDARD",
  formato: "STANDARD",
  tempoMin: 0,
  tag: [],
  stato: "bozza",
  obiettivo: "",
  stimolo: "",
  azione: "",
  chiusura: "",
  noteRegia: "",
  media: [],
});

// ---- parser ----

export const parseSceneDocument = (input: string): ParsedDocument => {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const doc: ParsedDocument = { scene: [] };

  let cur: ParsedScene | null = null;
  let openField: FieldKey | null = null;
  let buffer: string[] = [];
  let mediaItem: Partial<ParsedMedia> | null = null;

  const flushBuffer = () => {
    if (!cur || !openField) return;
    const text = buffer.join("\n").trim();
    buffer = [];
    if (openField === "media") {
      if (mediaItem && mediaItem.kind) {
        cur.media.push({
          kind: mediaItem.kind,
          description: mediaItem.description ?? "",
          url: mediaItem.url ?? "",
        });
      }
      mediaItem = null;
      return;
    }
    if (text) cur[openField] = cur[openField] ? `${cur[openField]}\n${text}` : text;
  };

  const closeScene = () => {
    flushBuffer();
    if (cur) doc.scene.push(cur);
    cur = null;
    openField = null;
    buffer = [];
    mediaItem = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      // riga vuota: non chiude il campo, e' valida come separatore
      if (openField === "media") {
        if (mediaItem && mediaItem.kind) {
          cur!.media.push({
            kind: mediaItem.kind,
            description: mediaItem.description ?? "",
            url: mediaItem.url ?? "",
          });
          mediaItem = null;
        }
      } else if (openField) {
        buffer.push("");
      }
      continue;
    }

    const labelMatch = line.match(/^([A-Za-zÀ-ÿ ()]+):\s*(.*)$/);
    const label = labelMatch ? norm(labelMatch[1]) : null;
    const value = labelMatch ? labelMatch[2] : "";

    // header globali fuori scena
    if (!cur) {
      if (label === "modulo") {
        doc.modulo = value.trim();
        continue;
      }
      if (label === "durata") {
        doc.durata = parseDuration(value);
        continue;
      }
    }

    // inizio nuova scena
    if (label === "scena") {
      closeScene();
      cur = emptyScene();
      // "SCENA: 1 — Titolo" oppure "SCENA: Titolo"
      const m = value.match(/^\s*(\d+)\s*[—\-:.]\s*(.*)$/);
      if (m) {
        cur.numero = Number(m[1]);
        cur.titolo = m[2].trim();
      } else {
        cur.titolo = value.trim();
      }
      openField = null;
      continue;
    }

    if (!cur) continue; // ignora testo libero fuori scena

    // campi inline (singola riga)
    if (label && inlineLabels.has(label)) {
      flushBuffer();
      openField = null;
      switch (label) {
        case "priorita":
        case "priorità":
          cur.priorita = parsePriority(value);
          break;
        case "formato":
          cur.formato = parseFormat(value);
          break;
        case "tempo":
          cur.tempoMin = parseTempoMin(value);
          break;
        case "tag":
          cur.tag = value
            .split(/[,;]/)
            .map((t) => t.trim())
            .filter(Boolean);
          break;
        case "stato":
          cur.stato = value.trim();
          break;
      }
      continue;
    }

    // campi multilinea
    if (label && label in fieldLabels) {
      flushBuffer();
      openField = fieldLabels[label];
      if (openField !== "media" && value.trim()) buffer.push(value);
      continue;
    }

    // dentro un campo aperto
    if (openField === "media") {
      // entry: "- tipo: video"
      const newItem = line.match(/^\s*-\s*tipo\s*:\s*(.*)$/i);
      if (newItem) {
        if (mediaItem && mediaItem.kind) {
          cur.media.push({
            kind: mediaItem.kind,
            description: mediaItem.description ?? "",
            url: mediaItem.url ?? "",
          });
        }
        mediaItem = { kind: parseKind(newItem[1]) };
        continue;
      }
      const desc = line.match(/^\s*descrizione\s*:\s*(.*)$/i);
      if (desc && mediaItem) {
        mediaItem.description = desc[1].trim();
        continue;
      }
      const lnk = line.match(/^\s*link\s*:\s*(.*)$/i);
      if (lnk && mediaItem) {
        mediaItem.url = lnk[1].trim();
        continue;
      }
      // riga non riconosciuta: ignorata
      continue;
    }

    if (openField) {
      buffer.push(line);
      continue;
    }
    // fuori da qualsiasi campo: ignora
  }

  closeScene();
  return doc;
};

// ---- conversione in DraftContent ----

export const parsedSceneToDraft = (
  s: ParsedScene,
  moduloSlug?: string,
): Partial<DraftContent> => ({
  rawTitle: s.titolo || `Scena ${s.numero ?? ""}`.trim(),
  rawText: "",
  rawKind: "text",
  moduloSlug,
  obiettivo: s.obiettivo,
  stimolo: s.stimolo,
  azione: s.azione,
  chiusura: s.chiusura,
  notesRegia: s.noteRegia,
  expectedSeconds: Math.max(30, s.tempoMin * 60),
  priority: s.priorita,
  format: s.formato,
  target: "aula",
  status: "draft",
});

// ---- template d'esempio ----

export const SCENE_TEMPLATE = `MODULO: Perche' la guida sicura
DURATA: STANDARD

SCENA: 1 — Titolo scena
PRIORITA: CORE
FORMATO: STANDARD
TEMPO: 3
TAG: esempio, intro
STATO: bozza

OBIETTIVO:
Cosa deve restare al partecipante.

STIMOLO:
Cosa vede in Aula.

AZIONE:
Interazione richiesta.

CHIUSURA:
Sintesi finale.

NOTE REGIA:
Indicazioni per condurre.

MEDIA:
- tipo: video
  descrizione: clip di apertura
  link: https://example.com/clip.mp4
`;
