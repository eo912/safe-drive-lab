import type { LucideIcon } from "lucide-react";
import { iconId, usePlaceholderImage } from "@/lib/placeholderImages";

type Props = {
  /** Etichetta della tessera: genera l'id stabile dell'icona */
  label: string;
  /** Icona di default usata finché non ne viene caricata una */
  fallback: LucideIcon;
  className?: string;
};

/**
 * Icona di una tessera: se dallo Studio è stata assegnata un'icona
 * personalizzata la mostra, altrimenti usa l'icona di default.
 */
export const EditableIcon = ({ label, fallback: Fallback, className = "" }: Props) => {
  const url = usePlaceholderImage(iconId(label));

  if (!url) return <Fallback className={className} aria-hidden />;

  return <img src={url} alt="" aria-hidden className={`${className} object-contain`} />;
};
