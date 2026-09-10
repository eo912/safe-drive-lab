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
import { HotspotScene, type Hotspot } from "@/components/modulo3/HotspotScene";
import { ImagePlaceholder } from "@/components/modulo2/ImagePlaceholder";
import { ModuloNextNav } from "@/components/aula/ModuloNextNav";

const MODULO = "modulo-4-il-veicolo";

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

/* ---------------- BLOCCO 1 — hotspot: pneumatici ---------------- */

const HOTSPOT_PNEUMATICI: Hotspot[] = [
  {
    id: "pressione",
    label: "Pressione",
    x: 22,
    y: 40,
    title: "Pressione",
    text: "Troppo bassa aumenta la flessione del fianco e riduce la precisione; troppo alta riduce l'area di contatto. Va controllata a freddo.",
  },
  {
    id: "battistrada",
    label: "Battistrada",
    x: 50,
    y: 18,
    title: "Battistrada",
    text: "Sotto la soglia minima (1,6 mm in Italia, meglio sostituire prima) la capacità di drenare l'acqua crolla.",
  },
  {
    id: "aquaplaning",
    label: "Aquaplaning",
    x: 50,
    y: 78,
    title: "Aquaplaning",
    text: "Quando un velo d'acqua non viene più sgomberato dal battistrada e lo pneumatico «galleggia», perdendo aderenza.",
  },
  {
    id: "estive",
    label: "Gomme estive",
    x: 76,
    y: 32,
    title: "Gomme estive",
    text: "Mescola più rigida, pensata per temperature sopra i 7°C: aderenza ottimale su asfalto asciutto e bagnato in stagione calda.",
  },
  {
    id: "invernali",
    label: "Gomme invernali",
    x: 76,
    y: 62,
    title: "Gomme invernali",
    text: "Mescola più morbida anche a basse temperature, battistrada disegnato per neve/ghiaccio: mantengono aderenza dove le estive induriscono e perdono grip.",
  },
];

const CHECKLIST = [
  "Pressione e stato visivo pneumatici",
  "Spie accese sul quadro strumenti",
  "Livello liquidi (olio, raffreddamento, lavavetri)",
  "Funzionamento di tutte le luci",
  "Carico ben sistemato e fissato",
  "Specchi e sedile regolati",
];

