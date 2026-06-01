import { useEffect, useRef, useState } from "react";
import { getAtmosphere, type PauseAtmosphere } from "@/lib/pauseAtmosphere";

type Props = {
  atmosphere?: PauseAtmosphere | null;
  pauseMinutes?: number | null;
  /**
   * Quando true: niente animazioni (respirazione, particelle).
   * Usato dai mini-stage della regia istruttore.
   */
  simplified?: boolean;
  /**
   * Controllo visibilità con dissolvenza morbida (~800ms).
   * undefined: sempre visibile.
   */
  active?: boolean;
};

const FADE_MS = 800;

/**
 * Schermata di pausa Aula: una singola fotografia ambientale a tutto schermo
 * (POV da un tavolino con tazzina e strada tranquilla sullo sfondo).
 * Nessuna sovrapposizione grafica: la scena è la fotografia.
 * Il testo "Pausa" è discreto, in basso, per non rubare attenzione alla scena.
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

  const [mounted, setMounted] = useState<boolean>(isActive);
  const [opacity, setOpacity] = useState<number>(simplified && isActive ? 1 : 0);
  const exitTimer = useRef<number | null>(null);

  // Pre-decode dell'immagine scena: evita pop-in.
  const [assetsReady, setAssetsReady] = useState<boolean>(false);
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setAssetsReady(true);
    };
    img.onerror = () => {
      if (!cancelled) setAssetsReady(true);
    };
    img.src = atm.bg;
    return () => {
      cancelled = true;
    };
  }, [atm.bg]);

  useEffect(() => {
    if (exitTimer.current) {
      window.clearTimeout(exitTimer.current);
      exitTimer.current = null;
    }

    if (isActive) {
      setMounted(true);
      if (!assetsReady) return;
      const r1 = requestAnimationFrame(() => {
        const r2 = requestAnimationFrame(() => setOpacity(1));
        exitTimer.current = r2 as unknown as number;
      });
      return () => cancelAnimationFrame(r1);
    }

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
      {/* SCENA: fotografia unica a piena pagina, leggera respirazione */}
      <div
        className={simplified ? "absolute inset-0" : "absolute inset-0 will-change-transform"}
        style={
          simplified
            ? undefined
            : { animation: "pause-breathe 18s ease-in-out infinite" }
        }
      >
        <img
          src={atm.bg}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay tonale minimo per leggibilità del testo */}
        <div className="absolute inset-0" style={{ background: atm.overlay }} />
        {/* Vignette delicata per profondità */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 40%, transparent 55%, hsl(0 0% 0% / 0.45) 100%)",
          }}
        />
      </div>

      {/* TESTO: discreto, in basso, non centrale */}
      <div className="absolute inset-x-0 bottom-0 px-8 pb-10 sm:pb-12 pointer-events-none">
        <div className="flex items-end justify-between gap-6 max-w-[1600px] mx-auto">
          <div>
            <p
              className="font-mono text-[10px] tracking-[0.45em] uppercase text-white/55 mb-2"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}
            >
              Intervallo
            </p>
            <h2
              className="text-3xl sm:text-4xl font-light text-white/90 leading-none"
              style={{
                textShadow: "0 2px 18px rgba(0,0,0,0.55)",
                letterSpacing: "0.04em",
              }}
            >
              Pausa
            </h2>
          </div>
          <p
            className="text-xs sm:text-sm text-white/65 font-light tracking-wide text-right"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}
          >
            {pauseMinutes
              ? `Riprendiamo tra ${pauseMinutes} minuti`
              : "Riprendiamo tra poco"}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pause-breathe {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.015); }
        }
      `}</style>
    </div>
  );
};
