import { useEffect, useRef, useState } from "react";
import cupImg from "@/assets/pause/cup-foreground.png";
import { getAtmosphere, type PauseAtmosphere } from "@/lib/pauseAtmosphere";

type Props = {
  atmosphere?: PauseAtmosphere | null;
  pauseMinutes?: number | null;
  /**
   * Quando true: niente animazioni (vapore, respirazione, particelle pioggia/neve).
   * Usato dai mini-stage della regia istruttore per ridurre il carico CPU/GPU.
   */
  simplified?: boolean;
  /**
   * Controllo visibilità con dissolvenza morbida (~800ms).
   * Quando undefined: si comporta come sempre visibile (compat retroattiva).
   * Quando false: avvia il fade-out e smonta al termine.
   */
  active?: boolean;
};

const FADE_MS = 800;

/**
 * Schermata di pausa Aula: immersiva, full-screen, senza interazione.
 * - Sfondo paesaggio sfocato variabile (sun/rain/snow/stagioni)
 * - Tavolino in legno con tazza fotorealistica appoggiata
 * - Vapore animato dalla tazza
 * - Leggera "respirazione" continua del paesaggio
 * - Fade-in / fade-out morbidi (~800ms): tutta la scena appare/scompare come unico elemento
 *
 * In modalità `simplified`: rendering statico (no vapore, no particelle, no breathe).
 */
export const AulaPauseScreen = ({
  atmosphere,
  pauseMinutes,
  simplified = false,
  active,
}: Props) => {
  const controlled = active !== undefined;
  const isActive = controlled ? !!active : true;
  const atm = getAtmosphere(atmosphere);

  // visibile = mantenuta in DOM. visibleOpacity = stato della dissolvenza.
  const [mounted, setMounted] = useState<boolean>(isActive);
  const [opacity, setOpacity] = useState<number>(simplified && isActive ? 1 : 0);
  const exitTimer = useRef<number | null>(null);

  // Pre-decode dell'immagine sfondo + tazza prima di mostrare la scena:
  // evita la sensazione di "costruzione" progressiva.
  const [assetsReady, setAssetsReady] = useState<boolean>(false);
  useEffect(() => {
    let cancelled = false;
    const preload = (src: string) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = src;
      });
    Promise.all([preload(atm.bg), preload(cupImg)]).then(() => {
      if (!cancelled) setAssetsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [atm.bg]);

  // Gestione entry/exit
  useEffect(() => {
    if (exitTimer.current) {
      window.clearTimeout(exitTimer.current);
      exitTimer.current = null;
    }

    if (isActive) {
      setMounted(true);
      if (!assetsReady) return;
      // Doppio rAF: assicura che il browser abbia committato opacity:0 prima della transizione.
      const r1 = requestAnimationFrame(() => {
        const r2 = requestAnimationFrame(() => setOpacity(1));
        exitTimer.current = r2 as unknown as number;
      });
      return () => cancelAnimationFrame(r1);
    }

    // Uscita: fade out → unmount dopo FADE_MS
    setOpacity(0);
    exitTimer.current = window.setTimeout(() => {
      setMounted(false);
    }, FADE_MS);
    return () => {
      if (exitTimer.current) window.clearTimeout(exitTimer.current);
    };
  }, [isActive, assetsReady]);

  if (!mounted) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[95] overflow-hidden bg-black"
      style={{
        opacity,
        transition: `opacity ${FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        willChange: "opacity",
      }}
    >
      {/* BACKGROUND: paesaggio sfocato + respirazione lenta */}
      <div
        className={simplified ? "absolute inset-0" : "absolute inset-0 will-change-transform"}
        style={
          simplified
            ? undefined
            : { animation: "pause-breathe 14s ease-in-out infinite" }
        }
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

      {/* PARTICELLE: pioggia / neve (CSS only). Disattivate in simplified. */}
      {!simplified && atm.particles === "rain" && <RainLayer />}
      {!simplified && atm.particles === "snow" && <SnowLayer />}

      {/* TAVOLINO: superficie in legno con prospettiva, occupa la fascia inferiore */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[42%] pointer-events-none">
        {/* Penombra di transizione paesaggio → tavolo */}
        <div
          className="absolute inset-x-0 -top-16 h-16"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, hsl(25 30% 5% / 0.55) 100%)",
          }}
        />
        {/* Piano del tavolo (legno scuro) con leggera prospettiva */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, hsl(22 35% 14%) 0%, hsl(20 38% 10%) 45%, hsl(18 40% 7%) 100%)",
          }}
        />
        {/* Venature legno (sottilissime, soft) */}
        <div
          className="absolute inset-0 opacity-40 mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(180deg, transparent 0px, transparent 6px, hsl(25 40% 22% / 0.35) 7px, transparent 8px, transparent 14px)",
          }}
        />
        {/* Bordo anteriore del tavolo: linea di luce calda */}
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, hsl(35 60% 45% / 0.45) 50%, transparent 100%)",
          }}
        />
        {/* Vignette laterale */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 100%, transparent 40%, hsl(20 30% 3% / 0.55) 100%)",
          }}
        />
      </div>

      {/* FOREGROUND: tazza appoggiata sul tavolino, con ombra di contatto */}
      <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
        <div className="relative w-full max-w-[760px] aspect-[16/10]" style={{ marginBottom: "8vh" }}>
          {/* Ombra di contatto sul tavolo (ellisse sotto la tazza) */}
          <div
            aria-hidden
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: "4%",
              width: "46%",
              height: "30px",
              background:
                "radial-gradient(ellipse at center, hsl(0 0% 0% / 0.65) 0%, hsl(0 0% 0% / 0.25) 55%, transparent 75%)",
              filter: "blur(6px)",
            }}
          />

          {/* VAPORE: tre flussi sfalsati. Disattivato in simplified. */}
          {!simplified && (
            <>
              <Steam delay={0} duration={9} left="48%" />
              <Steam delay={3} duration={10} left="52%" />
              <Steam delay={6} duration={11} left="50%" />
            </>
          )}

          <img
            src={cupImg}
            alt=""
            aria-hidden
            className="relative z-10 w-full h-full object-contain object-bottom drop-shadow-[0_24px_30px_rgba(0,0,0,0.55)]"
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
