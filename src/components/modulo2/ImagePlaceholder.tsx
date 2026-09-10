import { EditableImageSlot } from "@/components/edit/EditableImageSlot";

/**
 * Segnaposto immagine — sostituibile con foto reali in modalità modifica.
 * Fuori dalla modalità modifica l'aspetto resta identico a prima.
 */
export const ImagePlaceholder = ({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) => (
  <EditableImageSlot label={label} className={className}>
    <div
      className="w-full h-full flex items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/20 overflow-hidden"
      role="img"
      aria-label={`Segnaposto immagine: ${label}`}
    >
      <p className="font-mono text-xs md:text-sm uppercase tracking-widest text-muted-foreground px-6 text-center leading-relaxed">
        [Immagine] {label}
      </p>
    </div>
  </EditableImageSlot>
);
