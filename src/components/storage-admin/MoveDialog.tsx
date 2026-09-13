import { useState } from "react";
import { folderLabel } from "@/lib/storageAdmin";

type Props = {
  count: number;
  folders: string[];
  current: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (dest: string, onCollision: "rename" | "skip") => void;
};

/** Scelta della cartella di destinazione per lo spostamento in blocco. */
export const MoveDialog = ({ count, folders, current, busy, onCancel, onConfirm }: Props) => {
  const options = folders.filter((f) => f !== current);
  const [dest, setDest] = useState(options[0] ?? "");
  const [nuova, setNuova] = useState("");
  const [collision, setCollision] = useState<"rename" | "skip">("rename");
  const target = nuova.trim() || dest;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-5">
        <h2 className="text-lg font-semibold">Sposta {count} file</h2>

        <label className="mt-4 block text-sm text-muted-foreground">
          Cartella di destinazione
        </label>
        <select
          value={dest}
          onChange={(e) => setDest(e.target.value)}
          disabled={nuova.trim().length > 0}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
        >
          {options.map((f) => (
            <option key={f} value={f}>
              {folderLabel(f)}
            </option>
          ))}
        </select>

        <label className="mt-4 block text-sm text-muted-foreground">
          Oppure crea una nuova cartella
        </label>
        <input
          value={nuova}
          onChange={(e) => setNuova(e.target.value)}
          placeholder="es. archivio-2025"
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />

        <label className="mt-4 flex items-center gap-2 text-sm text-foreground/90">
          <input
            type="checkbox"
            checked={collision === "skip"}
            onChange={(e) => setCollision(e.target.checked ? "skip" : "rename")}
          />
          Salta i file con nome già presente (altrimenti rinomina con -2)
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted/60"
          >
            Annulla
          </button>
          <button
            type="button"
            disabled={busy || !target}
            onClick={() => onConfirm(target, collision)}
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Spostamento…" : "Sposta"}
          </button>
        </div>
      </div>
    </div>
  );
};
