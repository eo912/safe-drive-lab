import { supabase } from "@/integrations/supabase/client";

/**
 * Sorgente dei file del corso: bucket PUBBLICO "safe-drive-labs-assets" sul
 * progetto Supabase di Edy. La lettura avviene con indirizzi pubblici
 * permanenti (niente scadenza, quindi niente problemi offline); elenco,
 * caricamento, cancellazione e spostamento passano dalla funzione server
 * "assets-admin", l'unica a conoscere la chiave riservata.
 */

export const ASSETS_URL = "https://bqibmsptsnewfqsemqpt.supabase.co";
export const ASSETS_BUCKET = "safe-drive-labs-assets";

/** Token della modalità nascosta, richiesto dalla funzione server. */
const EDIT_TOKEN = "sdl2026";

const encodePath = (path: string) =>
  path
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");

/** Indirizzo pubblico permanente di un file del bucket. */
export const assetUrl = (path: string) =>
  `${ASSETS_URL}/storage/v1/object/public/${ASSETS_BUCKET}/${encodePath(path)}`;

export type AssetEntry = {
  path: string;
  name: string;
  folder: string;
  size: number;
  mimeType: string;
  updatedAt: string | null;
};

const call = async <T>(action: string, payload: Record<string, unknown> = {}): Promise<T> => {
  const { data, error } = await supabase.functions.invoke("assets-admin", {
    body: { action, ...payload },
    headers: { "x-sdl-edit": EDIT_TOKEN },
  });
  if (error) throw error;
  if (data && typeof data === "object" && "error" in data) {
    throw new Error(String((data as { error: unknown }).error));
  }
  return data as T;
};

/** Contenuto di una cartella (prefisso vuoto = radice). */
export const listAssets = (prefix = "") =>
  call<{ folders: string[]; files: AssetEntry[] }>("list", {
    prefix: prefix ? `${prefix.replace(/\/+$/, "")}/` : "",
  });

/** Tutti i file del bucket, cartelle comprese. */
export const listAllAssets = () =>
  call<{ folders: string[]; files: AssetEntry[] }>("list-all");

/** Carica un file nel bucket esterno tramite indirizzo firmato monouso. */
export const uploadAsset = async (path: string, file: File, upsert = false) => {
  const { uploadUrl } = await call<{ uploadUrl: string }>("signed-upload", { path, upsert });
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!res.ok) throw new Error(`caricamento non riuscito (${res.status})`);
  return path;
};

/** Cancella uno o più file. Ritorna i percorsi effettivamente rimossi. */
export const removeAssets = async (paths: string[]) => {
  const { removed } = await call<{ removed: string[] }>("remove", { paths });
  return removed ?? [];
};

/** Sposta/rinomina un file. */
export const moveAsset = (from: string, to: string) => call<{ ok: true }>("move", { from, to });
