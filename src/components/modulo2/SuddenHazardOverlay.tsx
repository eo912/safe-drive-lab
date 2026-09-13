import { AnimatePresence, motion } from "framer-motion";

import carBrakingAsset from "@/assets/sudden-hazard-car-braking.jpeg.asset.json";

export type SuddenHazardVariant = "car-braking";
export type SuddenHazardPhase = "idle" | "active" | "resolved";
export type SuddenHazardOutcome = "stopped" | "failed";

type Props = {
  variant: SuddenHazardVariant;
  phase: SuddenHazardPhase;
  outcome?: SuddenHazardOutcome;
};

const variantAssets: Record<SuddenHazardVariant, { src: string; alt: string }> = {
  "car-braking": {
    src: carBrakingAsset.url,
    alt: "Auto davanti che frena sotto la pioggia, vista dall'abitacolo",
  },
};

/** Effetto di pericolo improvviso, montato esclusivamente nella vista Aula Live. */
export const SuddenHazardOverlay = ({ variant, phase, outcome }: Props) => {
  const asset = variantAssets[variant];

  return (
    <AnimatePresence>
      {phase !== "idle" && (
        <motion.div
          key={`${variant}-${phase}`}
          className="absolute inset-0 z-[60] overflow-hidden bg-background"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.08 }}
          aria-live="assertive"
        >
          <motion.img
            src={asset.src}
            alt={asset.alt}
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.03, 1], x: [0, -3, 3, -2, 0], y: [0, 2, -2, 1, 0] }}
            transition={{ duration: 0.27, ease: "easeOut" }}
          />

          <motion.div
            className="pointer-events-none absolute inset-0 bg-primary-foreground"
            initial={{ opacity: 0.96 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          />

          {/* Bagliore sovrapposto ai due fanali già presenti nella fotografia. */}
          <motion.div
            className="pointer-events-none absolute left-[38.5%] top-[42%] h-[17%] w-[10%] rounded-full bg-destructive/50 blur-2xl"
            animate={{ opacity: [0.25, 0.9, 0.4, 0.85, 0.35], scale: [0.85, 1.28, 1, 1.2, 0.95] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute left-[56%] top-[41%] h-[18%] w-[11%] rounded-full bg-destructive/50 blur-2xl"
            animate={{ opacity: [0.3, 0.95, 0.45, 0.9, 0.4], scale: [0.85, 1.3, 1, 1.22, 0.95] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
          />

          {phase === "resolved" && outcome && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-background/65 backdrop-blur-sm"
            >
              <div className="max-w-4xl px-10 text-center">
                <p className="font-mono text-sm uppercase tracking-[0.28em] text-primary">
                  Esito
                </p>
                <p className="mt-5 text-5xl font-bold leading-tight md:text-7xl">
                  {outcome === "stopped"
                    ? "Ti sei fermato in tempo."
                    : "Non ci sei riuscito."}
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};