import { motion } from "framer-motion";
import { Phone, PhoneOff } from "lucide-react";

export type PhonePhase = "idle" | "ringing" | "visible";

type Props = {
  callerName: string;
  onClose?: () => void;
  onAnswer?: () => void;
  onDecline?: () => void;
};

/**
 * Overlay "telefono che squilla" riutilizzabile.
 * Rendering solo lato Aula Live: la Regia non monta mai questo componente.
 * Telefono centrato, non fullscreen, con blur/scurimento dello slide dietro.
 */
export const PhoneCallOverlay = ({
  callerName,
  onClose,
  onAnswer,
  onDecline,
}: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop: sfocatura e scurimento dello slide sottostante */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Cornice telefono */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          x: [0, -2, 2, -2, 0],
        }}
        transition={{
          opacity: { duration: 0.25 },
          scale: { type: "spring", stiffness: 260, damping: 20 },
          x: { repeat: Infinity, duration: 0.35, ease: "linear" },
        }}
        className="relative z-10 w-[280px] md:w-[340px] rounded-[2.5rem] border-[10px] border-black bg-black p-2 shadow-2xl"
      >
        {/* Schermata chiamata in arrivo */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 px-6 pt-12 pb-8 text-center">
          {/* Luce riflesso in alto */}
          <div className="absolute left-1/2 top-3 h-1 w-20 -translate-x-1/2 rounded-full bg-white/20" />

          <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/60">
            Chiamata in arrivo
          </p>

          <p className="mt-8 text-3xl md:text-4xl font-semibold text-white leading-tight">
            {callerName}
          </p>

          <p className="mt-2 text-sm text-white/60">cellulare</p>

          {/* Pulsanti classici rispondi/rifiuta */}
          <div className="mt-12 flex items-end justify-between gap-4">
            <button
              type="button"
              aria-label="Rispondi"
              onClick={onAnswer}
              className="flex flex-col items-center gap-2 focus:outline-none"
            >
              <span
                className="flex h-14 w-14 items-center justify-center rounded-full transition-transform hover:scale-105"
                style={{ backgroundColor: "hsl(142 70% 45%)" }}
              >
                <Phone className="h-7 w-7 text-white" />
              </span>
              <span className="text-xs text-white/80">Rispondi</span>
            </button>

            <button
              type="button"
              aria-label="Rifiuta"
              onClick={onDecline}
              className="flex flex-col items-center gap-2 focus:outline-none"
            >
              <span
                className="flex h-14 w-14 items-center justify-center rounded-full transition-transform hover:scale-105"
                style={{ backgroundColor: "hsl(350 75% 55%)" }}
              >
                <PhoneOff className="h-7 w-7 text-white" />
              </span>
              <span className="text-xs text-white/80">Rifiuta</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
