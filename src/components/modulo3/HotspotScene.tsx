import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ImagePlaceholder } from "@/components/modulo2/ImagePlaceholder";

export type Hotspot = {
  id: string;
  /** Etichetta breve mostrata nel popup / tooltip */
  label: string;
  /** Posizione percentuale sull'illustrazione (0-100) */
  x: number;
  y: number;
  title: string;
  text: string;
};

type Props = {
  /** Descrizione del placeholder dell'illustrazione centrale */
  illustrationLabel: string;
  hotspots: Hotspot[];
  /** Contenuto extra opzionale sotto l'illustrazione (stessa schermata) */
  children?: React.ReactNode;
};

/**
 * Scena a hotspot stile Prezi: un'illustrazione centrale (placeholder)
 * con punti interattivi cliccabili che aprono un pannello di dettaglio
 * senza cambiare schermata.
 */
export const HotspotScene = ({ illustrationLabel, hotspots, children }: Props) => {
  const [active, setActive] = useState<Hotspot | null>(null);

  return (
    <div className="relative z-10 w-full flex-1 min-h-0 overflow-y-auto px-6 md:px-12 py-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-6 min-h-full justify-center">
        {/* Illustrazione + hotspot */}
        <div className="relative w-full">
          <ImagePlaceholder label={illustrationLabel} className="h-[44vh] w-full" />
          {hotspots.map((h) => {
            const isActive = active?.id === h.id;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => setActive(isActive ? null : h)}
                aria-label={`Dettaglio: ${h.label}`}
                aria-expanded={isActive}
                className="absolute -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: `${h.x}%`, top: `${h.y}%` }}
              >
                <span
                  className={`block w-6 h-6 md:w-7 md:h-7 rounded-full border-2 transition-all ${
                    isActive
                      ? "bg-primary border-primary scale-110"
                      : "bg-background/80 border-primary group-hover:bg-primary/40 group-hover:scale-110"
                  }`}
                >
                  <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping [animation-duration:2.5s]" aria-hidden />
                </span>
                <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 whitespace-nowrap font-mono text-[10px] md:text-xs uppercase tracking-widest text-foreground/70 bg-background/70 px-2 py-0.5 rounded">
                  {h.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Popup dettaglio */}
        <div className="min-h-[9rem]">
          <AnimatePresence mode="wait">
            {active ? (
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="relative rounded-lg border border-primary/50 bg-card/80 px-6 py-5 md:px-8 md:py-6"
              >
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  aria-label="Chiudi dettaglio"
                  className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary mb-2">
                  {active.title}
                </p>
                <p className="text-base md:text-lg text-foreground/85 leading-relaxed max-w-4xl">
                  {active.text}
                </p>
              </motion.div>
            ) : (
              <motion.p
                key="invito"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center font-mono text-xs md:text-sm uppercase tracking-widest text-muted-foreground py-6"
              >
                Tocca un punto sull'illustrazione per scoprire di più
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {children}
      </div>
    </div>
  );
};
