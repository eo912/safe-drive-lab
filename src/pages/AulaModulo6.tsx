import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { useAulaSubscriber, useAulaHeartbeat } from "@/lib/aulaSync";
import { AulaMediaOverlay } from "@/components/aula/AulaMediaOverlay";
import { AulaEmbedLayer } from "@/components/aula/AulaEmbedLayer";
import { AulaPauseScreen } from "@/components/aula/AulaPauseScreen";
import { SyncDebugOverlay } from "@/components/dev/SyncDebugOverlay";
import { FlexMediaPlaceholder } from "@/components/modulo6/FlexMediaPlaceholder";
import { ModuloNextNav } from "@/components/aula/ModuloNextNav";

const MODULO = "modulo-6-tecniche-di-guida";

const fade = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: { once: true, margin: "-15%" },
  transition: { duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] },
};

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

const AulaModulo6 = () => {
  const navigate = useNavigate();
  const [showExit, setShowExit] = useState(false);
  const aulaState = useAulaSubscriber(MODULO, "anticipare");
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
  const embedBlocco = urlParams?.get("blocco") ?? "anticipare";
  const embedPaused = urlParams?.get("pausa") === "1";
  const embedAtm =
    (urlParams?.get("atm") as import("@/lib/pauseAtmosphere").PauseAtmosphere | null) ??
    null;

  const isPaused = embedMode ? embedPaused : aulaState.paused || forcePauseFromUrl;

  useAulaHeartbeat(!embedMode, {
    modulo: MODULO,
    blocco: aulaState.blocco,
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
    if (nextIdx === currentIdx) return;
    isAnimatingRef.current = true;
    sections[nextIdx].scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      isAnimatingRef.current = false;
    }, 600);
  }, []);

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
      className={`bg-background text-foreground fixed inset-0 overflow-y-auto snap-y snap-mandatory overscroll-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
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

      {!embedMode && aulaState.blackout && (
        <div className="fixed inset-0 z-[9999] bg-black" aria-hidden="true" />
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
          BLOCCO 1 — ANTICIPARE
          ============================================================ */}
      <Slide bg="black" blockId="anticipare" className="items-stretch">
        <div className="relative z-10 w-full h-full px-6 md:px-12 py-8 md:py-10">
          <div className="max-w-6xl mx-auto flex flex-col gap-4 justify-center min-h-full">
            <div className="text-center">
              <p className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-3">
                Modulo 06 · Tecniche di Guida
              </p>
              <h1 className="text-2xl md:text-4xl font-bold leading-tight">
                Guidare è decidere in anticipo,{" "}
                <span className="text-primary">non reagire</span>
              </h1>
            </div>

            <div className="grid md:grid-cols-[1.35fr_1fr] gap-6 items-center">
              <motion.div {...fade} className="flex flex-col gap-3">
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  Osservare lontano non basta guardare avanti nello spazio — serve
                  guardare avanti nel tempo. Non «cosa vedo ora», ma{" "}
                  <span className="text-foreground font-medium">
                    «cosa potrebbe succedere nei prossimi secondi»
                  </span>
                  . Solo così puoi anticipare — rallentare leggermente, spostare
                  lo sguardo, prepararti — invece di reagire d'istinto quando è
                  già tardi per farlo con calma.
                </p>
                <div className="rounded-lg border border-primary/60 bg-background/90 px-5 py-4">
                  <p className="font-mono text-xs uppercase tracking-widest text-primary mb-2">
                    La regola dei secondi
                  </p>
                  <p className="text-sm md:text-base text-foreground/85 leading-relaxed">
                    Più spazio hai davanti, più tempo hai per decidere. Scegli un
                    punto fisso (un cartello, un'ombra sull'asfalto): devono
                    passare almeno{" "}
                    <span className="text-foreground font-medium">2-3 secondi</span>{" "}
                    tra il momento in cui il veicolo che ti precede lo supera e il
                    momento in cui lo superi tu. Con pioggia, scarsa visibilità o
                    fondo scivoloso,{" "}
                    <span className="text-primary font-semibold">
                      raddoppia il margine
                    </span>
                    .
                  </p>
                </div>
              </motion.div>
              <FlexMediaPlaceholder
                label="Schema visivo dei secondi di distanza tra due veicoli"
                className="h-[34vh] w-full"
              />
            </div>
          </div>
        </div>
      </Slide>

      {/* ============================================================
          BLOCCO 2 — COMANDI PROGRESSIVI
          ============================================================ */}
      <Slide bg="darker" blockId="comandi-progressivi" className="items-stretch">
        <div className="relative z-10 w-full h-full px-6 md:px-12 py-8 md:py-10">
          <div className="max-w-6xl mx-auto flex flex-col gap-4 justify-center min-h-full">
            <div className="text-center">
              <h2 className="text-2xl md:text-4xl font-bold leading-tight">
                Comandi progressivi,{" "}
                <span className="text-primary">non a scatti</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-[1fr_1.35fr] gap-6 items-center">
              <FlexMediaPlaceholder
                label="Schema comparativo: guida a scatti vs guida fluida"
                className="h-[34vh] w-full"
              />
              <motion.div {...fade} className="flex flex-col gap-3">
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  Guidare con fluidità significa usare acceleratore, freno e
                  volante con{" "}
                  <span className="text-foreground font-medium">
                    gradualità, non a scatti
                  </span>
                  . Non è solo comfort: una guida fluida sfrutta meglio l'aderenza
                  disponibile, riduce l'usura del veicolo, e soprattutto ti lascia
                  sempre un margine di reazione per l'imprevisto — perché non stai
                  già «usando» tutta l'attenzione e tutto il controllo del mezzo
                  in una manovra brusca.
                </p>
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  Ogni manovra andrebbe preparata con anticipo: frenare
                  all'ultimo istante, sterzare bruscamente o accelerare senza
                  motivo aumenta il rischio, per te e per chi ti circonda.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </Slide>

      {/* ============================================================
          BLOCCO 3 — SEQUENZA IN CURVA
          ============================================================ */}
      <Slide bg="darker" blockId="sequenza-curva" className="items-stretch">
        <div className="relative z-10 w-full h-full px-6 md:px-12 py-8 md:py-10">
          <div className="max-w-6xl mx-auto flex flex-col gap-4 justify-center min-h-full">
            <div className="text-center">
              <h2 className="text-2xl md:text-4xl font-bold leading-tight">
                Si frena prima, si sterza in curva,{" "}
                <span className="text-primary">si accelera dopo</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-[1.35fr_1fr] gap-6 items-center">
              <motion.div {...fade} className="flex flex-col gap-3">
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  La sequenza corretta per affrontare una curva: osserva in
                  anticipo il raggio e la visibilità,{" "}
                  <span className="text-foreground font-medium">
                    riduci la velocità prima di entrare — non durante
                  </span>
                  , mantieni una traiettoria pulita e stabile, e riprendi
                  l'acceleratore in modo progressivo solo dopo il punto più
                  stretto della curva.
                </p>
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  Frenare dentro la curva, quando lo pneumatico sta già usando
                  gran parte del suo budget di aderenza per sterzare, è una delle
                  situazioni che più facilmente porta a perdere il controllo
                  dell'anteriore.
                </p>
                <div className="rounded-lg border border-primary/60 bg-background/90 px-5 py-4">
                  <p className="font-mono text-xs uppercase tracking-widest text-primary mb-2">
                    Errore frequente
                  </p>
                  <p className="text-sm md:text-base text-foreground/85 leading-relaxed">
                    Entrare in curva più veloci di quanto si vorrebbe e correggere
                    frenando a metà. È esattamente la sequenza da evitare — meglio
                    rallentare un po' di più prima, con calma, che dover
                    correggere durante.
                  </p>
                </div>
              </motion.div>
              <FlexMediaPlaceholder
                label="Schema traiettoria di curva con le tre fasi segnate (predisposto per il futuro simulatore)"
                className="h-[38vh] w-full"
              />
            </div>
          </div>
        </div>
      </Slide>

      {/* ============================================================
          BLOCCO 4 — ADATTARE LA TECNICA
          ============================================================ */}
      <Slide bg="darker" blockId="margini-diversi" className="items-stretch">
        <div className="relative z-10 w-full h-full px-6 md:px-12 py-8 md:py-10">
          <div className="max-w-6xl mx-auto flex flex-col gap-4 justify-center min-h-full">
            <div className="text-center">
              <h2 className="text-2xl md:text-4xl font-bold leading-tight">
                La stessa tecnica,{" "}
                <span className="text-primary">margini diversi</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-[1fr_1.35fr] gap-6 items-center">
              <FlexMediaPlaceholder
                label="Specchietto retrovisore o condizioni meteo avverse"
                className="h-[34vh] w-full"
              />
              <motion.div {...fade} className="flex flex-col gap-3">
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  Ogni cambio di direzione o corsia segue sempre la stessa
                  sequenza:{" "}
                  <span className="text-foreground font-medium">
                    specchio, indicatore di direzione, controllo diretto
                    dell'angolo cieco, manovra
                  </span>
                  . Comunica sempre le tue intenzioni con anticipo, perché gli
                  altri possano adattarsi.
                </p>
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  La tecnica non è fissa: va adattata alle condizioni. Con
                  pioggia, nebbia, fondo scivoloso o scarsa illuminazione, tutto
                  quello visto in questo modulo — distanza, velocità, dolcezza
                  dei comandi — va applicato con{" "}
                  <span className="text-primary font-semibold">
                    un margine più ampio
                  </span>
                  , non con la stessa soglia delle condizioni ottimali.
                </p>
                <div className="rounded-lg border border-border/60 bg-card/70 px-5 py-4">
                  <p className="font-mono text-xs uppercase tracking-widest text-primary mb-2">
                    Verso il prossimo modulo
                  </p>
                  <p className="text-sm md:text-base text-foreground/85 leading-relaxed">
                    Nel prossimo modulo vediamo cosa cambia quando questo non è
                    più solo un modo di guidare, ma il tuo lavoro — ore al
                    volante, ripetizione, pressione operativa.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
        <ModuloNextNav to="/aula/modulo-7-guida-professionale" label="Modulo successivo" />
      </Slide>
    </div>
  );
};

export default AulaModulo6;
