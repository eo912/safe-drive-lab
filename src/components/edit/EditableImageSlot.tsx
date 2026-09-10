import { placeholderId, usePlaceholderImage } from "@/lib/placeholderImages";

type Props = {
  /** Etichetta descrittiva del segnaposto: genera l'id stabile */
  label: string;
  className?: string;
  /** Contenuto segnaposto originale, mostrato quando non c'è immagine */
  children: React.ReactNode;
};

/**
 * Avvolge un segnaposto: se esiste un'immagine associata la mostra,
 * altrimenti lascia il segnaposto invariato.
 *
 * Nessun controllo di modifica in aula: le immagini si gestiscono
 * esclusivamente dalla pagina Studio (/studio).
 */
export const EditableImageSlot = ({ label, className = "", children }: Props) => {
  const id = placeholderId(label);
  const url = usePlaceholderImage(id);

  if (!url) return <>{children}</>;

  return (
    <div className={`relative ${className}`}>
      <img
        src={url}
        alt={label}
        className="w-full h-full object-cover rounded-lg border border-border/50"
      />
    </div>
  );
};
