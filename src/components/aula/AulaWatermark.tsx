import { BrandLogoSlot } from "@/components/brand/BrandLogoSlot";

/**
 * Marchio discreto "Guida Sicura VDA" in un angolo delle schermate Aula.
 * Non interferisce con i contenuti: è fisso, piccolo e non cliccabile.
 */
export const AulaWatermark = () => (
  <div className="fixed bottom-4 left-4 z-30 pointer-events-none opacity-75">
    <BrandLogoSlot
      label="Logo Guida Sicura VDA (marchio schermate)"
      fallback="Guida Sicura VDA"
      className="text-[11px] px-3 py-1.5"
      imgClassName="h-16 w-auto object-contain"
    />
  </div>
);
