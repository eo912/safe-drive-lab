import { supabase } from "@/integrations/supabase/client";

/**
 * Catalogazione dei file dell'archivio: tabella descrittiva agganciata al
 * percorso nel bucket. Un file senza riga resta comunque visibile e usabile:
 * i metadati sono un'aggiunta, non la verità sull'esistenza dei file.
 */

export type MediaTipo = "foto" | "video" | "documento";
export type MediaStato = "approvato" | "da-valutare" | "scartato";

export type MediaAsset = {
  storagePath: string;
  nome: string;
  tipo: MediaTipo;
  categoria: string | null;
  modulo: string | null;
  tag: string[];
  stato: MediaStato;
  descrizione: string | null;
};

export const STATI: { value: MediaStato; label: string }[] = [
  { value: "approvato", label: "Approvato" },
  { value: "da-valutare", label: "Da valutare" },
  { value: "scartato", label: "Scartato" },
];

export const TIPI: { value: MediaTipo; label: string }[] = [
  { value: "foto", label: "Foto" },
  { value: "video", label: "Video" },
  { value: "documento", label: "Documento" },
];

type Row = {
  storage_path: string;
  nome: string;
  tipo: string;
  categoria: string | null;
  modulo: string | null;
  tag: string[] | null;
  stato: string;
  descrizione: string | null;
};

const fromRow = (r: Row): MediaAsset => ({
  storagePath: r.storage_path,
  nome: r.nome,
  tipo: (r.tipo as MediaTipo) ?? "foto",
  categoria: r.categoria,
  modulo: r.modulo,
  tag: r.tag ?? [],
  stato: (r.stato as MediaStato) ?? "da-valutare",
  descrizione: r.descrizione,
});

/** Tutti i metadati, mappati per percorso. */
export const loadMediaAssets = async (): Promise<Record<string, MediaAsset>> => {
  const map: Record<string, MediaAsset> = {};
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("media_assets")
      .select("storage_path, nome, tipo, categoria, modulo, tag, stato, descrizione")
      .range(from, from + PAGE - 1);
    if (error) break;
    const rows = (data ?? []) as Row[];
    for (const r of rows) map[r.storage_path] = fromRow(r);
    if (rows.length < PAGE) break;
  }
  return map;
};

/** Crea o aggiorna la scheda di un file. */
export const saveMediaAsset = async (asset: MediaAsset) => {
  const { error } = await supabase.from("media_assets").upsert({
    storage_path: asset.storagePath,
    nome: asset.nome,
    tipo: asset.tipo,
    categoria: asset.categoria,
    modulo: asset.modulo,
    tag: asset.tag,
    stato: asset.stato,
    descrizione: asset.descrizione,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
};

export type MetaPatch = {
  categoria?: string;
  modulo?: string;
  stato?: MediaStato;
  tag?: string[];
};

/**
 * Applica gli stessi campi a più file. I campi non indicati restano invariati
 * su chi ha già una scheda; chi non ce l'ha parte dai valori predefiniti.
 */
export const saveMediaAssetsBulk = async (
  paths: string[],
  patch: MetaPatch,
  existing: Record<string, MediaAsset>,
  tipoFor: (path: string) => MediaTipo,
) => {
  const rows = paths.map((p) => {
    const cur = existing[p];
    const tagUniti = patch.tag?.length
      ? Array.from(new Set([...(cur?.tag ?? []), ...patch.tag]))
      : (cur?.tag ?? []);
    return {
      storage_path: p,
      nome: cur?.nome || (p.split("/").pop() ?? p),
      tipo: cur?.tipo ?? tipoFor(p),
      categoria: patch.categoria ?? cur?.categoria ?? null,
      modulo: patch.modulo ?? cur?.modulo ?? null,
      tag: tagUniti,
      stato: patch.stato ?? cur?.stato ?? "da-valutare",
      descrizione: cur?.descrizione ?? null,
      updated_at: new Date().toISOString(),
    };
  });
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabase.from("media_assets").upsert(rows.slice(i, i + CHUNK));
    if (error) throw error;
  }
};

/** Sposta la scheda su un nuovo percorso (dopo uno spostamento di file). */
export const moveMediaAsset = async (from: string, to: string) => {
  const { data } = await supabase
    .from("media_assets")
    .select("storage_path, nome, tipo, categoria, modulo, tag, stato, descrizione")
    .eq("storage_path", from)
    .maybeSingle();
  if (!data) return;
  const asset = fromRow(data as Row);
  await saveMediaAsset({ ...asset, storagePath: to });
  await supabase.from("media_assets").delete().eq("storage_path", from);
};

export const deleteMediaAssets = async (paths: string[]) => {
  if (paths.length === 0) return;
  const CHUNK = 200;
  for (let i = 0; i < paths.length; i += CHUNK) {
    await supabase.from("media_assets").delete().in("storage_path", paths.slice(i, i + CHUNK));
  }
};

/** Testo normalizzato dei tag digitati a mano ("uno, due" -> ["uno","due"]). */
export const parseTags = (raw: string) =>
  raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);
