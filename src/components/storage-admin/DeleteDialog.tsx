import { useState } from "react";
import { describePlaceholderId } from "@/lib/storageAdmin";

type Props = {
  paths: string[];
  usage: Record<string, string[]>;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Conferma unica per la cancellazione in blocco. */
export const DeleteDialog = ({ paths, usage, busy, onCancel, onConfirm }: Props) => {
  const used = paths.filter((p) => (usage[p] ?? []).length > 0);
  const [ack, setAck] = useState(false);
  const blocked = used.length > 0 && !ack;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-background p-5">
        <h2 className="text-lg font-semibold">Elimina {paths.length} file</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          L'operazione è definitiva e non si può annullare.
        </p>

        <div className="mt-3 max-h-40 overflow-auto rounded-md border border-border/60 p-2 text-xs text-foreground/80">
          {paths.map((p) => (
            <p key={p} className="truncate">
              {p}
            </p>
          ))}
        </div>

        {used.length > 0 && (
          <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
            <p className="font-medium text-destructive">
              {used.length} file sono usati in schermate del corso:
            </p>
            <ul className="mt-2 max-h-28 list-disc space-y-0.5 overflow-auto pl-5 text-xs text-foreground/80">
              {used.map((p) => (
                <li key={p}>
                  {p.split("/").pop()} →{" "}
                  {(usage[p] ?? []).map(describePlaceholderId).join(", ")}
                </li>
              ))}
            </ul>
            <label className="mt-3 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
              />
              Ho capito: quelle schermate resteranno senza immagine.
            </label>
          </div>
        )}

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
            disabled={busy || blocked}
            onClick={onConfirm}
            className="rounded-md bg-destructive px-3 py-1.5 text-sm text-destructive-foreground disabled:opacity-50"
          >
            {busy ? "Eliminazione…" : "Elimina definitivamente"}
          </button>
        </div>
      </div>
    </div>
  );
};
