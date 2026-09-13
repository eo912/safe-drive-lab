import { supabase } from "@/integrations/supabase/client";
import { studioCatalog } from "@/lib/studioCatalog";
import {
  assetUrl,
  listAssets,
  moveAsset,
  removeAssets,
  uploadAsset,
  type AssetEntry,
} from "@/lib/assetsBucket";
import {
  VIDEO_EXT,
  VIDEO_PREFIX,
  iconIdFor,
  placeholderIdFor,
  refreshPlaceholders,
  slugify,
} from "@/lib/placeholderImages";
import {
  deleteMediaAssets,
  loadMediaAssets,
  moveMediaAsset,
  type MediaAsset,
  type MediaTipo,
} from "@/lib/mediaAssets";

/**
 * Livello dati dell'utility interna di gestione file (bucket pubblico esterno
 * "safe-drive-labs-assets"). Unico punto che parla con lo storage per elenco,
 * cancellazione, spostamento in blocco e caricamento: le operazioni di
 * scrittura passano dalla funzione server "assets-admin". I metadati di
 * catalogazione arrivano dalla tabella `media_assets` e vengono uniti per
 * percorso.
 */

export type StorageFile = {
  path: string;
  folder: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  updatedAt: string | null;
  isVideo: boolean;
  meta?: MediaAsset;
};



/** Tipo dedotto dall'estensione, usato come valore iniziale della scheda. */
export const tipoFromName = (name: string): MediaTipo => {
  if (VIDEO_EXT.test(name)) return "video";
  if (/\.(pdf|docx?|pptx?|xlsx?|txt)$/i.test(name)) return "documento";
  return "foto";
};

/** Moduli disponibili per il campo "modulo di riferimento". */
export const moduliOptions = studioCatalog.map((m) => ({
  value: m.folder,
  label: m.title,
}));


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
  const { folders } = await listAssets("");
  return folders.filter((f) => !f.startsWith("."));
};

/** Elenca i file di una cartella (radice inclusa). */
const listRaw = async (folder: string): Promise<AssetEntry[]> => {
  const { files } = await listAssets(folder);
  return files;
};

/**
 * File di una cartella, con anteprima pubblica e scheda di catalogazione.
 * `folder === ROOT_LABEL` legge la radice del bucket.
 */
export const listFiles = async (folder: string): Promise<StorageFile[]> => {
  const isRoot = folder === ROOT_LABEL;
  const [entries, metas] = await Promise.all([
    listRaw(isRoot ? "" : folder),
    loadMediaAssets(),
  ]);

  return entries.map((e) => ({
    path: e.path,
    folder,
    name: e.name,
    url: assetUrl(e.path),
    size: e.size,
    mimeType: e.mimeType,
    updatedAt: e.updatedAt,
    isVideo: VIDEO_EXT.test(e.name),
    meta: metas[e.path],
  }));
};


/** Filtro testuale su nome, titolo, categoria, tag, descrizione e modulo. */
export const filterFiles = (files: StorageFile[], query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return files;
  return files.filter((f) => {
    const m = f.meta;
    const campi = [
      f.name,
      m?.nome ?? "",
      m?.categoria ?? "",
      m?.descrizione ?? "",
      m?.modulo ?? "",
      ...(m?.tag ?? []),
    ];
    return campi.some((c) => c.toLowerCase().includes(q));
  });
};

/** Filtri rapidi su stato e modulo (valore vuoto = nessun filtro). */
export const applyFacets = (
  files: StorageFile[],
  stato: string,
  modulo: string,
) =>
  files.filter((f) => {
    if (stato && (f.meta?.stato ?? "") !== stato) return false;
    if (modulo && (f.meta?.modulo ?? "") !== modulo) return false;
    return true;
  });

/** Carica uno o più file nella cartella indicata, senza sovrascrivere. */
export const uploadFiles = async (
  files: File[],
  folder: string,
  onProgress?: (done: number, total: number) => void,
): Promise<{ paths: string[]; failed: { name: string; message: string }[] }> => {
  const dest = folder === ROOT_LABEL ? "" : folder.replace(/^\/+|\/+$/g, "");
  const paths: string[] = [];
  const failed: { name: string; message: string }[] = [];
  let done = 0;
  for (const file of files) {
    const ext = file.name.split(".").pop() ?? "bin";
    const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "file";
    const name = `${Date.now()}-${base}.${ext.toLowerCase()}`;
    const path = dest ? `${dest}/${name}` : name;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      upsert: false,
      contentType: file.type || undefined,
    });
    if (error) failed.push({ name: file.name, message: error.message });
    else paths.push(path);
    done += 1;
    onProgress?.(done, files.length);
  }
  return { paths, failed };
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
    try {
      const removedList = await removeAssets(chunk);
      const removed = new Set(removedList);
      for (const p of chunk) {
        if (removed.size === 0 || removed.has(p)) result.ok.push(p);
        else result.failed.push({ path: p, message: "file non trovato" });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "errore";
      for (const p of chunk) result.failed.push({ path: p, message });
    }
  }


  if (usedIds.length > 0) {
    await supabase.from("placeholder_images").delete().in("placeholder_id", usedIds);
  }
  await deleteMediaAssets(result.ok);
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
        try {
          await moveAsset(job.from, job.to);
          return { job, error: null as { message: string } | null };
        } catch (e) {
          return { job, error: { message: e instanceof Error ? e.message : "errore" } };
        }

      }),
    );
    for (const { job, error } of outcomes) {
      if (error) {
        result.failed.push({ path: job.from, message: error.message });
        continue;
      }
      result.ok.push(job.from);
      await moveMediaAsset(job.from, job.to);

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
