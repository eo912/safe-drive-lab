/**
 * Segnaposto immagine — da sostituire con foto reali.
 * Nessuna immagine generata: solo un riquadro grigio con la descrizione.
 */
export const ImagePlaceholder = ({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) => (
  <div
    className={`w-full flex items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/20 overflow-hidden ${className}`}
    role="img"
    aria-label={`Segnaposto immagine: ${label}`}
  >
    <p className="font-mono text-xs md:text-sm uppercase tracking-widest text-muted-foreground px-6 text-center leading-relaxed">
      [Immagine] {label}
    </p>
  </div>
);
