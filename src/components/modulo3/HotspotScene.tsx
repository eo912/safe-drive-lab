import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ImagePlaceholder } from "@/components/modulo2/ImagePlaceholder";
import { EditableImageSlot } from "@/components/edit/EditableImageSlot";

export type Hotspot = {
  id: string;
  /** Etichetta breve mostrata nel popup / tooltip */
  label: string;
  /** Posizione percentuale sull'illustrazione (0-100) */
  x: number;
  y: number;
  title: string;
  text: string;
  /** Video YouTube opzionale; ha priorità su qualsiasi immagine */
  youtubeEmbedUrl?: string;
  /** Id stabile del video, richiamabile dalla Regia (vedi videoTriggers.ts) */
  videoId?: string;
  /** Immagine opzionale mostrata sopra il testo nel pannello di dettaglio */
  image?: string;
  imageAlt?: string;
  /** Etichetta opzionale per un'immagine gestibile dallo Studio; ha priorità su image */
  imageLabel?: string;
};

type Props = {
  /** Descrizione del placeholder dell'illustrazione centrale */
  illustrationLabel: string;
  hotspots: Hotspot[];
  /** Contenuto extra opzionale sotto l'illustrazione (stessa schermata) */
  children?: React.ReactNode;
  /** Riduce l'ingombro verticale quando illustrazione e contenuti condividono la schermata */
  compact?: boolean;
  imageFit?: "cover" | "contain";
  frameClassName?: string;
};

/**
 * Scena a hotspot stile Prezi: un'illustrazione centrale (placeholder)
 * con punti interattivi cliccabili che aprono un pannello di dettaglio
 * senza cambiare schermata.
 */
export const HotspotScene = ({ illustrationLabel, hotspots, children, compact = false, imageFit = "contain", frameClassName = "" }: Props) => {
  const [active, setActive] = useState<Hotspot | null>(null);
  const [failedImages, setFailedImages] = useState<string[]>([]);

  return (
    <div
      className={`relative z-10 w-full flex-1 min-h-0 px-6 md:px-12 ${
        compact ? "overflow-hidden py-3" : "overflow-y-auto py-8"
      }`}
    >
      <div
        className={`max-w-6xl mx-auto flex flex-col min-h-full justify-center ${
          compact ? "gap-2" : "gap-6"
        }`}
      >
        {/* Illustrazione + hotspot */}
        <div
          className={`relative w-full ${
            active?.youtubeEmbedUrl ? "h-[28vh] max-w-[49.78vh] mx-auto" : frameClassName
          }`}
        >
          <ImagePlaceholder
            label={illustrationLabel}
            className={`${frameClassName ? "h-full" : compact ? "h-[28vh] min-h-[180px]" : "h-[44vh]"} w-full`}
            imageFit={imageFit}
          />
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
        <div className={compact ? "min-h-[5rem]" : "min-h-[9rem]"}>
          <AnimatePresence mode="wait">
            {active ? (
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="relative overflow-hidden rounded-lg border border-primary/50 bg-card/80"
              >
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  aria-label="Chiudi dettaglio"
                  className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background/80 text-muted-foreground backdrop-blur hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                {active.youtubeEmbedUrl && (
                  <iframe
                    src={active.youtubeEmbedUrl}
                    title={active.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-[22vh] min-h-40 w-full border-b border-border/60 bg-background"
                  />
                )}
                {!active.youtubeEmbedUrl && active.imageLabel && (
                  <EditableImageSlot
                    label={active.imageLabel}
                    className="h-[18vh] min-h-36 w-full"
                  >
                    <div className="flex h-[18vh] min-h-36 w-full items-center justify-center border-b border-dashed border-border/70 bg-background/40 px-6 text-center">
                      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        {active.title}
                      </span>
                    </div>
                  </EditableImageSlot>
                )}
                {!active.youtubeEmbedUrl && !active.imageLabel && active.image && !failedImages.includes(active.id) && (
                  <img
                    src={active.image}
                    alt={active.imageAlt ?? active.title}
                    onError={() =>
                      setFailedImages((current) =>
                        current.includes(active.id) ? current : [...current, active.id],
                      )
                    }
                    className="h-[18vh] min-h-36 w-full object-cover"
                  />
                )}
                {!active.youtubeEmbedUrl && !active.imageLabel && active.image && failedImages.includes(active.id) && (
                  <ImagePlaceholder
                    label="Vista dagli specchietti retrovisori"
                    className="h-[18vh] min-h-36 rounded-none border-x-0 border-t-0"
                  />
                )}
                <div className="px-6 py-5 md:px-8 md:py-6">
                  <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary mb-2">
                    {active.title}
                  </p>
                  <p className="text-base md:text-lg text-foreground/85 leading-relaxed max-w-4xl">
                    {active.text}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.p
                key="invito"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`text-center font-mono text-xs md:text-sm uppercase tracking-widest text-muted-foreground ${
                  compact ? "py-3" : "py-6"
                }`}
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
