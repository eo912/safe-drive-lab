import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { useAulaSubscriber, useAulaHeartbeat } from "@/lib/aulaSync";
import { useVisibleBlock } from "@/lib/aulaVisibleBlock";
import { AulaMediaOverlay } from "@/components/aula/AulaMediaOverlay";
import { AulaEmbedLayer } from "@/components/aula/AulaEmbedLayer";
import { AulaPauseScreen } from "@/components/aula/AulaPauseScreen";
import { SyncDebugOverlay } from "@/components/dev/SyncDebugOverlay";
import { ImagePlaceholder } from "@/components/modulo2/ImagePlaceholder";
import { ModuloNextNav } from "@/components/aula/ModuloNextNav";

const MODULO = "modulo-8-applicazione-est";

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
          ? "hsl(220 22% 4%)"
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

const AulaModulo8 = () => {
  const navigate = useNavigate();
  const [showExit, setShowExit] = useState(false);
  const aulaState = useAulaSubscriber(MODULO, "consegna-vst");
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
  const embedBlocco = urlParams?.get("blocco") ?? "consegna-vst";
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
      }
      return;
    }
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
          BLOCCO 1 — PRENDI IN CONSEGNA IL VST
          ============================================================ */}
      <Slide bg="black" blockId="consegna-vst" className="items-stretch">
        <div className="relative z-10 w-full h-full px-6 md:px-12 py-8 md:py-10">
          <div className="max-w-6xl mx-auto flex flex-col gap-4 justify-center min-h-full">
            <div className="text-center">
              <p className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-2">
                Modulo 08 · Applicazione EST
              </p>
              <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                Prendi in consegna il VST,{" "}
                <span className="text-primary">non solo le chiavi</span>
              </h1>
            </div>

            <div className="grid md:grid-cols-[1fr_1.35fr] gap-5 items-start">
              <ImagePlaceholder
                label="Foto/video: VST (veicolo di servizio), checklist pre-turno (placeholder generico)"
                className="h-[34vh] w-full"
              />
              <motion.div {...fade} className="flex flex-col gap-3">
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Ad inizio turno prendi in carico il{" "}
                  <span className="text-foreground font-medium">
                    VST (veicolo di servizio)
                  </span>
                  , che resta tuo per l'intero turno. Operi normalmente da solo,
                  coordinato via radio dal PCC. Il controllo pre-partenza ha qui un
                  peso operativo diretto: un problema trovato adesso è un problema
                  risolto in sicurezza. Lo stesso problema scoperto durante un
                  intervento è un rischio aggiuntivo, in un momento in cui la tua
                  attenzione è già impegnata su altro.
                </p>
                <div className="rounded-lg border border-border/60 bg-card/70 px-5 py-3">
                  <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary mb-2">
                    Checklist pre-turno
                  </p>
                  <ul className="text-xs md:text-sm text-foreground/85 leading-snug list-disc pl-5 grid sm:grid-cols-2 gap-x-4 gap-y-1">
                    <li>Pneumatici: pressione e stato visivo</li>
                    <li>Spie sul quadro strumenti</li>
                    <li>Livello liquidi</li>
                    <li>Funzionamento luci</li>
                    <li>Carico ben fissato</li>
                    <li>Specchi e sedile regolati</li>
                    <li className="sm:col-span-2">
                      Verifica generale del sistema CAF come parte della dotazione
                      del mezzo — l'uso operativo del CAF appartiene alla
                      formazione specifica, non a questo corso
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </Slide>

      {/* ============================================================
          BLOCCO 2 — STESSO PRINCIPIO, CONSEGUENZE PIÙ GRANDI
          ============================================================ */}
      <Slide bg="darker" blockId="catena-traforo" className="items-stretch">
        <div className="relative z-10 w-full h-full px-6 md:px-12 py-8 md:py-10">
          <div className="max-w-6xl mx-auto flex flex-col gap-4 justify-center min-h-full">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                Stesso principio,{" "}
                <span className="text-primary">conseguenze più grandi</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-[1.35fr_1fr] gap-5 items-center">
              <motion.div {...fade} className="flex flex-col gap-3">
                <p className="text-sm text-foreground/80 leading-relaxed">
                  In un ambiente chiuso, con traffico incanalato in un unico
                  corridoio,{" "}
                  <span className="text-foreground font-medium">
                    la catena di eventi pesa di più
                  </span>{" "}
                  — ogni decisione, anche piccola, può incidere su utenti, colleghi
                  e gestione dell'evento. Il rischio principale: il calo di
                  attenzione nei momenti "tranquilli" (scorte di routine,
                  trasferimenti ripetuti) — proprio quando la vigilanza dovrebbe
                  restare alta.
                </p>
                <ul className="text-sm text-foreground/80 leading-relaxed list-disc pl-5 space-y-1">
                  <li>
                    La comunicazione radio col PCC va gestita come qualsiasi altra
                    fonte di distrazione: non deve sottrarre attenzione dalla
                    guida.
                  </li>
                  <li>
                    Il VST è un veicolo allestito — baricentro e masse diverse da
                    un'utilitaria, quindi trasferimento di carico più marcato.
                  </li>
                  <li>
                    In convoglio, una frenata non anticipata si ripercuote{" "}
                    <span className="text-primary font-semibold">amplificata</span>{" "}
                    su tutti i veicoli che seguono.
                  </li>
                </ul>
              </motion.div>
              <ImagePlaceholder
                label="Foto/video: imbocco galleria (transizione luce/buio), convoglio di veicoli (placeholder generico)"
                className="h-[34vh] w-full"
              />
            </div>
          </div>
        </div>
      </Slide>

      {/* ============================================================
          BLOCCO 3 — URGENZA NON È FRETTA
          ============================================================ */}
      <Slide bg="darker" blockId="urgenza-non-fretta" className="items-stretch">
        <div className="relative z-10 w-full h-full px-6 md:px-12 py-6 md:py-8">
          <div className="max-w-6xl mx-auto flex flex-col gap-3 justify-center min-h-full">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                Urgenza non è fretta —{" "}
                <span className="text-primary">e si sente anche dentro l'abitacolo</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-[1.4fr_1fr] gap-4 items-start">
              <motion.div {...fade} className="flex flex-col gap-2.5">
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Quando un trasferimento diventa emergenza, cambia il contesto
                  operativo —{" "}
                  <span className="text-foreground font-medium">
                    non le leggi della fisica
                  </span>
                  . L'obiettivo non è la velocità massima possibile, ma il minor
                  tempo di intervento compatibile col mantenimento del controllo
                  del veicolo. Un operatore in controllo, fluido e lucido, è quasi
                  sempre anche più rapido di uno che guida teso e a scatti. Chi
                  perde il controllo o si trova un imprevisto mal preparato arriva
                  più tardi, non prima.
                </p>
                <div className="rounded-lg border border-border/60 bg-card/70 px-4 py-3">
                  <p className="text-xs md:text-sm text-foreground/85 leading-snug">
                    Attivare lampeggianti e sirena non è un gesto neutro:{" "}
                    <span className="text-primary font-semibold">
                      modifica il tuo stato psicofisico
                    </span>
                    . Insieme, tipicamente: più attivazione fisica, più carico
                    mentale (guida + urgenza + radio), più pressione percepita, un
                    aumento involontario della velocità spesso non percepito come
                    tale, margini che si restringono senza accorgersene, il rischio
                    di fissarsi sull'obiettivo finale invece che su cosa succede
                    pochi metri davanti.
                  </p>
                </div>
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2.5">
                  <p className="font-mono text-xs uppercase tracking-[0.25em] text-destructive mb-1">
                    Errore frequente
                  </p>
                  <p className="text-xs md:text-sm text-foreground/85 leading-snug">
                    Pensare di essere immuni perché «so di dovermi calmare». La
                    contromisura non è la convinzione di controllarlo, ma un
                    margine di sicurezza deciso a mente fredda, prima che la
                    situazione si presenti.
                  </p>
                </div>
              </motion.div>
              <ImagePlaceholder
                label="Foto/video: lampeggianti blu attivi, abitacolo VST in intervento (placeholder generico)"
                className="h-[38vh] w-full"
              />
            </div>
          </div>
        </div>
      </Slide>

      {/* ============================================================
          BLOCCO 4 — NON DARE MAI PER SCONTATO DI ESSERE STATO VISTO
          ============================================================ */}
      <Slide bg="darker" blockId="essere-visti" className="items-stretch">
        <div className="relative z-10 w-full h-full px-6 md:px-12 py-8 md:py-10">
          <div className="max-w-6xl mx-auto flex flex-col gap-4 justify-center min-h-full">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                Non dare mai per scontato{" "}
                <span className="text-primary">di essere stato visto</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-[1fr_1.35fr] gap-5 items-center">
              <ImagePlaceholder
                label="Foto/video: veicolo con lampeggianti in traffico, punto di vista da dietro il parabrezza (placeholder generico)"
                className="h-[34vh] w-full"
              />
              <motion.div {...fade} className="flex flex-col gap-3">
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Un altro utente può essere distratto, con i finestrini chiusi, la
                  musica alta, può vedere il lampeggiante ma non capire da dove
                  arriva, o reagire in ritardo o nel modo sbagliato. Prima di
                  impegnare lo spazio che una reazione dovrebbe liberare,{" "}
                  <span className="text-primary font-semibold">
                    verifica che quella reazione sia reale
                  </span>{" "}
                  — un rallentamento vero, uno spostamento vero. Se non arriva, o
                  arriva diversa, adattati, non insistere.
                </p>
                <div className="rounded-lg border border-border/60 bg-card/70 px-5 py-4">
                  <p className="text-sm text-foreground/85 leading-relaxed">
                    I dispositivi luminosi e acustici{" "}
                    <span className="text-foreground font-medium">
                      segnalano la presenza, non rendono automaticamente libera la
                      strada
                    </span>
                    . La visibilità di un lampeggiante dipende da posizione e luce;
                    la percezione acustica è limitata da abitacoli insonorizzati,
                    finestrini chiusi, rumore di fondo della galleria. Anche se
                    notata, la reazione dell'altro può essere imprevedibile.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </Slide>

      {/* ============================================================
          BLOCCO 5 — STESSO PRINCIPIO, MARGINE PIÙ STRETTO
          ============================================================ */}
      <Slide bg="darker" blockId="margine-stretto" className="items-stretch">
        <div className="relative z-10 w-full h-full px-6 md:px-12 py-8 md:py-10">
          <div className="max-w-6xl mx-auto flex flex-col gap-4 justify-center min-h-full">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                Stesso principio,{" "}
                <span className="text-primary">margine più stretto</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-[1.35fr_1fr] gap-5 items-center">
              <motion.div {...fade} className="flex flex-col gap-3">
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Regola pratica:{" "}
                  <span className="text-foreground font-medium">
                    non impegnare mai uno spazio che non riesci a verificare e
                    gestire
                  </span>
                  . In galleria: carreggiata e margini laterali limitati, altri
                  utenti e mezzi pesanti con capacità di reazione diverse,
                  illuminazione artificiale costante ma percezione comunque
                  variabile, possibili veicoli fermi o ostacoli lungo il percorso.
                  In uno spazio confinato, gli altri hanno oggettivamente meno
                  possibilità di scostarsi — spesso la scelta corretta è adattare
                  la propria velocità alla capacità di reazione altrui, non il
                  contrario.
                </p>
                <div className="rounded-lg border border-primary/60 bg-background/90 px-5 py-4">
                  <p className="font-mono text-xs uppercase tracking-widest text-primary mb-2">
                    Chiusura
                  </p>
                  <p className="text-sm text-foreground/85 leading-relaxed">
                    La guida in emergenza non sospende i principi della guida
                    sicura —{" "}
                    <span className="text-primary font-semibold">
                      li rende più importanti
                    </span>
                    . Un buon operatore EST resta il conducente descritto nei
                    moduli precedenti: osserva, anticipa, mantiene un margine,
                    decide con lucidità.
                  </p>
                </div>
              </motion.div>
              <ImagePlaceholder
                label="Foto/video: interno galleria con traffico, veicoli fermi/ostacolo (placeholder generico)"
                className="h-[34vh] w-full"
              />
            </div>
          </div>
        </div>
        <ModuloNextNav to="/aula" label="Torna all'indice moduli" backToIndex />
      </Slide>
    </div>
  );
};

export default AulaModulo8;
