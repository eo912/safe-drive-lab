import { Play } from "lucide-react";
import { useRequestVideoReveal } from "@/lib/aulaSync";

type Props = {
  /** Id stabile del video (vedi src/lib/videoTriggers.ts) */
  videoId: string;
  /**
   * Modulo corrente: indirizza alla Regia giusta la richiesta di richiamo.
   * Se assente il segnaposto resta un elemento non interattivo, come prima
   * di questa funzionalità (usato da chi non passa ancora questa prop).
   */
  modulo?: string;
  src: string;
  title: string;
  /** Lista dei video richiamati dall'istruttore */
  revealedVideos?: string[];
  className?: string;
};

/**
 * Mostra un video YouTube solo dopo che l'istruttore lo ha richiamato dalla
 * Regia. Finché non è richiamato resta un segnaposto neutro: nessun iframe,
 * quindi nessun caricamento né avvio automatico.
 *
 * Se `modulo` è passato, il segnaposto è anche cliccabile: un tap in Aula
 * chiede alla Regia lo stesso richiamo del pulsante esistente (stesso
 * risultato identico, un secondo modo di attivarlo).
 */
export const RevealableVideo = ({
  videoId,
  modulo,
  src,
  title,
  revealedVideos,
  className = "",
}: Props) => {
  const revealed = (revealedVideos ?? []).includes(videoId);
  const requestReveal = useRequestVideoReveal(modulo ?? "");

  if (!revealed) {
    if (!modulo) {
      return (
        <div
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/70 bg-background/40 px-4 text-center ${className}`}
          aria-label={`Video non ancora richiamato: ${title}`}
        >
          <Play className="h-5 w-5 text-primary" aria-hidden />
          <span className="font-mono text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground">
            Video pronto — richiamato dall'istruttore
          </span>
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={() => requestReveal(videoId)}
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/70 bg-background/40 px-4 text-center transition-colors hover:border-primary/60 hover:bg-background/60 ${className}`}
        aria-label={`Richiama il video: ${title}`}
      >
        <Play className="h-5 w-5 text-primary" aria-hidden />
        <span className="font-mono text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground">
          Video pronto — richiamato dall'istruttore
        </span>
      </button>
    );
  }

  return (
    <iframe
      src={src}
      title={title}
      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className={`rounded-lg border border-border/60 bg-background ${className}`}
    />
  );
};
