import { placeholderIdFor, usePlaceholderImage } from "@/lib/placeholderImages";

/** Cartella/prefisso usato per i loghi di marchio. */
export const BRAND_FOLDER = "brand";

/** Id stabile del logo, indipendente dalla route. */
export const brandLogoId = (label: string) => placeholderIdFor(BRAND_FOLDER, label);

type Props = {
  /** Etichetta del logo (stessa usata nello Studio). */
  label: string;
  /** Testo mostrato finché il logo vero non è stato caricato. */
  fallback: string;
  className?: string;
  imgClassName?: string;
};

/**
 * Slot logo: mostra l'immagine caricata dalla libreria, altrimenti
 * un riquadro segnaposto discreto con il nome del marchio.
 */
export const BrandLogoSlot = ({
  label,
  fallback,
  className = "",
  imgClassName = "",
}: Props) => {
  const url = usePlaceholderImage(brandLogoId(label));

  if (url) {
    return <img src={url} alt={fallback} className={imgClassName || className} />;
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded border border-border/60 bg-background/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground ${className}`}
    >
      {fallback}
    </span>
  );
};
