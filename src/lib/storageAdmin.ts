import { supabase } from "@/integrations/supabase/client";
import { studioCatalog } from "@/lib/studioCatalog";
import {
  BUCKET,
  VIDEO_EXT,
  VIDEO_PREFIX,
  iconIdFor,
  placeholderIdFor,
  refreshPlaceholders,
} from "@/lib/placeholderImages";

/**
 * Livello dati dell'utility interna di gestione file (bucket "course-images").
 * Unico punto che parla con lo storage per elenco, cancellazione e spostamento
 * in blocco. Pensato per accogliere in futuro una tabella di metadati (tag,
 * categoria, descrizione) senza cambiare la firma di queste funzioni.
 */

const SIGNED_TTL = 60 * 60; // 1 ora: sufficiente per una sessione di riordino

/** Metadati opzionali: oggi mai valorizzati, pronti per una futura tabella. */
export type FileMeta = {
  tags?: string[];
  categoria?: string;
  descrizione?: string;
};

export type StorageFile = {
  path: string;
  folder: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  updatedAt: string | null;
  isVideo: boolean;
  meta?: FileMeta;
};

export const ROOT_LABEL = "(radice)";

const FOLDER_LABELS: Record<string, string> = {
  brand: "Brand",
  foto: "Foto",
  "foto-da-valutare": "Foto da valutare",
  grafiche: "Grafiche",
  schemi: "Schemi",
  icone: "Icone",
  video: "Video",
  generico: "Generico",
};

export const folderLabel = (f: string) =>
  FOLDER_LABELS[f] ?? f.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/** Cartelle di primo livello presenti nel bucket. */
export const listFolders = async (): Promise<string[]> => {
  const { data } = await supabase.storage
    .from(BUCKET)
    .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });
  return (data ?? [])
    .filter((e) => !e.id && !e.name.startsWith("."))
    .map((e) => e.name);
};

type RawEntry = {
  name: string;
  updated_at?: string | null;
  metadata?: { size?: number; mimetype?: string } | null;
};

/** Elenca i file di una cartella, a pagine da 1000 (nessun limite pratico). */
const listRaw = async (folder: string): Promise<RawEntry[]> => {
  const out: RawEntry[] = [];
  const PAGE = 1000;
  for (let offset = 0; ; offset += PAGE) {
    const { data } = await supabase.storage
      .from(BUCKET)
      .list(folder, { limit: PAGE, offset, sortBy: { column: "name", order: "asc" } });
    const page = data ?? [];
    for (const e of page) {
      if (e.name.startsWith(".")) continue;
      if (!e.id) continue; // sottocartella
      out.push(e as RawEntry);
    }
    if (page.length < PAGE) break;
  }
  return out;
};

/** Firma in blocco (lotti da 100) e restituisce la mappa percorso -> url. */
const signMany = async (paths: string[]) => {
  const map: Record<string, string> = {};
  const CHUNK = 100;
  for (let i = 0; i < paths.length; i += CHUNK) {
    const chunk = paths.slice(i, i + CHUNK);
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(chunk, SIGNED_TTL);
    for (const row of data ?? []) {
      if (row.path && row.signedUrl) map[row.path] = row.signedUrl;
    }
  }
  return map;
};

/**
 * File di una cartella, con miniatura firmata e metadati di base.
 * `folder === ROOT_LABEL` legge la radice del bucket.
 */
export const listFiles = async (folder: string): Promise<StorageFile[]> => {
  const isRoot = folder === ROOT_LABEL;
  const entries = await listRaw(isRoot ? "" : folder);
  const paths = entries.map((e) => (isRoot ? e.name : `${folder}/${e.name}`));
  const signed = await signMany(paths);

  // Punto di innesto futuro: qui si potrà leggere la tabella dei metadati
  // (chiave: path) e unire i risultati per percorso.
  return entries.map((e, i) => ({
    path: paths[i],
    folder,
    name: e.name,
    url: signed[paths[i]] ?? "",
    size: e.metadata?.size ?? 0,
    mimeType: e.metadata?.mimetype ?? "",
    updatedAt: e.updated_at ?? null,
    isVideo: VIDEO_EXT.test(e.name),
  }));
};

/** Filtro testuale: oggi solo sul nome, domani anche sui tag. */
export const filterFiles = (files: StorageFile[], query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return files;
  return files.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      (f.meta?.tags ?? []).some((t) => t.toLowerCase().includes(q)),
  );
};

export type BulkResult = {
  ok: string[];
  failed: { path: string; message: string }[];
};

