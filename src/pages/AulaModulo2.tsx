import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Gauge,
  Ruler,
  Eye,
  Wrench,
  CloudRain,
  HeartPulse,
} from "lucide-react";

import { useAulaSubscriber, useAulaHeartbeat } from "@/lib/aulaSync";
import { AulaMediaOverlay } from "@/components/aula/AulaMediaOverlay";
import { AulaEmbedLayer } from "@/components/aula/AulaEmbedLayer";
import { AulaPauseScreen } from "@/components/aula/AulaPauseScreen";
import { SyncDebugOverlay } from "@/components/dev/SyncDebugOverlay";
import { CatenaIncidenteScene } from "@/components/modulo2/CatenaIncidenteScene";
import { ImagePlaceholder } from "@/components/modulo2/ImagePlaceholder";

const MODULO = "modulo-2-sicurezza-e-rischio";

const fade = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: { once: true, margin: "-15%" },
  transition: { duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] },
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

const DECISIONI = [
  { icon: Gauge, label: "La velocità che scegli" },
  { icon: Ruler, label: "La distanza che mantieni" },
  { icon: Eye, label: "Quanto osservi davvero la strada" },
  { icon: Wrench, label: "Le condizioni del tuo veicolo" },
  { icon: CloudRain, label: "Come ti adatti al meteo" },
  { icon: HeartPulse, label: "Il tuo stato psicofisico" },
];

