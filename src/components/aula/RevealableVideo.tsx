import { Play } from "lucide-react";

type Props = {
  /** Id stabile del video (vedi src/lib/videoTriggers.ts) */
  videoId: string;
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
 */
export const RevealableVideo = ({
  videoId,
  src,
  title,
  revealedVideos,
  className = "",
}: Props) => {
  const revealed = (revealedVideos ?? []).includes(videoId);

  if (!revealed) {
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
    <iframe
      src={src}
      title={title}
      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className={`rounded-lg border border-border/60 bg-background ${className}`}
    />
  );
};
