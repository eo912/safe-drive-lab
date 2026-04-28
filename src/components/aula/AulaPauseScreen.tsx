import { useEffect, useState } from "react";
import cupImg from "@/assets/pause/cup-foreground.png";
import { getAtmosphere, type PauseAtmosphere } from "@/lib/pauseAtmosphere";

type Props = {
  atmosphere?: PauseAtmosphere | null;
  pauseMinutes?: number | null;
};

/**
 * Schermata di pausa Aula: immersiva, full-screen, senza interazione.
 * - Sfondo paesaggio sfocato variabile (sun/rain/snow/stagioni)
 * - Tazza fotorealistica in foreground con vapore animato
 * - Leggera "respirazione" continua (scala 100% -> 101%)
 * - Fade-in lento all'apertura
 * - Nessun timer, nessun countdown visibile
 */
export const AulaPauseScreen = ({ atmosphere, pauseMinutes }: Props) => {
  const atm = getAtmosphere(atmosphere);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[95] overflow-hidden bg-black"
      style={{
        opacity: mounted ? 1 : 0,
        transition: "opacity 600ms ease-out",
      }}
    >
      {/* BACKGROUND: paesaggio sfocato + respirazione lenta */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          animation: "pause-breathe 14s ease-in-out infinite",
        }}
      >
        <img
          src={atm.bg}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "blur(2px) saturate(0.85)" }}
        />
        {/* Overlay tonale per coerenza colore */}
        <div
          className="absolute inset-0"
          style={{ background: atm.overlay }}
        />
      </div>

      {/* MID: superficie tavolo (banda inferiore) */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[40%]"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, hsl(25 25% 6% / 0.55) 35%, hsl(20 30% 4% / 0.85) 100%)",
        }}
      />

      {/* PARTICELLE: pioggia / neve (CSS only, leggere) */}
      {atm.particles === "rain" && <RainLayer />}
      {atm.particles === "snow" && <SnowLayer />}

      {/* FOREGROUND: tazza con vapore */}
      <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
        <div className="relative w-full max-w-[820px] aspect-[16/10] mb-[2vh]">
          {/* VAPORE: tre flussi sfalsati, lenti */}
          <Steam delay={0} duration={9} left="48%" />
          <Steam delay={3} duration={10} left="52%" />
          <Steam delay={6} duration={11} left="50%" />

          <img
            src={cupImg}
            alt=""
            aria-hidden
            className="relative z-10 w-full h-full object-contain object-bottom drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)]"
          />
        </div>
      </div>

      {/* TESTO: "Pausa" centrato */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center pointer-events-none">
        <p className="font-mono text-[10px] sm:text-xs tracking-[0.5em] uppercase text-white/60 mb-5">
          Intervallo
        </p>
        <h2
          className="text-6xl sm:text-7xl md:text-8xl font-semibold text-white/95 leading-none"
          style={{
            textShadow: "0 4px 30px rgba(0,0,0,0.45)",
            letterSpacing: "-0.02em",
          }}
        >
          Pausa
        </h2>
        <p className="mt-6 text-base sm:text-lg text-white/70 font-light tracking-wide">
          {pauseMinutes
            ? `Riprendiamo tra ${pauseMinutes} minuti`
            : "Riprendiamo tra poco"}
        </p>
      </div>

      {/* keyframes inline (scoped al componente) */}
      <style>{`
        @keyframes pause-breathe {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.012); }
        }
        @keyframes pause-steam {
          0%   { transform: translate(-50%, 0) scale(0.9); opacity: 0; }
          15%  { opacity: 0.18; }
          60%  { opacity: 0.12; }
          100% { transform: translate(-50%, -180px) scale(1.6); opacity: 0; }
        }
        @keyframes pause-rain {
          0%   { transform: translateY(-10%); }
          100% { transform: translateY(110%); }
        }
        @keyframes pause-snow {
          0%   { transform: translate(0, -10%); }
          100% { transform: translate(20px, 110%); }
        }
      `}</style>
    </div>
  );
};

const Steam = ({
  delay,
  duration,
  left,
}: {
  delay: number;
  duration: number;
  left: string;
}) => (
  <div
    aria-hidden
    className="absolute z-20 rounded-full"
    style={{
      bottom: "62%",
      left,
      width: "70px",
      height: "70px",
      background:
        "radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0) 70%)",
      filter: "blur(14px)",
      animation: `pause-steam ${duration}s ease-out ${delay}s infinite`,
      transform: "translate(-50%, 0)",
      opacity: 0,
    }}
  />
);

// Pioggia: poche linee diagonali, opacità bassa, nessun overhead.
const RainLayer = () => (
  <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 40 }).map((_, i) => {
      const left = (i * 2.7) % 100;
      const delay = (i % 10) * 0.35;
      const duration = 1.6 + ((i % 5) * 0.25);
      return (
        <span
          key={i}
          className="absolute block bg-white/15"
          style={{
            left: `${left}%`,
            top: 0,
            width: "1px",
            height: "60px",
            transform: "rotate(12deg)",
            animation: `pause-rain ${duration}s linear ${delay}s infinite`,
          }}
        />
      );
    })}
  </div>
);

// Neve: pochi puntini bianchi soft.
const SnowLayer = () => (
  <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 30 }).map((_, i) => {
      const left = (i * 3.4) % 100;
      const delay = (i % 8) * 1.1;
      const duration = 9 + ((i % 6) * 1.5);
      const size = 2 + (i % 3);
      return (
        <span
          key={i}
          className="absolute block rounded-full bg-white/50"
          style={{
            left: `${left}%`,
            top: 0,
            width: `${size}px`,
            height: `${size}px`,
            filter: "blur(0.5px)",
            animation: `pause-snow ${duration}s linear ${delay}s infinite`,
          }}
        />
      );
    })}
  </div>
);
