import { EditableImageSlot } from "@/components/edit/EditableImageSlot";

/**
 * Placeholder flessibile per il Modulo 6 (Tecniche di Guida).
 * Sostituibile con un'immagine reale in modalità modifica.
 */
export const FlexMediaPlaceholder = ({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) => (
  <EditableImageSlot label={label} className={className}>
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/70 bg-muted/20 overflow-hidden"
      role="img"
      aria-label={`Zona contenuto visivo: ${label}`}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
        Contenuto visivo
      </p>
      <p className="font-mono text-xs md:text-sm uppercase tracking-widest text-muted-foreground px-6 text-center leading-relaxed">
        {label}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
        immagine · schema · video · simulatore
      </p>
    </div>
  </EditableImageSlot>
);
