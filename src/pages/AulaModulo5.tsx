import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { useAulaSubscriber, useAulaHeartbeat } from "@/lib/aulaSync";
import { useVisibleBlock } from "@/lib/aulaVisibleBlock";
import { prevModuleAulaUrl, useEnterAtLastSection } from "@/lib/aulaModuleNav";
import { AulaMediaOverlay } from "@/components/aula/AulaMediaOverlay";
import { AulaEmbedLayer } from "@/components/aula/AulaEmbedLayer";
import { AulaPauseScreen } from "@/components/aula/AulaPauseScreen";
import { SyncDebugOverlay } from "@/components/dev/SyncDebugOverlay";
import { ImagePlaceholder } from "@/components/modulo2/ImagePlaceholder";
import { ModuloNextNav } from "@/components/aula/ModuloNextNav";

const MODULO = "modulo-5-dinamica-del-veicolo";

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

const AulaModulo5 = () => {
  const navigate = useNavigate();
  const [showExit, setShowExit] = useState(false);
  const aulaState = useAulaSubscriber(MODULO, "peso-trasferimenti");
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
  const embedBlocco = urlParams?.get("blocco") ?? "peso-trasferimenti";
  const embedPaused = urlParams?.get("pausa") === "1";
  const embedAtm =
    (urlParams?.get("atm") as import("@/lib/pauseAtmosphere").PauseAtmosphere | null) ??
    null;

  const isPaused = embedMode ? embedPaused : aulaState.paused || forcePauseFromUrl;

  // Posizione REALE visibile in Aula (anche dopo scroll manuale locale).
  const visibleBlock = useVisibleBlock(scrollerRef, aulaState.blocco, !embedMode);

  useAulaHeartbeat(!embedMode, {
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
          BLOCCO 1 — IL PESO NON STA MAI FERMO
          ============================================================ */}
      <Slide bg="black" blockId="peso-trasferimenti" className="items-stretch">
        <div className="relative z-10 w-full h-full px-6 md:px-12 py-8 md:py-10">
          <div className="max-w-6xl mx-auto flex flex-col gap-5 justify-center min-h-full">
            <div className="text-center">
              <p className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-3">
                Modulo 05 · Dinamica del Veicolo
              </p>
              <h1 className="text-2xl md:text-4xl font-bold leading-tight">
                Il peso <span className="text-primary">non sta mai fermo</span>
              </h1>
            </div>

            <div className="grid md:grid-cols-[1fr_1.35fr] gap-6 items-center">
              <ImagePlaceholder
                label="Schema auto vista laterale/dall'alto con frecce che mostrano lo spostamento del peso (placeholder generico)"
                className="h-[30vh] w-full"
              />
              <motion.div {...fade} className="flex flex-col gap-3">
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  Ogni volta che acceleri, freni o affronti una curva, il peso del
                  veicolo non resta distribuito uniformemente sulle quattro ruote:{" "}
                  <span className="text-foreground font-medium">si sposta</span>.
                  In frenata va in avanti (per questo i freni anteriori lavorano
                  sempre di più). In accelerazione va indietro. In curva va verso
                  l'esterno, scaricando le ruote interne.
                </p>
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  Non è un difetto — è fisica normale. Ma cambia, istante per
                  istante,{" "}
                  <span className="text-primary font-semibold">
                    quanta aderenza ha davvero a disposizione ciascuna ruota
                  </span>
                  .
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </Slide>

      {/* ============================================================
          BLOCCO 2 — BUDGET DI ADERENZA
          ============================================================ */}
      <Slide bg="darker" blockId="budget-aderenza" className="items-stretch">
        <div className="relative z-10 w-full h-full px-6 md:px-12 py-8 md:py-10">
          <div className="max-w-6xl mx-auto flex flex-col gap-5 justify-center min-h-full">
            <div className="text-center">
              <h2 className="text-2xl md:text-4xl font-bold leading-tight">
                Ogni ruota ha un budget.{" "}
                <span className="text-primary">Non puoi spenderlo due volte</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-[1.35fr_1fr] gap-6 items-center">
              <motion.div {...fade} className="flex flex-col gap-3">
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  Immagina che ogni pneumatico abbia{" "}
                  <span className="text-foreground font-medium">
                    100 di aderenza disponibile
                  </span>
                  . Se ne usi 80 per frenare, te ne restano solo 20 per sterzare.
                  Se in quel momento chiedi anche una sterzata decisa, il budget
                  non basta — il veicolo perde precisione o aderenza.
                </p>
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  Per questo frenata, sterzata e accelerazione vanno il più
                  possibile{" "}
                  <span className="text-primary font-semibold">
                    separate nel tempo
                  </span>
                  : prima freni, poi sterzi. Oppure sterzi, poi acceleri. Frenare
                  forte e sterzare forte insieme è la combinazione che più
                  facilmente porta oltre il limite.
                </p>
              </motion.div>
              <ImagePlaceholder
                label="Schema visivo del «budget»: barra che si riempie tra frenata e sterzata, o pneumatico con frecce di forze in direzioni diverse (placeholder generico)"
                className="h-[30vh] w-full"
              />
            </div>
          </div>
        </div>
      </Slide>

      {/* ============================================================
          BLOCCO 3 — SOTTOSTERZO E SOVRASTERZO
          ============================================================ */}
      <Slide bg="darker" blockId="sottosterzo-sovrasterzo" className="items-stretch">
        <div className="relative z-10 w-full h-full px-6 md:px-12 py-8 md:py-10">
          <div className="max-w-6xl mx-auto flex flex-col gap-5 justify-center min-h-full">
            <div className="text-center">
              <h2 className="text-2xl md:text-4xl font-bold leading-tight">
                Quando l'auto{" "}
                <span className="text-primary">non fa quello che chiedi</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <motion.div
                {...fade}
                className="rounded-lg border border-border/60 bg-card/70 px-5 py-4"
              >
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary mb-2">
                  Sottosterzo
                </p>
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  Le ruote anteriori perdono aderenza per prime — l'auto «allarga»
                  la curva, non gira quanto chiesto dal volante. È il più comune e
                  il più gestibile: si corregge riducendo leggermente l'input
                  (rilasciare l'acceleratore, non sterzare di più) e lasciando che
                  l'avantreno recuperi grip.
                </p>
              </motion.div>
              <motion.div
                {...fade}
                className="rounded-lg border border-border/60 bg-card/70 px-5 py-4"
              >
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary mb-2">
                  Sovrasterzo
                </p>
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  Le ruote posteriori perdono aderenza per prime — il retrotreno
                  «gira» più dell'avantreno, rischio testacoda. Si corregge
                  contro-sterzando con dolcezza nella direzione in cui il
                  retrotreno sta scivolando.
                </p>
              </motion.div>
            </div>

            <div className="grid md:grid-cols-[1fr_1.35fr] gap-6 items-center">
              <ImagePlaceholder
                label="Schema auto in curva con traiettoria allargata (sottosterzo) vs stretta/rotante (sovrasterzo) (placeholder generico)"
                className="h-[22vh] w-full"
              />
              <div className="rounded-lg border border-primary/60 bg-background/90 px-5 py-4">
                <p className="font-mono text-xs uppercase tracking-widest text-primary mb-2">
                  L'obiettivo
                </p>
                <p className="text-sm md:text-base text-foreground/85 leading-relaxed">
                  Non allenarsi a correggerli come tecnica sportiva, ma{" "}
                  <span className="text-foreground font-medium">
                    riconoscerli per tempo
                  </span>{" "}
                  — con velocità adeguata e ingresso in curva corretto, quasi mai
                  si presentano.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Slide>

      {/* ============================================================
          BLOCCO 4 — SPAZIO DI ARRESTO E FRENATA
          ============================================================ */}
      <Slide bg="darker" blockId="spazio-arresto" className="items-stretch">
        <div className="relative z-10 w-full h-full px-6 md:px-12 py-8 md:py-10">
          <div className="max-w-6xl mx-auto flex flex-col gap-5 justify-center min-h-full">
            <div className="text-center">
              <h2 className="text-2xl md:text-4xl font-bold leading-tight">
                Pochi km/h in più,{" "}
                <span className="text-primary">molto più spazio per fermarti</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-[1.35fr_1fr] gap-6 items-center">
              <motion.div {...fade} className="flex flex-col gap-3">
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  Lo spazio di arresto è la somma di due parti: lo spazio percorso
                  nel tempo di reazione più lo spazio di frenata vero e proprio.
                  Il secondo cresce con{" "}
                  <span className="text-foreground font-medium">
                    il quadrato della velocità
                  </span>
                  : raddoppiare la velocità non raddoppia lo spazio di frenata, lo
                  moltiplica per circa quattro. Ecco perché pochi km/h in più,
                  specialmente a velocità già sostenute, fanno una differenza
                  sproporzionata.
                </p>
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  Nella guida quotidiana la frenata dovrebbe essere{" "}
                  <span className="text-primary font-semibold">progressiva</span>{" "}
                  — pressione crescente, non un colpo secco. La frenata di
                  emergenza è diversa: pressione decisa e immediata a fondo,
                  mantenuta fino all'arresto. Con l'ABS che funziona, è corretto
                  tenere il pedale premuto senza «pompare» — è l'ABS a gestire il
                  bloccaggio, tu continui a sterzare se serve per evitare
                  l'ostacolo.
                </p>
              </motion.div>
              <ImagePlaceholder
                label="Grafico/schema semplice della crescita non lineare dello spazio di frenata con la velocità (placeholder generico)"
                className="h-[30vh] w-full"
              />
            </div>
          </div>
        </div>
      </Slide>

      {/* ============================================================
          BLOCCO 5 — ADERENZA E CONDIZIONI DELLA STRADA
          ============================================================ */}
      <Slide bg="darker" blockId="aderenza-condizioni" className="items-stretch">
        <div className="relative z-10 w-full h-full px-6 md:px-12 py-8 md:py-10">
          <div className="max-w-6xl mx-auto flex flex-col gap-5 justify-center min-h-full">
            <div className="text-center">
              <h2 className="text-2xl md:text-4xl font-bold leading-tight">
                La strada{" "}
                <span className="text-primary">non è sempre la stessa strada</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-[1fr_1.35fr] gap-6 items-center">
              <ImagePlaceholder
                label="Strada con transizione visibile (asciutto/bagnato o imbocco tunnel), o auto su fondo innevato (placeholder generico)"
                className="h-[32vh] w-full"
              />
              <motion.div {...fade} className="flex flex-col gap-3">
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  L'aderenza disponibile non è mai costante.{" "}
                  <span className="text-foreground font-medium">Bagnato</span>:
                  l'acqua riduce l'attrito, soprattutto nei primi minuti di
                  pioggia. <span className="text-foreground font-medium">Freddo</span>:
                  anche su asciutto, le basse temperature riducono l'elasticità
                  della gomma.{" "}
                  <span className="text-foreground font-medium">Neve e ghiaccio</span>:
                  l'aderenza può ridursi anche di un ordine di grandezza — ogni
                  manovra va fatta con più dolcezza e margini più ampi.
                </p>
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  I punti più insidiosi sono spesso le{" "}
                  <span className="text-primary font-semibold">
                    transizioni improvvise
                  </span>{" "}
                  — un tunnel, l'ombra di un ponte, una chiazza d'olio — perché
                  l'aderenza cambia più in fretta di quanto riesci a vederla. Un
                  veicolo più pesante o con baricentro più alto ha bisogno di più
                  spazio per fermarsi e trasferisce più peso in curva e frenata —
                  aggravando tutto quello visto in questo modulo.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
        <ModuloNextNav to="/aula/modulo-6-tecniche-di-guida" label="Modulo successivo" />
      </Slide>
    </div>
  );
};

export default AulaModulo5;
