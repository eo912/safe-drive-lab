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
import { AulaWatermark } from "@/components/aula/AulaWatermark";

const MODULO = "modulo-7-guida-professionale";

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

const AulaModulo7 = () => {
  const navigate = useNavigate();
  const [showExit, setShowExit] = useState(false);
  const aulaState = useAulaSubscriber(MODULO, "ore-al-volante");
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
  const embedBlocco = urlParams?.get("blocco") ?? "ore-al-volante";
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
        <AulaWatermark />
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
          BLOCCO 1 — LE STESSE REGOLE, MOLTE PIÙ ORE
          ============================================================ */}
      <Slide bg="black" blockId="ore-al-volante" className="items-stretch">
        <div className="relative z-10 w-full h-full px-6 md:px-12 py-8 md:py-10">
          <div className="max-w-6xl mx-auto flex flex-col gap-5 justify-center min-h-full">
            <div className="text-center">
              <p className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-3">
                Modulo 07 · Guida Professionale
              </p>
              <h1 className="text-2xl md:text-4xl font-bold leading-tight">
                Le stesse regole, <span className="text-primary">molte più ore</span>
              </h1>
            </div>

            <div className="grid md:grid-cols-[1fr_1.35fr] gap-6 items-center">
              <ImagePlaceholder
                label="Conducente che consulta il percorso prima di partire, o vista dall'alto di un percorso/mappa (placeholder generico)"
                className="h-[30vh] w-full"
              />
              <motion.div {...fade} className="flex flex-col gap-3">
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  Chi guida per lavoro trascorre{" "}
                  <span className="text-foreground font-medium">
                    molte più ore al volante
                  </span>{" "}
                  di un conducente privato medio, spesso ripetendo gli stessi
                  percorsi o affrontando condizioni diverse ogni giorno. Conoscere
                  il Codice della Strada non basta: serve mantenere lo stesso
                  livello di attenzione anche alla centesima ripetizione dello
                  stesso tragitto — proprio quando la routine tende naturalmente
                  ad abbassare la vigilanza.
                </p>
                <div className="rounded-lg border border-border/60 bg-card/70 px-5 py-4">
                  <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary mb-2">
                    Pianificazione
                  </p>
                  <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                    La guida professionale comincia prima di mettere in moto:
                    conoscere in anticipo eventuali criticità (traffico, lavori,
                    meteo), valutare i tempi in modo{" "}
                    <span className="text-primary font-semibold">
                      realistico, non ottimistico
                    </span>
                    . Chi parte con margini di tempo troppo stretti si porta dietro
                    la fretta per l'intero servizio — e la fretta riduce la qualità
                    delle decisioni.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </Slide>

      {/* ============================================================
          BLOCCO 2 — LA PAUSA NON È UNA DEBOLEZZA
          ============================================================ */}
      <Slide bg="darker" blockId="pausa-prevedibilita" className="items-stretch">
        <div className="relative z-10 w-full h-full px-6 md:px-12 py-8 md:py-10">
          <div className="max-w-6xl mx-auto flex flex-col gap-5 justify-center min-h-full">
            <div className="text-center">
              <h2 className="text-2xl md:text-4xl font-bold leading-tight">
                La pausa non è una debolezza,{" "}
                <span className="text-primary">è parte del lavoro</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-[1.35fr_1fr] gap-6 items-center">
              <motion.div {...fade} className="flex flex-col gap-3">
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  Ore prolungate al volante aumentano il rischio di{" "}
                  <span className="text-foreground font-medium">
                    calo di attenzione
                  </span>
                  , anche in conducenti esperti e motivati. Riconoscere i primi
                  segnali e intervenire per tempo è responsabilità professionale —
                  non un segno di cedimento.
                </p>
                <div className="rounded-lg border border-border/60 bg-card/70 px-5 py-4">
                  <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary mb-2">
                    Comportamento prevedibile
                  </p>
                  <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                    Un conducente professionale è, prima di tutto,{" "}
                    <span className="text-primary font-semibold">
                      prevedibile per chi condivide la strada con lui
                    </span>
                    : velocità costanti dove possibile, intenzioni segnalate con
                    anticipo, nessuna manovra improvvisa. La prevedibilità è essa
                    stessa una misura di sicurezza — riduce le sorprese per gli
                    altri.
                  </p>
                </div>
              </motion.div>
              <ImagePlaceholder
                label="Area di sosta/autogrill, o traffico stradale con più veicoli (placeholder generico)"
                className="h-[30vh] w-full"
              />
            </div>
          </div>
        </div>
      </Slide>

      {/* ============================================================
          BLOCCO 3 — NON È LA TUA UTILITARIA DI FAMIGLIA
          ============================================================ */}
      <Slide bg="darker" blockId="veicolo-allestito" className="items-stretch">
        <div className="relative z-10 w-full h-full px-6 md:px-12 py-8 md:py-10">
          <div className="max-w-6xl mx-auto flex flex-col gap-5 justify-center min-h-full">
            <div className="text-center">
              <h2 className="text-2xl md:text-4xl font-bold leading-tight">
                Non è la tua{" "}
                <span className="text-primary">utilitaria di famiglia</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-[1fr_1.35fr] gap-6 items-center">
              <ImagePlaceholder
                label="Veicolo commerciale/allestito, o cruscotto con indicatore di carico (placeholder generico)"
                className="h-[30vh] w-full"
              />
              <motion.div {...fade} className="flex flex-col gap-3">
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  Molti veicoli professionali sono allestiti con attrezzature,
                  strutture o carichi che modificano{" "}
                  <span className="text-foreground font-medium">
                    peso, baricentro e ingombri
                  </span>{" "}
                  rispetto a un veicolo di serie. Chi lo guida deve sapere come
                  questi elementi cambiano il comportamento dinamico del mezzo, e
                  adattare di conseguenza velocità in curva, distanze di frenata
                  attese e margini di sicurezza.
                </p>
                <div className="rounded-lg border border-border/60 bg-card/70 px-5 py-4">
                  <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary mb-2">
                    Pressione e fretta operativa
                  </p>
                  <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                    Nel lavoro capitano richieste urgenti, ritardi da recuperare,
                    tempi stretti. Un professionista non dimostra la propria
                    capacità andando più veloce degli altri o tagliando i margini:{" "}
                    <span className="text-primary font-semibold">
                      la dimostra arrivando a destinazione senza incidenti
                    </span>
                    , senza mettere in difficoltà nessuno — anche sotto pressione.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </Slide>

      {/* ============================================================
          BLOCCO 4 — NON GUIDI SOLO PER TE
          ============================================================ */}
      <Slide bg="darker" blockId="riepilogo-professionale" className="items-stretch">
        <div className="relative z-10 w-full h-full px-6 md:px-12 py-8 md:py-10">
          <div className="max-w-6xl mx-auto flex flex-col gap-5 justify-center min-h-full">
            <div className="text-center">
              <h2 className="text-2xl md:text-4xl font-bold leading-tight">
                Non guidi <span className="text-primary">solo per te</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-[1fr_1.35fr] gap-6 items-center">
              <ImagePlaceholder
                label="Veicolo aziendale con logo/livrea generica (placeholder generico)"
                className="h-[32vh] w-full"
              />
              <motion.div {...fade} className="flex flex-col gap-3">
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  Chi guida un veicolo aziendale rappresenta, agli occhi degli
                  altri utenti della strada,{" "}
                  <span className="text-foreground font-medium">
                    l'organizzazione per cui lavora
                  </span>
                  . Uno stile di guida sicuro e composto è anche immagine, oltre
                  che sicurezza personale.
                </p>
                <div className="rounded-lg border border-primary/60 bg-background/90 px-5 py-4">
                  <p className="font-mono text-xs uppercase tracking-widest text-primary mb-2">
                    In sintesi
                  </p>
                  <ul className="text-sm md:text-base text-foreground/85 leading-relaxed list-disc pl-5 space-y-1">
                    <li>Pianifica il percorso prima di partire</li>
                    <li>Guida con regolarità, evita manovre brusche</li>
                    <li>Riconosci e gestisci per tempo stanchezza e cali di attenzione</li>
                    <li>Comunica sempre con anticipo le tue intenzioni</li>
                    <li>Conosci come carico e allestimento modificano il comportamento del veicolo</li>
                    <li>Mantieni un comportamento prevedibile anche sotto pressione</li>
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
        <ModuloNextNav to="/aula/modulo-8-applicazione-est" label="Modulo successivo" />
      </Slide>
    </div>
  );
};

export default AulaModulo7;