const AulaModulo2 = () => {
  const navigate = useNavigate();
  const [showExit, setShowExit] = useState(false);
  const aulaState = useAulaSubscriber(MODULO, "sicurezza-rischio");
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
  const embedBlocco = urlParams?.get("blocco") ?? "sicurezza-rischio";
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
          BLOCCO 1 — SICUREZZA E RISCHIO
          ============================================================ */}
      <Slide bg="black" blockId="sicurezza-rischio">
        <div className="relative z-10 text-center px-6 max-w-4xl">
          <motion.p
            {...fade}
            className="font-mono text-sm tracking-[0.3em] uppercase text-primary mb-8"
          >
            Modulo 02
          </motion.p>
          <motion.h1
            {...fade}
            className="text-4xl md:text-6xl font-bold leading-[1.15]"
          >
            La sicurezza non è uno stato,
            <br />
            <span className="text-primary">è una somma di decisioni</span>
          </motion.h1>
        </div>
      </Slide>

      <Slide bg="darker" blockId="sicurezza-rischio" className="items-stretch">
        <div className="relative z-10 w-full h-full flex flex-col justify-center px-6 md:px-12 py-10 gap-8">
          <p className="text-xl md:text-2xl text-foreground/80 text-center max-w-4xl mx-auto leading-snug">
            Non esiste un interruttore «sicuro / pericoloso». La sicurezza è il
            risultato di sei decisioni che prendi ogni volta che guidi.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-5xl mx-auto w-full">
            {DECISIONI.map(({ icon: Icon, label }, i) => (
              <div
                key={label}
                className="rounded-lg border border-border/60 bg-card/70 px-4 py-5 text-center flex flex-col items-center gap-3"
              >
                <Icon className="w-6 h-6 text-primary" aria-hidden />
                <p className="text-sm md:text-base font-medium leading-snug">
                  <span className="font-mono text-xs text-muted-foreground mr-2">
                    0{i + 1}
                  </span>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Slide>

      <Slide blockId="sicurezza-rischio">
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <motion.p {...fade} className="text-2xl md:text-4xl font-semibold leading-snug">
            Nessuna di queste, da sola, ti salva.
            <br />
            Nessuna, da sola, ti condanna.
          </motion.p>
          <motion.p
            {...fade}
            className="mt-8 text-xl md:text-2xl text-primary font-medium leading-snug"
          >
            È la somma che fa la differenza — e la somma la controlli tu, prima di
            partire e mentre guidi.
          </motion.p>
        </div>
      </Slide>

      {/* Rischio reale vs percepito */}
      <Slide bg="darker" blockId="rischio-percepito" className="items-stretch">
        <div className="relative z-10 w-full h-full flex flex-col justify-center px-6 md:px-12 py-10 gap-6">
          <div className="text-center">
            <p className="font-mono text-sm tracking-[0.3em] uppercase text-primary">
              Rischio reale vs rischio percepito
            </p>
            <p className="mt-4 text-2xl md:text-3xl font-semibold leading-snug max-w-4xl mx-auto">
              Non reagisci al rischio che c'è davvero. Reagisci a quello che senti.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 max-w-5xl mx-auto w-full">
            <div className="flex flex-col gap-3">
              <ImagePlaceholder
                label="Strada ampia italiana/alpina con incrocio poco visibile in lontananza"
                className="h-[26vh]"
              />
              <p className="text-base md:text-lg text-foreground/80 leading-snug">
                Una strada dritta, larga, poco traffico: ti sembra facile e la
                velocità sale da sola — anche se dietro quella curva dolce c'è un
                incrocio che non vedi.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <ImagePlaceholder
                label="Strada di montagna tortuosa alpina con buona visibilità"
                className="h-[26vh]"
              />
              <p className="text-base md:text-lg text-foreground/80 leading-snug">
                Una strada stretta e tortuosa ti mette in allerta anche quando, in
                realtà, il rischio reale è identico.
              </p>
            </div>
          </div>
        </div>
      </Slide>

      <Slide blockId="rischio-percepito">
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <motion.p {...fade} className="text-2xl md:text-4xl font-semibold leading-snug">
            Il corso non ti insegna ad avere più paura.
          </motion.p>
          <motion.p
            {...fade}
            className="mt-6 text-xl md:text-2xl text-primary font-medium leading-snug"
          >
            Ti allena a leggere quello che c'è davvero, non solo quello che senti.
          </motion.p>
        </div>
      </Slide>

      {/* Callout: cosa NON è questo corso */}
      <Slide bg="black" blockId="cosa-non-e">
        <div className="relative z-10 px-6 max-w-4xl">
          <div className="rounded-lg border border-primary/50 bg-card/60 px-8 py-10">
            <p className="font-mono text-sm tracking-[0.3em] uppercase text-primary mb-6 text-center">
              Cosa NON è questo corso
            </p>
            <p className="text-2xl md:text-3xl font-semibold leading-snug text-center">
              Non stai imparando a guidare come un pilota. Un pilota cerca il limite
              dell'auto. Tu lo eviti.
            </p>
            <p className="mt-6 text-base md:text-lg text-foreground/70 leading-relaxed text-center">
              Anche con un'auto perfetta — frenata al top, gomme nuove, traiettoria
              pulita — resti su una strada vera, condivisa con persone che non guidano
              come te, che sbagliano, che sono distratte, che non ti hanno visto. Il
              rischio non è mai solo tuo e della tua auto: è di tutti quelli con cui
              condividi l'asfalto.
            </p>
          </div>
        </div>
      </Slide>

      {/* ============================================================
          BLOCCO 2 — LA CATENA DELL'INCIDENTE
          ============================================================ */}
      <Slide bg="darker" blockId="catena-incidente" className="items-stretch">
        <CatenaIncidenteScene level={renderLevel} />
      </Slide>

      {/* ============================================================
          BLOCCO 3 — IL FATTORE UMANO
          ============================================================ */}
      <Slide bg="black" blockId="fattore-umano">
        <div className="relative z-10 text-center px-6 max-w-4xl">
          <motion.h2 {...fade} className="text-4xl md:text-6xl font-bold leading-tight">
            La tecnologia alza il margine.
            <br />
            <span className="text-primary">Non decide al posto tuo.</span>
          </motion.h2>
        </div>
      </Slide>

      <Slide bg="darker" blockId="fattore-umano" className="items-stretch">
        <div className="relative z-10 w-full h-full flex items-center px-6 md:px-12 py-10">
          <div className="grid grid-cols-2 gap-8 max-w-5xl mx-auto w-full items-center">
            <ImagePlaceholder
              label="Mano sul volante in primo piano o cruscotto con spia ESP/ABS accesa, contesto europeo"
              className="h-[52vh]"
            />
            <div className="space-y-5">
              <p className="text-base md:text-lg text-foreground/80 leading-relaxed">
                Cintura, airbag, poggiatesta ti proteggono quando l'impatto è già
                successo. Sono lì da sempre e li conosci. Ma nella tua auto ci sono
                anche sistemi che intervengono prima, mentre stai ancora guidando:
                frenano una ruota per farti restare in traiettoria, limitano lo
                slittamento, ti aiutano a non perdere il controllo.
              </p>
              <p className="text-lg md:text-xl font-medium leading-snug">
                Sistemi potenti. Ma nessuno di questi decide quando frenare, quanta
                velocità tenere, quando è il momento di lasciar perdere e fermarsi.
              </p>
              <p className="text-lg md:text-xl text-primary font-medium leading-snug">
                Quella decisione resta sempre tua. Più ti affidi alla tecnologia per
                compensare le tue disattenzioni, meno margine reale ti resta quando
                serve davvero.
              </p>
            </div>
          </div>
        </div>
      </Slide>

      <Slide blockId="fattore-umano">
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <motion.p {...fade} className="text-xl md:text-2xl text-foreground/80 leading-snug">
            Nel prossimo modulo lasciamo l'auto da parte un momento. Parliamo di te:
            come ti siedi, come guardi, quanto tempo hai davvero per reagire.
          </motion.p>
          <motion.p
            {...fade}
            className="mt-8 text-2xl md:text-4xl font-bold text-primary leading-snug"
          >
            Prima di essere un sistema tecnologico, la tua auto ha già un primo
            sistema di sicurezza — e sei tu.
          </motion.p>
          <motion.p
            {...fade}
            className="mt-8 font-mono text-xs uppercase tracking-widest text-muted-foreground"
          >
            Prossimo modulo → Il Conducente
          </motion.p>
        </div>
      </Slide>
    </div>
  );
};

export default AulaModulo2;
