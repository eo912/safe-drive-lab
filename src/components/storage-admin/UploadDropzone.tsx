import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { uploadFiles } from "@/lib/storageAdmin";

type Props = {
  folder: string;
  onDone: (paths: string[]) => void;
};

/** Area di caricamento: trascina i file oppure scegli dal computer. */
export const UploadDropzone = ({ folder, onDone }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [sopra, setSopra] = useState(false);
  const [stato, setStato] = useState<string | null>(null);
  const [errori, setErrori] = useState<string[]>([]);

  const carica = async (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;
    setErrori([]);
    setStato(`Caricamento 0 / ${files.length}`);
    const { paths, failed } = await uploadFiles(files, folder, (done, total) =>
      setStato(`Caricamento ${done} / ${total}`),
    );
    setStato(paths.length > 0 ? `${paths.length} file caricati.` : "Nessun file caricato.");
    setErrori(failed.map((f) => `${f.name}: ${f.message}`));
    onDone(paths);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setSopra(true);
      }}
      onDragLeave={() => setSopra(false)}
      onDrop={(e) => {
        e.preventDefault();
        setSopra(false);
        void carica(e.dataTransfer.files);
      }}
      className={`rounded-lg border border-dashed px-4 py-3 text-sm ${
        sopra ? "border-primary bg-primary/5" : "border-border/70"
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Upload className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">
          Trascina qui i file per la cartella <strong>{folder}</strong>
        </span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted/60"
        >
          Scegli dal computer
        </button>
        {stato && <span className="text-xs text-muted-foreground">{stato}</span>}
      </div>
      {errori.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs text-destructive">
          {errori.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          void carica(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
};
