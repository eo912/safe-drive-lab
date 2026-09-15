import { placeholderId, usePlaceholderMedia } from "@/lib/placeholderImages";

type Props = {
  /** Etichetta descrittiva del segnaposto: genera l'id stabile */
  label: string;
  className?: string;
  /** Contenuto segnaposto originale, mostrato quando non c'è immagine */
  children: React.ReactNode;
};

/**
 * Avvolge un segnaposto: se esiste un contenuto associato (immagine o video)
 * lo mostra, altrimenti lascia il segnaposto invariato.
 *
 * Nessun controllo di modifica in aula: i contenuti si gestiscono
 * esclusivamente dallo Studio della Regia.
 */
export const EditableImageSlot = ({ label, className = "", children }: Props) => {
  const media = usePlaceholderMedia(placeholderId(label));

  if (!media) return <>{children}</>;

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      {media.kind === "image" && (
        <img
          src={media.url}
          alt={label}
          className="block h-full w-full rounded-lg border border-border/50 object-cover object-center"
        />
      )}
      {media.kind === "video" && (
        <video
          src={media.url}
          controls
          playsInline
          className="w-full h-full object-cover rounded-lg border border-border/50 bg-background"
        />
      )}
      {media.kind === "youtube" && (
        <iframe
          src={media.url}
          title={label}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          className="w-full h-full rounded-lg border border-border/50 bg-background"
        />
      )}
    </div>
  );
};
