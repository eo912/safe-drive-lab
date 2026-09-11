import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Associazione persistente segnaposto -> immagine nel bucket "course-images".
 * Nel database salviamo il PERCORSO del file (es. "modulo-3/abitacolo.jpg");
 * l'URL firmato viene risolto al volo e messo in cache.
 */
export const BUCKET = "course-images";
const SIGNED_TTL = 60 * 60 * 24 * 7; // 7 giorni

const EVT = "sdl:placeholder-images";

let paths: Record<string, string> = {};
let loaded = false;
let loading: Promise<void> | null = null;
const signed: Record<string, string> = {};

const emit = () => window.dispatchEvent(new CustomEvent(EVT));

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

/** Modulo corrente ricavato dalla route (es. /aula/modulo-3-il-conducente -> modulo-3). */
export const currentModuleFolder = () => {
  if (typeof window === "undefined") return "generico";
  const m = window.location.pathname.match(/modulo-(\d+[a-z]?)/i);
  return m ? `modulo-${m[1]}` : "generico";
};

/** Identificativo stabile del singolo segnaposto, cartella esplicita. */
export const placeholderIdFor = (folder: string, label: string) =>
  `${folder}::${slugify(label)}`;

/** Identificativo stabile del singolo segnaposto. */
export const placeholderId = (label: string) =>
  placeholderIdFor(currentModuleFolder(), label);

/** Identificativo stabile di una singola icona (tessere, pittogrammi). */
export const iconIdFor = (folder: string, label: string) =>
  `${folder}::icon::${slugify(label)}`;

/** Identificativo icona nel modulo corrente. */
export const iconId = (label: string) => iconIdFor(currentModuleFolder(), label);

/** Cartella storage dedicata alle icone. */
export const ICON_FOLDER = "icone";

/** Contatore che cambia a ogni modifica delle associazioni immagine. */
export const usePlaceholderVersion = () => {
  const [v, setV] = useState(0);
  useEffect(() => {
    const sync = () => setV((n) => n + 1);
    window.addEventListener(EVT, sync);
    if (!loaded) loadAll();
    return () => window.removeEventListener(EVT, sync);
  }, []);
  return v;
};

const loadAll = () => {
  if (loading) return loading;
  loading = (async () => {
    const { data, error } = await supabase
      .from("placeholder_images")
      .select("placeholder_id, image_url");
    if (!error && data) {
      paths = Object.fromEntries(data.map((r) => [r.placeholder_id, r.image_url]));
    }
    loaded = true;
    loading = null;
    emit();
  })();
  return loading;
};

/** Rilegge dal database tutte le associazioni, ignorando la cache. */
export const refreshPlaceholders = async () => {
  loading = null;
  loaded = false;
  await loadAll();
};

// Aggiornamento automatico: altre finestre (Aula, Regia) restano allineate.
if (typeof window !== "undefined") {
  supabase
    .channel("placeholder-images-sync")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "placeholder_images" },
      () => {
        refreshPlaceholders();
      },
    )
    .subscribe();

  window.addEventListener("focus", () => {
    if (loaded) refreshPlaceholders();
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && loaded) refreshPlaceholders();
  });
}

const resolveSigned = async (path: string) => {
  if (signed[path]) return signed[path];
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_TTL);
  if (data?.signedUrl) {
    signed[path] = data.signedUrl;
    emit();
    return data.signedUrl;
  }
  return null;
};

export const setPlaceholderImage = async (id: string, path: string) => {
  const previous = paths[id];
  paths[id] = path;
  await resolveSigned(path);
  emit();
  const { error } = await supabase
    .from("placeholder_images")
    .upsert({ placeholder_id: id, image_url: path, updated_at: new Date().toISOString() });
  if (error) {
    // Rollback ottimistico: l'interfaccia non mostra un'associazione inesistente.
    if (previous) paths[id] = previous;
    else delete paths[id];
    emit();
    throw error;
  }
  emit();
};

export const clearPlaceholderImage = async (id: string) => {
  delete paths[id];
  emit();
  await supabase.from("placeholder_images").delete().eq("placeholder_id", id);
};

