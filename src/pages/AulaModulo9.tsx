import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { useAulaSubscriber, useAulaHeartbeat } from "@/lib/aulaSync";
import { useVisibleBlock } from "@/lib/aulaVisibleBlock";
import { prevModuleAulaUrl, useEnterAtLastSection } from "@/lib/aulaModuleNav";
import { AulaMediaOverlay } from "@/components/aula/AulaMediaOverlay";
import { AulaEmbedLayer } from "@/components/aula/AulaEmbedLayer";
import { AulaPauseScreen } from "@/components/aula/AulaPauseScreen";
import { SyncDebugOverlay } from "@/components/dev/SyncDebugOverlay";
import { ModuloNextNav } from "@/components/aula/ModuloNextNav";
import { AulaWatermark } from "@/components/aula/AulaWatermark";
import { QuizQuestion } from "@/components/moduloQuiz/QuizQuestion";
import { quizFinale } from "@/lib/quizFinale";

const MODULO = "modulo-9-verifica-finale";

type RenderLevel = "full" | "live" | "preview";

const Slide = ({
  children,
  bg,
  className = "",
  blockId,
}: {
  children: React.ReactNode;
  bg?: "dark" | "darker" | "card" | "black";
  className?: string;
  blockId?: string;
}) => {
  const bgStyle =
    bg === "darker"
      ? "hsl(220 20% 5%)"
      : bg === "card"
        ? "hsl(var(--card))"
        : bg === "black"
          ? "#000"
          : undefined;

  return (
    <section
      data-block={blockId}
      className={`relative w-full h-screen flex items-center justify-center overflow-hidden snap-start snap-always ${className}`}
      style={bgStyle ? { backgroundColor: bgStyle } : undefined}
    >
      {children}
    </section>
  );
};

