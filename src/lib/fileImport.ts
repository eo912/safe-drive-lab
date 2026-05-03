/**
 * ============================================================
 *  IMPORT FILE → SCENE
 * ============================================================
 *
 *  Estrae testo da PDF / DOCX / TXT lato browser e produce
 *  bozze scena pronte per il Cassetto Contenuti.
 *
 *  Riconosce sia il formato standard "SCENA: ... PRIORITA: ..."
 *  (vedi sceneFormat.ts) sia un formato libero con marcatori:
 *    MODULO: ...
 *    SCENA: ...
 *    PRIORITÀ: ...
 *    🎯 Obiettivo: ...
 *    🎮 Azione: ...
 *    📋 Note: ...
 *    🎬 Media: ...
 *
 *  Regola tempo: base 2 min, +1 min se c'e' azione, +1 min se ci sono media.
 *  Nessun invio automatico in Aula: tutto resta in bozza.
 */

import {
  parseSceneDocument,
  parsedSceneToDraft,
  type ParsedScene,
} from "./sceneFormat";
import type { DraftContent } from "./contentDrawer";

// ---- estrazione testo ----

export type SupportedFile = "pdf" | "docx" | "text";

export const detectKind = (file: File): SupportedFile | null => {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") return "pdf";
  if (
    name.endsWith(".docx") ||
    name.endsWith(".doc") ||
    file.type.includes("word")
  )
    return "docx";
  if (
    name.endsWith(".txt") ||
    name.endsWith(".md") ||
    file.type.startsWith("text/")
  )
    return "text";
  return null;
};

const extractPdf = async (file: File): Promise<string> => {
  const pdfjs = await import("pdfjs-dist");
  // worker
  // @ts-expect-error vite worker import
  const worker = await import("pdfjs-dist/build/pdf.worker.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let out = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((it) =>
      "str" in it ? (it as { str: string }).str : "",
    );
    out += strings.join(" ") + "\n\n";
  }
  return out;
};

const extractDocx = async (file: File): Promise<string> => {
  const mammoth = await import("mammoth/mammoth.browser");
  const buf = await file.arrayBuffer();
  const res = await mammoth.extractRawText({ arrayBuffer: buf });
  return res.value;
};

const extractText = async (file: File): Promise<string> => file.text();

export const extractFileText = async (file: File): Promise<string> => {
  const kind = detectKind(file);
  if (!kind) throw new Error(`Formato non supportato: ${file.name}`);
  if (kind === "pdf") return extractPdf(file);
  if (kind === "docx") return extractDocx(file);
  return extractText(file);
};

// ---- parser libero (emoji / etichette) ----

type Bag = {
  modulo?: string;
  titolo?: string;
  priorita?: string;
  obiettivo: string[];
  stimolo: string[];
  azione: string[];
  chiusura: string[];
  note: string[];
  media: string[];
};

const newBag = (): Bag => ({
  obiettivo: [],
  stimolo: [],
  azione: [],
  chiusura: [],
  note: [],
  media: [],
});

type Field = keyof Pick<
  Bag,
  "obiettivo" | "stimolo" | "azione" | "chiusura" | "note" | "media"
>;

const matchLabel = (
  line: string,
): { kind: "modulo" | "scena" | "priorita" | "field"; field?: Field; value: string } | null => {
  const l = line.trim();
  // header inline
  const head = l.match(/^(MODULO|SCENA|PRIORIT[AÀ])\s*:\s*(.*)$/i);
  if (head) {
    const k = head[1].toUpperCase();
    if (k === "MODULO") return { kind: "modulo", value: head[2].trim() };
    if (k === "SCENA") return { kind: "scena", value: head[2].trim() };
    return { kind: "priorita", value: head[2].trim() };
  }
  // emoji o etichette campo
  const fieldMap: { re: RegExp; field: Field }[] = [
    { re: /^(?:🎯\s*)?obiettivo\s*:\s*(.*)$/i, field: "obiettivo" },
    { re: /^(?:💬\s*)?stimolo(?:\s*\(aula\))?\s*:\s*(.*)$/i, field: "stimolo" },
    { re: /^(?:🎮\s*)?azione(?:\s*\(interazione\))?\s*:\s*(.*)$/i, field: "azione" },
    { re: /^(?:✅\s*)?chiusura\s*:\s*(.*)$/i, field: "chiusura" },
    { re: /^(?:📋\s*)?note(?:\s+regia)?\s*:\s*(.*)$/i, field: "note" },
    { re: /^(?:🎬\s*)?media\s*:\s*(.*)$/i, field: "media" },
  ];
  for (const { re, field } of fieldMap) {
    const m = l.match(re);
    if (m) return { kind: "field", field, value: m[1].trim() };
  }
  return null;
};