/** Elenca tutti i file di una cartella, senza limite pratico (pagine da 1000). */
const listFolderFiles = async (folder: string) => {
  const names: string[] = [];
  const PAGE = 1000;
  for (let offset = 0; ; offset += PAGE) {
    const { data } = await supabase.storage
      .from(BUCKET)
      .list(folder, { limit: PAGE, offset, sortBy: { column: "name", order: "asc" } });
    const page = data ?? [];
    for (const file of page) {
      if (file.name.startsWith(".")) continue;
      // Le sottocartelle non hanno metadata: le ignoriamo qui.
      if (!file.id) continue;
      names.push(file.name);
    }
    if (page.length < PAGE) break;
  }
  return names;
};

/** Firma in blocco un elenco di percorsi e popola la cache. */
const resolveSignedMany = async (allPaths: string[]) => {
  const missing = allPaths.filter((p) => !signed[p]);
  const CHUNK = 100;
  for (let i = 0; i < missing.length; i += CHUNK) {
    const chunk = missing.slice(i, i + CHUNK);
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(chunk, SIGNED_TTL);
    for (const row of data ?? []) {
      if (row.path && row.signedUrl) signed[row.path] = row.signedUrl;
    }
  }
  if (missing.length > 0) emit();
};

/**
 * Tutti i file del bucket, scoprendo le cartelle dinamicamente: nessun elenco
 * fisso, nessun limite basso. Ritorna anche la cartella di ogni file.
 */
export const listLibrary = async () => {
  const { data: rootEntries } = await supabase.storage
    .from(BUCKET)
    .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });

  const folders = (rootEntries ?? [])
    .filter((e) => !e.id && !e.name.startsWith("."))
    .map((e) => e.name);

  const perFolder = await Promise.all(
    folders.map(async (f) => ({ folder: f, files: await listFolderFiles(f) })),
  );

  const out: { path: string; url: string; folder: string; name: string }[] = [];
  const wanted: string[] = [];
  for (const { folder, files } of perFolder) {
    for (const name of files) {
      const path = `${folder}/${name}`;
      wanted.push(path);
      out.push({ path, url: "", folder, name });
    }
  }

  // File eventualmente presenti nella radice del bucket.
  for (const e of rootEntries ?? []) {
    if (e.id && !e.name.startsWith(".")) {
      wanted.push(e.name);
      out.push({ path: e.name, url: "", folder: "(radice)", name: e.name });
    }
  }

  await resolveSignedMany(wanted);
  return out
    .map((f) => ({ ...f, url: signed[f.path] ?? "" }))
    .filter((f) => f.url !== "");
};

/** Segnaposto attualmente associati a un file del bucket. */
export const placeholderIdsUsingPath = (path: string) =>
  Object.entries(paths)
    .filter(([, p]) => p === path)
    .map(([id]) => id);

/**
 * Elimina un file dalla libreria: rimuove il file dal bucket e azzera tutte le
 * associazioni che lo usavano (i segnaposto tornano vuoti, senza errori).
 */
export const deleteLibraryImage = async (path: string) => {
  const used = placeholderIdsUsingPath(path);
  for (const id of used) delete paths[id];
  delete signed[path];
  emit();
  if (used.length > 0) {
    await supabase.from("placeholder_images").delete().in("placeholder_id", used);
  }
  await supabase.storage.from(BUCKET).remove([path]);
};

export const uploadImage = async (file: File, folder: string) => {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${folder}/${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ""))}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  await resolveSigned(path);
  return path;
};

/** URL pronto da mostrare per un segnaposto (null se non configurato). */
export const usePlaceholderImage = (id: string) => {
  const [, force] = useState(0);
  useEffect(() => {
    const sync = () => force((n) => n + 1);
    window.addEventListener(EVT, sync);
    if (!loaded) loadAll();
    return () => window.removeEventListener(EVT, sync);
  }, []);

  const path = paths[id];
  useEffect(() => {
    if (path && !signed[path]) resolveSigned(path);
  }, [path]);

  return path ? (signed[path] ?? null) : null;
};