const AulaModulo9 = () => {
  const navigate = useNavigate();
  const [showExit, setShowExit] = useState(false);
  const aulaState = useAulaSubscriber(MODULO, "verifica-1");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isAnimatingRef = useRef(false);

  const urlParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const forcePauseFromUrl = urlParams?.get("state") === "pausa";
  const embedParam = urlParams?.get("embed");
  const embedMode = embedParam === "mini" || embedParam === "preview";
  const renderLevel: RenderLevel =
    embedParam === "preview" ? "preview" : embedParam === "mini" ? "live" : "full";
  const embedBlocco = urlParams?.get("blocco") ?? "verifica-1";
  const embedPaused = urlParams?.get("pausa") === "1";
  const embedAtm =
    (urlParams?.get("atm") as import("@/lib/pauseAtmosphere").PauseAtmosphere | null) ??
    null;

  const isPaused = embedMode ? embedPaused : aulaState.paused || forcePauseFromUrl;

  // Posizione REALE visibile in Aula (anche dopo scroll manuale locale).
  const visibleBlock = useVisibleBlock(scrollerRef, aulaState.blocco, !embedMode);

  useAulaHeartbeat(!embedMode, {
    ackTs: aulaState.cmdTs,
    modulo: MODULO,
    blocco: visibleBlock,
    step: aulaState.step,
    paused: Boolean(isPaused),
    pauseAtmosphere: aulaState.pauseAtmosphere,
  });

  const navigateSection = useCallback((delta: number) => {
    const scroller = scrollerRef.current;
    if (!scroller || isAnimatingRef.current) return;
    const sections: HTMLElement[] = Array.from(
      scroller.querySelectorAll<HTMLElement>("section"),
    );
    if (sections.length === 0) return;
    const top = scroller.scrollTop;
    let currentIdx = 0;
    let bestDist = Infinity;
    sections.forEach((s, i) => {
      const d = Math.abs(s.offsetTop - top);
      if (d < bestDist) {
        bestDist = d;
        currentIdx = i;
      }
    });
    const nextIdx = Math.max(0, Math.min(sections.length - 1, currentIdx + delta));
    if (nextIdx === currentIdx) {
      // Air mouse: fine modulo -> se esiste un link "Modulo successivo", seguilo.
      if (delta > 0) {
        scroller.querySelector<HTMLAnchorElement>("[data-modulo-next]")?.click();
      } else if (delta < 0) {
        // Inizio modulo -> torna all'ultima scheda del modulo precedente (se esiste).
        const prevUrl = prevModuleAulaUrl(MODULO);
        if (prevUrl) navigate(prevUrl);
      }
      return;
    }
    isAnimatingRef.current = true;
    sections[nextIdx].scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      isAnimatingRef.current = false;
    }, 600);
  }, [navigate]);

  useEnterAtLastSection(scrollerRef, !embedMode);

  useEffect(() => {
    const target = embedMode ? embedBlocco : aulaState.blocco;
    if (!target) return;
    if (!embedMode && isPaused) return;
    const el = document.querySelector<HTMLElement>(`[data-block="${target}"]`);
    if (!el) return;
    if (embedMode) {
      el.scrollIntoView({ behavior: "auto", block: "start" });
      return;
    }
    isAnimatingRef.current = true;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      isAnimatingRef.current = false;
    }, 600);
  }, [embedMode, embedBlocco, aulaState.blocco, aulaState.step, aulaState.ts, isPaused]);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    if (embedMode) return;

    const handleMouseMove = (e: MouseEvent) => {
      setShowExit(e.clientX < 80 && e.clientY < 80);
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate(`/istruttore/${MODULO}`);
        return;
      }
      if (isPaused) return;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        navigateSection(1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        navigateSection(-1);
      }
    };

    let wheelLock = 0;
    const handleWheel = (e: WheelEvent) => {
      if (isPaused) return;
      e.preventDefault();
      const now = Date.now();
      if (isAnimatingRef.current || now - wheelLock < 700) return;
      if (Math.abs(e.deltaY) < 10) return;
      wheelLock = now;
      navigateSection(e.deltaY > 0 ? 1 : -1);
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (isPaused) return;
      const dy = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(dy) < 40) return;
      navigateSection(dy > 0 ? 1 : -1);
    };

    const scroller = scrollerRef.current;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKey);
    scroller?.addEventListener("wheel", handleWheel, { passive: false });
    scroller?.addEventListener("touchstart", handleTouchStart, { passive: true });
    scroller?.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKey);
      scroller?.removeEventListener("wheel", handleWheel);
      scroller?.removeEventListener("touchstart", handleTouchStart);
      scroller?.removeEventListener("touchend", handleTouchEnd);
    };
  }, [navigate, navigateSection, isPaused, embedMode]);

  return (
    <div
      ref={scrollerRef}
      data-render-level={renderLevel}
      className={`${embedMode ? "" : "aula-projection"} bg-background text-foreground fixed inset-0 overflow-y-auto snap-y snap-mandatory overscroll-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
        embedMode ? "pointer-events-none" : ""
      }`}
      style={{ scrollBehavior: embedMode ? "auto" : "smooth" }}
    >
      {embedMode && (
        <style>{`
          [data-render-level="preview"] *,
          [data-render-level="live"] * {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
          }
          [data-render-level="preview"] [style*="opacity: 0"],
          [data-render-level="live"] [style*="opacity: 0"] {
            opacity: 1 !important;
          }
        `}</style>
      )}

      <AulaPauseScreen
        active={isPaused}
        atmosphere={embedMode ? (embedAtm ?? "sun") : aulaState.pauseAtmosphere}
        pauseMinutes={embedMode ? undefined : aulaState.pauseMinutes}
        simplified={embedMode}
      />

      {!embedMode && !isPaused && aulaState.media && (
        <AulaMediaOverlay media={aulaState.media} />
      )}

      {!embedMode && !isPaused && aulaState.embeds && aulaState.embeds.length > 0 && (
        <AulaEmbedLayer embeds={aulaState.embeds} />
      )}

      {!isPaused && <AulaWatermark />}

      {!embedMode && aulaState.blackout && (
        <div className="fixed inset-0 z-[9999] bg-background" aria-hidden="true" />
      )}

      {!embedMode && <SyncDebugOverlay side="aula" live={aulaState} />}

      {!embedMode && (
        <Link
          to={`/istruttore/${MODULO}`}
          aria-label="Esci dalla modalità aula"
          className={`fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-md bg-background/70 backdrop-blur border border-border/40 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-border transition-opacity duration-300 ${
            showExit ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Esci
        </Link>
      )}

      {/* ============================================================
          BLOCCO 1 — TEST FINALE, DOMANDE 1-5
          ============================================================ */}
      <Slide bg="black" blockId="verifica-1" className="items-stretch">
        <div className="relative z-10 w-full h-full px-6 md:px-12 py-3 md:py-4">
          <div className="max-w-6xl mx-auto flex flex-col gap-2 justify-center min-h-full">
            <div className="text-center">
              <p className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-0.5">
                Verifica finale · Test di apprendimento
              </p>
              <h1 className="text-lg md:text-xl font-bold leading-tight">
                Dieci domande,{" "}
                <span className="text-primary">una sola cosa conta</span>: capire
              </h1>
              <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5">
                Il docente legge la domanda, l'aula risponde a voce, il docente
                evidenzia l'opzione con il mouse.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              {quizFinale.slice(0, 5).map((q, i) => (
                <QuizQuestion key={q.id} data={q} number={i + 1} />
              ))}
            </div>
          </div>
        </div>
      </Slide>

      {/* ============================================================
          BLOCCO 2 — TEST FINALE, DOMANDE 6-10
          ============================================================ */}
      <Slide bg="black" blockId="verifica-2" className="items-stretch">
        <div className="relative z-10 w-full h-full px-6 md:px-12 py-3 md:py-4">
          <div className="max-w-6xl mx-auto flex flex-col gap-2 justify-center min-h-full">
            <div className="text-center">
              <p className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-0.5">
                Verifica finale · Seconda parte
              </p>
              <h1 className="text-lg md:text-xl font-bold leading-tight">
                Ultime cinque domande
              </h1>
            </div>

            <div className="flex flex-col gap-1.5">
              {quizFinale.slice(5).map((q, i) => (
                <QuizQuestion key={q.id} data={q} number={i + 6} />
              ))}
            </div>
          </div>
        </div>
        <ModuloNextNav to="/aula" label="Torna all'indice moduli" backToIndex />
      </Slide>
    </div>
  );
};

export default AulaModulo9;
