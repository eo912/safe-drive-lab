import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useEditMode } from "@/lib/editMode";
import NotFound from "@/pages/NotFound";
import { useOnline } from "@/lib/connectivity";
import { OfflineNotice } from "@/components/istruttore/OfflineStatus";
import { FolderList } from "@/components/storage-admin/FolderList";
import { FileGrid } from "@/components/storage-admin/FileGrid";
import { BulkActionsBar } from "@/components/storage-admin/BulkActionsBar";
import { MoveDialog } from "@/components/storage-admin/MoveDialog";
import { DeleteDialog } from "@/components/storage-admin/DeleteDialog";
import { MetaPanel } from "@/components/storage-admin/MetaPanel";
import { UploadDropzone } from "@/components/storage-admin/UploadDropzone";
import { BulkMetaDialog } from "@/components/storage-admin/BulkMetaDialog";
import { STATI, type MediaAsset } from "@/lib/mediaAssets";
import {
  applyFacets,
  deleteFiles,
  filterFiles,
  folderLabel,
  listFiles,
  listFolders,
  loadUsageMap,
  moduliOptions,
  moveFiles,
  ROOT_LABEL,
  type BulkResult,
  type StorageFile,
} from "@/lib/storageAdmin";

/**
 * Utility interna di amministrazione dei file dell'archivio.
 * Raggiungibile solo con la modalità modifica nascosta attiva
 * (?edit=sdl2026 oppure Ctrl+Alt+Shift+E): per chiunque altro è una 404.
 */