/** Descrizione leggibile delle schermate che usano un file. */
export const describePlaceholderId = (id: string) => {
  for (const m of studioCatalog) {
    for (const b of m.blocks) {
      for (const p of b.placeholders) {
        if (placeholderIdFor(p.folder ?? m.folder, p.label) === id)
          return `${m.title} · ${b.title}`;
      }
      for (const ic of b.icons) {
        if (iconIdFor(m.folder, ic.label) === id)
          return `${m.title} · ${b.title} (icona ${ic.label})`;
      }
    }
  }
  return id;
};

/** Associazioni salvate: percorso file -> elenco di segnaposto che lo usano. */
export const loadUsageMap = async (): Promise<Record<string, string[]>> => {
  const { data } = await supabase
    .from("placeholder_images")
    .select("placeholder_id, image_url");
  const map: Record<string, string[]> = {};
  for (const row of data ?? []) {
    const path = String(row.image_url).replace(VIDEO_PREFIX, "");
    (map[path] ??= []).push(row.placeholder_id);
  }
  return map;
};

/**
 * Cancellazione in blocco: una sola chiamata all'API (a lotti da 100 percorsi).
 * Le associazioni alle schermate che usavano quei file vengono azzerate.
 */
export const deleteFiles = async (paths: string[]): Promise<BulkResult> => {
  const result: BulkResult = { ok: [], failed: [] };
  const usage = await loadUsageMap();
  const usedIds = paths.flatMap((p) => usage[p] ?? []);

  const CHUNK = 100;
  for (let i = 0; i < paths.length; i += CHUNK) {
    const chunk = paths.slice(i, i + CHUNK);
    const { data, error } = await supabase.storage.from(BUCKET).remove(chunk);
    if (error) {
      for (const p of chunk) result.failed.push({ path: p, message: error.message });
      continue;
    }
    const removed = new Set((data ?? []).map((d) => d.name));
    for (const p of chunk) {
      if (removed.size === 0 || removed.has(p)) result.ok.push(p);
      else result.failed.push({ path: p, message: "file non trovato" });
    }
  }

  if (usedIds.length > 0) {
    await supabase.from("placeholder_images").delete().in("placeholder_id", usedIds);
  }
  await refreshPlaceholders();
  return result;
};

/** Nome libero nella cartella di destinazione (aggiunge -2, -3, ...). */
const freeName = (name: string, taken: Set<string>) => {
  if (!taken.has(name)) return name;
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}${ext}`;
    if (!taken.has(candidate)) return candidate;
  }
};

/**
 * Spostamento in blocco. Lo storage non offre un "move" multiplo: eseguiamo
 * `move` per file in lotti paralleli da 10, raccogliendo gli esiti.
 * Le associazioni delle schermate vengono aggiornate al nuovo percorso, così
 * nessuna slide resta vuota.
 */
export const moveFiles = async (
  paths: string[],
  destFolder: string,
  onCollision: "rename" | "skip" = "rename",
): Promise<BulkResult> => {
  const result: BulkResult = { ok: [], failed: [] };
  const dest = destFolder === ROOT_LABEL ? "" : destFolder.replace(/^\/+|\/+$/g, "");
  const existing = new Set((await listRaw(dest)).map((e) => e.name));
  const usage = await loadUsageMap();

  const jobs: { from: string; to: string }[] = [];
  for (const from of paths) {
    const name = from.split("/").pop() as string;
    if (existing.has(name) && onCollision === "skip") {
      result.failed.push({ path: from, message: "nome già presente nella cartella" });
      continue;
    }
    const finalName = freeName(name, existing);
    existing.add(finalName);
    const to = dest ? `${dest}/${finalName}` : finalName;
    if (to === from) {
      result.failed.push({ path: from, message: "già in questa cartella" });
      continue;
    }
    jobs.push({ from, to });
  }

  const BATCH = 10;
  for (let i = 0; i < jobs.length; i += BATCH) {
    const batch = jobs.slice(i, i + BATCH);
    const outcomes = await Promise.all(
      batch.map(async (job) => {
        const { error } = await supabase.storage.from(BUCKET).move(job.from, job.to);
        return { job, error };
      }),
    );
    for (const { job, error } of outcomes) {
      if (error) {
        result.failed.push({ path: job.from, message: error.message });
        continue;
      }
      result.ok.push(job.from);
      for (const id of usage[job.from] ?? []) {
        const { data } = await supabase
          .from("placeholder_images")
          .select("image_url")
          .eq("placeholder_id", id)
          .maybeSingle();
        const raw = data?.image_url ?? "";
        const next = raw.startsWith(VIDEO_PREFIX) ? `${VIDEO_PREFIX}${job.to}` : job.to;
        await supabase
          .from("placeholder_images")
          .update({ image_url: next, updated_at: new Date().toISOString() })
          .eq("placeholder_id", id);
      }
    }
  }

  await refreshPlaceholders();
  return result;
};

/** Dimensione leggibile. */
export const humanSize = (bytes: number) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
