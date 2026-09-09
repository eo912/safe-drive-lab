import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { useAulaSubscriber, useAulaHeartbeat } from "@/lib/aulaSync";
import { AulaMediaOverlay } from "@/components/aula/AulaMediaOverlay";
import { AulaEmbedLayer } from "@/components/aula/AulaEmbedLayer";
import { AulaPauseScreen } from "@/components/aula/AulaPauseScreen";
import { SyncDebugOverlay } from "@/components/dev/SyncDebugOverlay";
import { HotspotScene, type Hotspot } from "@/components/modulo3/HotspotScene";
import { ImagePlaceholder } from "@/components/modulo2/ImagePlaceholder";

const MODULO = "modulo-3-il-conducente";

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

/* ---------------- BLOCCO 1 — hotspot: posizione di guida ---------------- */

const HOTSPOT_POSIZIONE: Hotspot[] = [
  {
    id: "sedile",
    label: "Sedile",
    x: 30,
    y: 62,
    title: "Sedile",
    text: "Distanza dai pedali tale da poter premere il freno a fondo con il ginocchio leggermente flesso. Schienale che sostiene la schiena, non troppo reclinato.",
  },
  {
    id: "volante",
    label: "Volante",
    x: 62,
    y: 55,
    title: "Volante",
    text: "Braccia leggermente flesse quando le mani sono sul volante, non tese. Mani in posizione 9 e 3 (o 8 e 4) — garantisce il massimo controllo e la corretta apertura dell'airbag.",
  },
  {
    id: "poggiatesta",
    label: "Poggiatesta",
    x: 34,
    y: 30,
    title: "Poggiatesta",
    text: "Regolato all'altezza degli occhi/parte superiore della testa, non del collo. È un dispositivo di sicurezza attivo, non un cuscino.",
  },
  {
    id: "cintura",
    label: "Cintura",
    x: 44,
    y: 45,
    title: "Cintura",
    text: "Aderente, non attorcigliata. La fascia diagonale passa sulla clavicola, mai sul collo.",
  },
  {
    id: "specchi",
    label: "Specchi",
    x: 70,
    y: 22,
    title: "Specchi",
    text: "Si regolano prima di partire, mai durante la marcia. Gli specchietti esterni vanno aperti leggermente più «larghi» dell'istinto — riduce gli angoli ciechi laterali. Ma restano zone scoperte: prima di cambiare corsia serve sempre un'occhiata diretta, non solo lo specchio.",
  },
];

/* ---------------- BLOCCO 2 — hotspot: visione ---------------- */

const HOTSPOT_VISIONE: Hotspot[] = [
  {
    id: "centrale",
    label: "Punto lontano",
    x: 50,
    y: 38,
    title: "Visione centrale",
    text: "Visione centrale: dettagli, segnaletica, altri veicoli.",
  },
  {
    id: "periferica",
    label: "Ai lati",
    x: 14,
    y: 55,
    title: "Visione periferica",
    text: "Visione periferica: percepisce movimento ai lati — è quella che ti fa accorgere di un pedone prima ancora di «guardarlo» direttamente.",
  },
  {
    id: "specchietto",
    label: "Specchietto",
    x: 50,
    y: 14,
    title: "Scanning",
    text: "Scanning: lo sguardo si sposta regolarmente tra punto lontano, specchi e area vicina, invece di restare fisso in un solo punto.",
  },
];