const parsePriority = (s: string): ParsedScene["priorita"] => {
  const v = s.trim().toUpperCase();
  return v === "CORE" || v === "FULL" ? v : "STANDARD";
};

const bagToScene = (bag: Bag): ParsedScene => {
  const azione = bag.azione.join("\n").trim();
  const mediaText = bag.media.join("\n").trim();
  return {
    titolo: bag.titolo || "Senza titolo",
    priorita: parsePriority(bag.priorita ?? "STANDARD"),
    formato: "STANDARD",
    tempoMin: 0, // verra' calcolato dopo
    tag: [],
    stato: "bozza",
    obiettivo: bag.obiettivo.join("\n").trim(),
    stimolo: bag.stimolo.join("\n").trim(),
    azione,
    chiusura: bag.chiusura.join("\n").trim(),
    noteRegia: bag.note.join("\n").trim(),
    media: mediaText
      ? [{ kind: "link", description: mediaText, url: "" }]
      : [],
  };
};

const parseLoose = (input: string): ParsedScene[] => {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const scenes: ParsedScene[] = [];
  let bag: Bag | null = null;
  let modulo: string | undefined;
  let openField: Field | null = null;

  const close = () => {
    if (bag && (bag.titolo || bag.obiettivo.length || bag.azione.length)) {
      scenes.push(bagToScene(bag));
    }
    bag = null;
    openField = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      openField = null;
      continue;
    }
    const m = matchLabel(line);
    if (m?.kind === "modulo") {
      modulo = m.value;
      continue;
    }
    if (m?.kind === "scena") {
      close();
      bag = newBag();
      bag.titolo = m.value || "Senza titolo";
      bag.modulo = modulo;
      continue;
    }
    if (!bag) {
      // se troviamo un campo senza scena dichiarata, apriamo una scena implicita
      if (m?.kind === "field" || m?.kind === "priorita") {
        bag = newBag();
        bag.modulo = modulo;
        bag.titolo = "Contenuto importato";
      } else {
        continue;
      }
    }
    if (m?.kind === "priorita") {
      bag.priorita = m.value;
      openField = null;
      continue;
    }
    if (m?.kind === "field" && m.field) {
      openField = m.field;
      if (m.value) bag[m.field].push(m.value);
      continue;
    }
    if (openField) {
      bag[openField].push(line);
    }
  }
  close();
  return scenes;
};

// ---- entry: testo → scene ----

export const parseAnyContent = (text: string): ParsedScene[] => {
  // 1) prova il formato standard stretto
  const strict = parseSceneDocument(text);
  if (strict.scene.length) return strict.scene;
  // 2) fallback parser libero
  return parseLoose(text);
};

// ---- regola tempo ----

export const computeExpectedSeconds = (s: {
  azione?: string;
  mediaCount?: number;
  tempoMin?: number;
}): number => {
  if (s.tempoMin && s.tempoMin > 0) return s.tempoMin * 60;
  let min = 2;
  if ((s.azione ?? "").trim()) min += 1;
  if ((s.mediaCount ?? 0) > 0) min += 1;
  return min * 60;
};

// ---- scena → DraftContent (con regola tempo) ----

export const sceneToImportedDraft = (
  s: ParsedScene,
  moduloSlug?: string,
): Partial<DraftContent> => {
  const base = parsedSceneToDraft(s, moduloSlug);
  return {
    ...base,
    expectedSeconds: computeExpectedSeconds({
      azione: s.azione,
      mediaCount: s.media.length,
      tempoMin: s.tempoMin,
    }),
  };
};
