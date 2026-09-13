import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

/**
 * Gestione file del bucket esterno "safe-drive-labs-assets" (progetto Supabase
 * di Edy). La lettura dei file avviene direttamente dal browser tramite URL
 * pubblici; qui passano solo le operazioni che richiedono la chiave riservata:
 * elenco (il bucket è pubblico in lettura ma non in elenco), caricamento,
 * cancellazione e spostamento.
 */

const ASSETS_URL = "https://bqibmsptsnewfqsemqpt.supabase.co";
const BUCKET = "safe-drive-labs-assets";
const EDIT_TOKEN = "sdl2026";

const KEY = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY") ?? "";

const h = () => ({
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
});

type Entry = {
  name: string;
  id: string | null;
  updated_at?: string | null;
  metadata?: { size?: number; mimetype?: string } | null;
};

const listPrefix = async (prefix: string): Promise<Entry[]> => {
  const out: Entry[] = [];
  const PAGE = 1000;
  for (let offset = 0; ; offset += PAGE) {
    const res = await fetch(`${ASSETS_URL}/storage/v1/object/list/${BUCKET}`, {
      method: "POST",
      headers: h(),
      body: JSON.stringify({
        prefix,
        limit: PAGE,
        offset,
        sortBy: { column: "name", order: "asc" },
      }),
    });
    if (!res.ok) throw new Error(`list ${res.status}`);
    const page = (await res.json()) as Entry[];
    out.push(...page.filter((e) => !e.name.startsWith(".")));
    if (page.length < PAGE) break;
  }
  return out;
};

const toFile = (folder: string, e: Entry) => ({
  path: folder ? `${folder}/${e.name}` : e.name,
  name: e.name,
  folder: folder || "",
  size: e.metadata?.size ?? 0,
  mimeType: e.metadata?.mimetype ?? "",
  updatedAt: e.updated_at ?? null,
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!KEY) return json({ error: "chiave del progetto esterno non configurata" }, 500);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");
    const token = req.headers.get("x-sdl-edit") ?? body.token;
    if (token !== EDIT_TOKEN) return json({ error: "non autorizzato" }, 401);

    if (action === "list") {
      const prefix = String(body.prefix ?? "");
      const entries = await listPrefix(prefix);
      return json({
        folders: entries.filter((e) => !e.id).map((e) => e.name),
        files: entries.filter((e) => e.id).map((e) => toFile(prefix.replace(/\/+$/, ""), e)),
      });
    }

    if (action === "list-all") {
      const root = await listPrefix("");
      const folders = root.filter((e) => !e.id).map((e) => e.name);
      const files = root.filter((e) => e.id).map((e) => toFile("", e));
      const perFolder = await Promise.all(
        folders.map(async (f) => (await listPrefix(`${f}/`)).filter((e) => e.id).map((e) => toFile(f, e))),
      );
      return json({ folders, files: [...files, ...perFolder.flat()] });
    }

    if (action === "signed-upload") {
      const path = String(body.path ?? "");
      if (!path) return json({ error: "percorso mancante" }, 400);
      const res = await fetch(
        `${ASSETS_URL}/storage/v1/object/upload/sign/${BUCKET}/${encodeURI(path)}`,
        { method: "POST", headers: h(), body: JSON.stringify({ upsert: Boolean(body.upsert) }) },
      );
      const data = await res.json();
      if (!res.ok) return json({ error: data?.message ?? `errore ${res.status}` }, 400);
      // data.url = "/object/upload/sign/<bucket>/<path>?token=..."
      return json({ uploadUrl: `${ASSETS_URL}/storage/v1${data.url}`, path });
    }

    if (action === "remove") {
      const paths = (body.paths ?? []) as string[];
      if (!Array.isArray(paths) || paths.length === 0) return json({ error: "nessun file" }, 400);
      const res = await fetch(`${ASSETS_URL}/storage/v1/object/${BUCKET}`, {
        method: "DELETE",
        headers: h(),
        body: JSON.stringify({ prefixes: paths }),
      });
      const data = await res.json();
      if (!res.ok) return json({ error: data?.message ?? `errore ${res.status}` }, 400);
      return json({ removed: (data ?? []).map((d: { name: string }) => d.name) });
    }

    if (action === "move") {
      const from = String(body.from ?? "");
      const to = String(body.to ?? "");
      if (!from || !to) return json({ error: "percorsi mancanti" }, 400);
      const res = await fetch(`${ASSETS_URL}/storage/v1/object/move`, {
        method: "POST",
        headers: h(),
        body: JSON.stringify({ bucketId: BUCKET, sourceKey: from, destinationKey: to }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return json({ error: data?.message ?? `errore ${res.status}` }, 400);
      return json({ ok: true });
    }

    return json({ error: `azione sconosciuta: ${action}` }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "errore" }, 500);
  }
});