const AulaModulo4 = () => {
  const navigate = useNavigate();
  const [showExit, setShowExit] = useState(false);
  const aulaState = useAulaSubscriber(MODULO, "pneumatici");
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
  const embedBlocco = urlParams?.get("blocco") ?? "pneumatici";
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
          BLOCCO 1 — PNEUMATICI (hotspot)
          ============================================================ */}
      <Slide bg="black" blockId="pneumatici" className="items-stretch flex-col">
        <div className="relative z-10 w-full px-6 md:px-12 pt-8">
          <div className="max-w-6xl mx-auto text-center">
            <p className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-3">
              Modulo 04 · Il Veicolo
            </p>
            <h1 className="text-2xl md:text-4xl font-bold leading-tight">
              Tutto passa da{" "}
              <span className="text-primary">un palmo di mano per ruota</span>
            </h1>
            <p className="mt-3 text-sm md:text-base text-foreground/80 leading-snug max-w-4xl mx-auto">
              Ogni forza che il veicolo scambia con la strada — accelerare,
              frenare, sterzare — passa attraverso un'area di contatto grande più
              o meno come un palmo di mano, per ruota. È l'unico punto in cui il
              veicolo «tocca» davvero l'asfalto.
            </p>
          </div>
        </div>
        <HotspotScene
          illustrationLabel="Pneumatico visto lateralmente e dall'alto, con area di contatto evidenziata (placeholder generico)"
          hotspots={HOTSPOT_PNEUMATICI}
          compact
        />
      </Slide>

      {/* ============================================================
          BLOCCO 2 — FRENI
          ============================================================ */}
      <Slide bg="darker" blockId="freni" className="items-stretch">
        <div className="relative z-10 w-full h-full px-6 md:px-12 py-8 md:py-10">
          <div className="max-w-6xl mx-auto flex flex-col gap-5 justify-center min-h-full">
            <div className="text-center">
              <h2 className="text-2xl md:text-4xl font-bold leading-tight">
                Fermare una tonnellata{" "}
                <span className="text-primary">in pochi metri</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-[1fr_1.35fr] gap-6 items-center">
              <ImagePlaceholder
                label="Disco freno e pinza in primo piano (placeholder generico)"
                className="h-[30vh] w-full"
              />
              <motion.div {...fade} className="flex flex-col gap-3">
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  Un'auto di medie dimensioni pesa più di una tonnellata. A 90
                  km/h, fermarla in sicurezza significa fare un lavoro enorme in
                  pochi secondi — e a farlo sono{" "}
                  <span className="text-foreground font-medium">
                    quattro pastiglie, non più grandi di un mazzo di carte
                  </span>{" "}
                  ciascuna. Tutta quella forza diventa calore, in un attimo.
                </p>
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  È per questo che i freni si «stancano»: in una discesa lunga,
                  frenare in continuazione li fa surriscaldare — le pastiglie
                  perdono grip proprio come una gomma che pattina troppo a lungo
                  sull'asfalto. Il pedale sembra ancora premuto a fondo, ma la
                  frenata risponde sempre meno. Si chiama{" "}
                  <span className="text-primary font-semibold">fading</span>, e si
                  previene lasciando lavorare il motore al posto dei freni nei
                  tratti lunghi in discesa, invece di tenerli sempre schiacciati.
                </p>
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  Pastiglie e dischi vanno tenuti efficienti, non solo «presenti»:
                  pastiglie consumate allungano lo spazio di frenata anche se il
                  pedale sembra rispondere normalmente.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </Slide>

      {/* ============================================================
          BLOCCO 3 — STERZO E SOSPENSIONI
          ============================================================ */}
      <Slide bg="darker" blockId="sterzo-sospensioni" className="items-stretch">
        <div className="relative z-10 w-full h-full px-6 md:px-12 py-8 md:py-10">
          <div className="max-w-6xl mx-auto flex flex-col gap-5 justify-center min-h-full">
            <div className="text-center">
              <h2 className="text-2xl md:text-4xl font-bold leading-tight">
                Quello che non vedi,{" "}
                <span className="text-primary">finché non serve</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-[1.35fr_1fr] gap-6 items-center">
              <motion.div {...fade} className="flex flex-col gap-3">
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  Lo sterzo porta la tua decisione alle ruote. Le sospensioni
                  fanno un lavoro meno visibile ma altrettanto critico: tengono la
                  ruota incollata all'asfalto anche sulle imperfezioni.
                </p>
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  Un ammortizzatore usurato non si sente su una strada tranquilla
                  — sembra tutto normale. Ma nel momento in cui serve davvero (una
                  frenata forte, una curva stretta, uno sterzo d'emergenza),
                  quella ruota{" "}
                  <span className="text-primary font-semibold">«salta»</span>{" "}
                  invece di restare a contatto, e il veicolo perde parte del
                  controllo proprio quando ne hai più bisogno.
                </p>
              </motion.div>
              <ImagePlaceholder
                label="Schema semplice di una sospensione, o auto su fondo sconnesso (placeholder generico)"
                className="h-[30vh] w-full"
              />
            </div>
          </div>
        </div>
      </Slide>

      {/* ============================================================
          BLOCCO 4 — SISTEMI ELETTRONICI
          ============================================================ */}
      <Slide bg="darker" blockId="sistemi-elettronici" className="items-stretch">
        <div className="relative z-10 w-full h-full px-6 md:px-12 py-8 md:py-10">
          <div className="max-w-6xl mx-auto flex flex-col gap-5 justify-center min-h-full">
            <div className="text-center">
              <h2 className="text-2xl md:text-4xl font-bold leading-tight">
                Gestiscono l'aderenza che c'è.{" "}
                <span className="text-primary">Non la creano dal nulla</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  sigla: "ABS",
                  text: "Impedisce alle ruote di bloccarsi in frenata intensa, mantenendo la capacità di sterzare mentre freni forte.",
                },
                {
                  sigla: "ESP",
                  text: "Frena selettivamente una o più ruote quando la traiettoria non corrisponde a quella voluta, contrastando sottosterzo o sovrasterzo. Non crea aderenza dove non c'è.",
                },
                {
                  sigla: "ASR",
                  text: "Limita lo slittamento delle ruote motrici in accelerazione su fondo scivoloso.",
                },
              ].map((s) => (
                <motion.div
                  key={s.sigla}
                  {...fade}
                  className="rounded-lg border border-border/60 bg-card/70 px-5 py-4"
                >
                  <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary mb-2">
                    {s.sigla}
                  </p>
                  <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                    {s.text}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="grid md:grid-cols-[1fr_1.35fr] gap-6 items-center">
              <ImagePlaceholder
                label="Cruscotto con spia ESP/ABS, o schema ruota che perde e mantiene aderenza (placeholder generico)"
                className="h-[22vh] w-full"
              />
              <div className="rounded-lg border border-primary/60 bg-background/90 px-5 py-4">
                <p className="font-mono text-xs uppercase tracking-widest text-primary mb-2">
                  L'errore comune
                </p>
                <p className="text-sm md:text-base text-foreground/85 leading-relaxed">
                  Pensare che questi sistemi permettano di guidare più vicino al
                  limite in sicurezza. In realtà spostano il limite un po' più in
                  là — il margine reale per l'imprevisto resta lo stesso, o si
                  riduce se compensi aumentando la velocità.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Slide>

      {/* ============================================================
          BLOCCO 5 — PRIMA DI PARTIRE
          ============================================================ */}
      <Slide bg="darker" blockId="prima-di-partire" className="items-stretch">
        <div className="relative z-10 w-full h-full px-6 md:px-12 py-8 md:py-10">
          <div className="max-w-6xl mx-auto flex flex-col gap-5 justify-center min-h-full">
            <div className="text-center">
              <h2 className="text-2xl md:text-4xl font-bold leading-tight">
                Un problema trovato prima{" "}
                <span className="text-primary">è un problema risolto</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-[1fr_1.15fr] gap-6 items-center">
              <div className="flex flex-col gap-4">
                <ImagePlaceholder
                  label="Conducente che fa il giro esterno dell'auto (placeholder generico)"
                  className="h-[24vh] w-full"
                />
                <motion.p
                  {...fade}
                  className="text-sm md:text-base text-foreground/80 leading-relaxed"
                >
                  Le luci non servono solo a vedere: servono soprattutto a{" "}
                  <span className="text-foreground font-medium">essere visti</span>
                  . Un carico mal distribuito o non fissato sposta il baricentro,
                  riduce la stabilità e — in caso di frenata brusca — diventa esso
                  stesso un pericolo in movimento nell'abitacolo.
                </motion.p>
              </div>

              <div className="rounded-lg border border-primary/60 bg-background/90 px-6 py-5">
                <p className="font-mono text-xs uppercase tracking-widest text-primary mb-3">
                  Checklist pre-partenza
                </p>
                <ul className="flex flex-col gap-2">
                  {CHECKLIST.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm md:text-base text-foreground/85 leading-relaxed"
                    >
                      <span
                        aria-hidden
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <ModuloNextNav to="/aula/modulo-5-dinamica-del-veicolo" label="Modulo successivo" />
      </Slide>
    </div>
  );
};

export default AulaModulo4;
