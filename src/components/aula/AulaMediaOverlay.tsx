import type { Resource } from "@/lib/instructorTypes";

type Props = { media: Resource };

/**
 * Overlay full-screen che mostra il media inviato dall'istruttore in Aula.
 * Nessun controllo tecnico, nessun titolo: solo il contenuto.
 * - image/pdf → renderizzati inline
 * - video → tag <video controls> (NO autoplay automatico, parte solo al click)
 * - link/document → embed iframe
 */
export const AulaMediaOverlay = ({ media }: Props) => {
  return (
    <div
      className="fixed inset-0 z-[80] bg-background flex items-center justify-center"
      role="presentation"
    >
      {media.kind === "image" && (
        <img
          src={media.url}
          alt={media.title}
          className="max-w-full max-h-full object-contain"
        />
      )}

      {media.kind === "video" && (
        <video
          src={media.url}
          controls
          playsInline
          className="max-w-full max-h-full"
        />
      )}

      {media.kind === "pdf" && (
        <iframe
          src={media.url}
          title={media.title}
          className="w-full h-full border-0"
        />
      )}

      {(media.kind === "link" || media.kind === "document") && (
        <iframe
          src={media.url}
          title={media.title}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      )}
    </div>
  );
};
