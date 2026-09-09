/**
 * Placeholder flessibile per il Modulo 6 (Tecniche di Guida).
 *
 * Pensato per essere sostituito in futuro da qualunque tipo di contenuto
 * visivo: immagine, schema, video o embed del simulatore interattivo.
 * Basta sostituire il componente <FlexMediaPlaceholder> nel punto d'uso
 * con il contenuto reale mantenendo lo stesso wrapper/ingombro.
 */
export const FlexMediaPlaceholder = ({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) => (
  <div
    className={`w-full flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/70 bg-muted/20 overflow-hidden ${className}`}
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
);