const AulaModulo3 = () => {
  const navigate = useNavigate();
  const [showExit, setShowExit] = useState(false);
  const aulaState = useAulaSubscriber(MODULO, "posizione-guida");
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
  const embedBlocco = urlParams?.get("blocco") ?? "posizione-guida";
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
          BLOCCO 1 — PRIMA ANCORA DELLA TECNOLOGIA, CI SEI TU
          ============================================================ */}
      <Slide bg="black" blockId="posizione-guida" className="items-stretch flex-col">
        <div className="relative z-10 w-full px-6 md:px-12 pt-8">
          <div className="max-w-6xl mx-auto flex flex-col gap-4">
            <div className="text-center">
              <p className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-3">
                Modulo 03 · Il Conducente
              </p>
              <h1 className="text-2xl md:text-4xl font-bold leading-tight">
                Prima ancora della tecnologia,{" "}
                <span className="text-primary">ci sei tu</span>
              </h1>
              <p className="mt-3 text-sm md:text-base text-foreground/80 leading-snug max-w-4xl mx-auto">
                Un'auto moderna può avere i migliori sistemi di sicurezza
                disponibili, ma resta il conducente a decidere quando frenare,
                quanto sterzare, quanto spazio lasciare. Una posizione di guida
                scorretta, uno sguardo troppo vicino al cofano o pochi secondi di
                distrazione possono annullare qualsiasi vantaggio tecnologico.
              </p>
            </div>
          </div>
        </div>
        <HotspotScene
          illustrationLabel="Conducente visto di profilo / tre quarti seduto in abitacolo (illustrazione 3D-style — placeholder)"
          hotspots={HOTSPOT_POSIZIONE}
        />
      </Slide>

      {/* ============================================================
          BLOCCO 2 — LA VISIONE
          ============================================================ */}
      <Slide bg="darker" blockId="visione" className="items-stretch flex-col">
        <div className="relative z-10 w-full px-6 md:px-12 pt-8">
          <div className="max-w-6xl mx-auto flex flex-col gap-4">
            <div className="text-center">
              <h2 className="text-2xl md:text-4xl font-bold leading-tight">
                Il 90% di quello che sai sulla strada,{" "}
                <span className="text-primary">lo sai perché lo vedi</span>
              </h2>
              <p className="mt-3 text-sm md:text-base text-foreground/80 leading-snug max-w-4xl mx-auto">
                Guardare lontano non è un'abitudine stilistica: è ciò che ti dà
                tempo per decidere. Più lontano guardi, prima noti i pericoli — e
                prima li noti, più opzioni hai per gestirli con calma, invece che
                d'istinto.
              </p>
            </div>
          </div>
        </div>
        <HotspotScene
          illustrationLabel="Visuale frontale del conducente attraverso il parabrezza, prospettiva soggettiva, con specchietto retrovisore (placeholder)"
          hotspots={HOTSPOT_VISIONE}
        >
          {/* Tempo di reazione — stesso stile dello specchietto del Modulo 2 */}
          <div className="w-full max-w-3xl mx-auto rounded-lg border border-primary/60 bg-background/90 px-6 py-6">
            <p className="font-mono text-xs uppercase tracking-widest text-primary mb-3">
              Il tempo di reazione
            </p>
            <p className="text-base md:text-lg leading-relaxed text-foreground/85">
              Tra il momento in cui vedi un pericolo e il momento in cui inizi
              davvero a reagire passano in media{" "}
              <span className="text-primary font-semibold">0,7–1,5 secondi</span>.
              Stanchezza, distrazione ed età possono farlo raddoppiare. E questo
              tempo si traduce in spazio:{" "}
              <span className="text-primary font-semibold">
                a 50 km/h, un secondo di reazione sono circa 14 metri
              </span>{" "}
              percorsi prima ancora di iniziare a frenare.{" "}
              <span className="text-primary font-semibold">
                A 90 km/h, circa 25 metri.
              </span>
            </p>
          </div>
        </HotspotScene>
      </Slide>

      {/* ============================================================
          BLOCCO 3 — DISTRAZIONE, STANCHEZZA, STRESS (testuale)
          ============================================================ */}
      <Slide bg="darker" blockId="distrazione" className="items-stretch">
        <div className="relative z-10 w-full h-full overflow-y-auto px-6 md:px-12 py-8">
          <div className="max-w-6xl mx-auto flex flex-col gap-6 justify-center min-h-full">
            <div className="text-center">
              <h2 className="text-2xl md:text-4xl font-bold leading-tight">
                Non serve essere distratti a lungo.{" "}
                <span className="text-primary">Bastano pochi secondi.</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-[1fr_1.2fr] gap-6 items-start">
              <ImagePlaceholder
                label="Foto conducente (placeholder generico — verrà sostituita)"
                className="h-[26vh] w-full"
              />
              <div className="flex flex-col gap-4">
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  La distrazione non è solo «guardare altrove». Ne esistono tre
                  tipi, spesso combinati:{" "}
                  <span className="text-foreground font-medium">Visiva</span> —
                  gli occhi lasciano la strada.{" "}
                  <span className="text-foreground font-medium">Manuale</span> —
                  le mani lasciano il volante.{" "}
                  <span className="text-foreground font-medium">Cognitiva</span>{" "}
                  — la mente è altrove anche se occhi e mani restano al loro
                  posto. È la più insidiosa: non si vede dall'esterno, e spesso
                  non te ne accorgi nemmeno tu.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <motion.div
                {...fade}
                className="rounded-lg border border-border/60 bg-card/70 px-6 py-5"
              >
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary mb-2">
                  Stanchezza
                </p>
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  Riduce l'attenzione ben prima di diventare sonnolenza evidente.
                  Sbadigli ripetuti, fatica a mantenere la traiettoria, «buchi»
                  negli ultimi minuti di guida — sono già segnali tardivi. L'unico
                  rimedio è la pausa, non la forza di volontà.
                </p>
              </motion.div>
              <motion.div
                {...fade}
                className="rounded-lg border border-border/60 bg-card/70 px-6 py-5"
              >
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary mb-2">
                  Stress e fretta
                </p>
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  Sotto fretta, il campo di attenzione si restringe: ti concentri
                  sull'obiettivo («arrivare in tempo») e sottovaluti i segnali
                  attorno. Non è mancanza di esperienza — capita anche a chi guida
                  da anni. Va gestita, non ignorata.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </Slide>
    </div>
  );
};

export default AulaModulo3;