const StorageAdmin = () => {
  const editing = useEditMode();
  const online = useOnline();

  const [folders, setFolders] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [active, setActive] = useState<string>("");
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [usage, setUsage] = useState<Record<string, string[]>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [statoFiltro, setStatoFiltro] = useState("");
  const [moduloFiltro, setModuloFiltro] = useState("");
  const [aperto, setAperto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<null | "move" | "delete" | "meta">(null);
  const [esito, setEsito] = useState<string | null>(null);


  const loadFolders = useCallback(async () => {
    const list = await listFolders();
    const all = [...list, ROOT_LABEL];
    setFolders(all);
    setActive((cur) => (cur && all.includes(cur) ? cur : (all[0] ?? "")));
  }, []);

  const loadCurrent = useCallback(async (folder: string) => {
    if (!folder) return;
    setLoading(true);
    const [rows, map] = await Promise.all([listFiles(folder), loadUsageMap()]);
    setFiles(rows);
    setUsage(map);
    setCounts((c) => ({ ...c, [folder]: rows.length }));
    setSelected(new Set());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (editing) loadFolders();
  }, [editing, loadFolders]);

  useEffect(() => {
    if (editing && active) loadCurrent(active);
  }, [editing, active, loadCurrent]);

  const shown = useMemo(
    () => applyFacets(filterFiles(files, query), statoFiltro, moduloFiltro),
    [files, query, statoFiltro, moduloFiltro],
  );

  /** Schede già presenti, per la modifica in blocco e per i suggerimenti. */
  const metas = useMemo(() => {
    const map: Record<string, MediaAsset> = {};
    for (const f of files) if (f.meta) map[f.path] = f.meta;
    return map;
  }, [files]);

  const categorie = useMemo(
    () =>
      Array.from(
        new Set(files.map((f) => f.meta?.categoria ?? "").filter(Boolean)),
      ).sort(),
    [files],
  );

  const fileAperto = useMemo(
    () => shown.find((f) => f.path === aperto) ?? files.find((f) => f.path === aperto) ?? null,
    [shown, files, aperto],
  );


  const toggle = (path: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  const report = (r: BulkResult, verbo: string) => {
    const parts = [`${r.ok.length} file ${verbo}`];
    if (r.failed.length > 0) {
      parts.push(
        `${r.failed.length} non riusciti: ${r.failed
          .slice(0, 3)
          .map((f) => `${f.path.split("/").pop()} (${f.message})`)
          .join("; ")}`,
      );
    }
    setEsito(parts.join(" · "));
  };

  const runDelete = async () => {
    setBusy(true);
    try {
      const r = await deleteFiles([...selected]);
      report(r, "eliminati");
    } finally {
      setBusy(false);
      setDialog(null);
      await loadCurrent(active);
    }
  };

  const runMove = async (dest: string, onCollision: "rename" | "skip") => {
    setBusy(true);
    try {
      const r = await moveFiles([...selected], dest, onCollision);
      report(r, "spostati");
    } finally {
      setBusy(false);
      setDialog(null);
      await loadFolders();
      await loadCurrent(active);
    }
  };

  if (!editing) return <NotFound />;

  if (!online)
    return (
      <div className="mx-auto max-w-xl p-8">
        <OfflineNotice what="La gestione dei file dell'archivio" />
      </div>
    );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3">
        <h1 className="text-base font-semibold">Gestione file</h1>
        <span className="text-xs text-muted-foreground">archivio immagini e video</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca per nome, tag, categoria…"
          className="ml-auto w-64 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        />
        <select
          value={statoFiltro}
          onChange={(e) => setStatoFiltro(e.target.value)}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        >
          <option value="">Tutti gli stati</option>
          {STATI.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={moduloFiltro}
          onChange={(e) => setModuloFiltro(e.target.value)}
          className="max-w-[14rem] rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        >
          <option value="">Tutti i moduli</option>
          {moduliOptions.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => loadCurrent(active)}
          className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-muted/60"
        >
          <RefreshCw className="h-4 w-4" /> Aggiorna
        </button>
      </header>

      <div className="flex flex-1">
        <FolderList
          folders={folders}
          counts={counts}
          active={active}
          onSelect={setActive}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-border/60 px-4 py-2 text-sm">
            <span className="font-medium">{folderLabel(active || "")}</span>
            <span className="text-muted-foreground">
              {loading ? "caricamento…" : `${shown.length} di ${files.length} file`}
            </span>
            <button
              type="button"
              onClick={() => setSelected(new Set(shown.map((f) => f.path)))}
              className="ml-auto text-muted-foreground hover:text-foreground"
            >
              Seleziona tutto
            </button>
          </div>

          <div className="border-b border-border/60 px-4 py-3">
            <UploadDropzone
              folder={active || ROOT_LABEL}
              onDone={(paths) => {
                if (paths.length > 0) void loadCurrent(active);
              }}
            />
          </div>

          {esito && (
            <p className="border-b border-border/60 bg-muted/40 px-4 py-2 text-sm">
              {esito}
            </p>
          )}

          <div className="flex-1 overflow-auto">
            <FileGrid
              files={shown}
              selected={selected}
              usage={usage}
              activePath={aperto}
              onToggle={toggle}
              onOpen={(f) => setAperto(f.path)}
            />
          </div>

          <BulkActionsBar
            count={selected.size}
            busy={busy}
            onMove={() => setDialog("move")}
            onEdit={() => setDialog("meta")}
            onDelete={() => setDialog("delete")}
            onClear={() => setSelected(new Set())}
          />
        </main>

        {fileAperto && (
          <MetaPanel
            file={fileAperto}
            usage={usage}
            categorie={categorie}
            onClose={() => setAperto(null)}
            onSaved={() => void loadCurrent(active)}
          />
        )}
      </div>

      {dialog === "move" && (
        <MoveDialog
          count={selected.size}
          folders={folders}
          current={active}
          busy={busy}
          onCancel={() => setDialog(null)}
          onConfirm={runMove}
        />
      )}
      {dialog === "meta" && (
        <BulkMetaDialog
          paths={[...selected]}
          existing={metas}
          onClose={() => setDialog(null)}
          onDone={() => void loadCurrent(active)}
        />
      )}
      {dialog === "delete" && (
        <DeleteDialog
          paths={[...selected]}
          usage={usage}
          busy={busy}
          onCancel={() => setDialog(null)}
          onConfirm={runDelete}
        />
      )}
    </div>
  );
};

export default StorageAdmin;

