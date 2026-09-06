import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ZoomIn, X } from "lucide-react";

import istatInfografica from "@/assets/istat-infografica.jpg";
import logoGsVdaAsset from "@/assets/logo-gsvda.png.asset.json";
import leveEuropaAsset from "@/assets/tre-leve-europa.jpg.asset.json";
import leveStatoAsset from "@/assets/tre-leve-stato.jpg.asset.json";
import leveIndustriaAsset from "@/assets/tre-leve-industria.jpg.asset.json";
import leveEducazioneAsset from "@/assets/tre-leve-educazione.jpg.asset.json";
import { useAulaSubscriber, useAulaHeartbeat } from "@/lib/aulaSync";
import { AulaMediaOverlay } from "@/components/aula/AulaMediaOverlay";
import { AulaEmbedLayer } from "@/components/aula/AulaEmbedLayer";
import { AulaPauseScreen } from "@/components/aula/AulaPauseScreen";
import { SyncDebugOverlay } from "@/components/dev/SyncDebugOverlay";

const MODULO = "modulo-1-perche-un-corso";

const fade = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: "-15%" },
  transition: { duration: 0.4, delay: 0.4 },
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

const Free = ({
  children,
  className = "",
  blockId,
}: {
  children: React.ReactNode;
  className?: string;
  blockId?: string;
}) => (
  <section
    data-block={blockId}
    className={`relative w-full h-screen flex items-center justify-center px-6 snap-start snap-always ${className}`}
  >
    <div className="max-w-2xl mx-auto w-full">{children}</div>
  </section>
);

/* =========================================================
   Le tre leve — pannelli affiancati, dettaglio in area fissa.
   Nessuno scroll interno: altezze fisse.
   ========================================================= */
type Leva = {
  id: string;
  nome: string;
  anno: string;
  titolo: string;
  testo: string;
};

const LEVE: Leva[] = [
  {
    id: "stato",
    nome: "Stato",
    anno: "2003",
    titolo: "Regole e controllo",
    testo:
      "La patente a punti entra in vigore nel 2003. Lo Stato agisce su norme, controlli e sanzioni per cambiare il comportamento alla guida.",
  },
  {
    id: "industria",
    nome: "Industria",
    anno: "2022–2024",
    titolo: "Dalla sicurezza passiva agli ADAS",
    testo:
      "Dall'ABS agli airbag, fino agli ADAS resi obbligatori tra il 2022 e il 2024. Il veicolo diventa parte attiva della prevenzione.",
  },
  {
    id: "educazione",
    nome: "Educazione",
    anno: "Oggi",
    titolo: "Campagne e formazione",
    testo:
      "Campagne di sensibilizzazione e corsi come questo. È la leva più lenta, ma è l'unica che agisce direttamente su chi guida.",
  },
];

const TreLeveScene = ({ level }: { level: RenderLevel }) => {
  const [attiva, setAttiva] = useState<string>(LEVE[0].id);
  const leva = LEVE.find((l) => l.id === attiva) ?? LEVE[0];

  return (
    <div className="relative z-10 w-full h-full flex flex-col justify-center px-6 md:px-12 py-10 gap-6">
      {/* Intestazione: Unione Europea, 2001 */}
      <div className="flex items-center justify-center gap-3">
        {/* TODO: bandiera UE — sostituire con import da @/assets/tre-leve-europa.jpg */}
        <div
          className="w-8 h-8 rounded-full border border-primary/40 flex items-center justify-center text-[9px] font-mono text-primary"
          style={{ backgroundColor: "hsl(220 60% 20%)" }}
          aria-hidden
        >
          UE
        </div>
        <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-primary">
          2001 · Obiettivo: dimezzare i morti sulla strada
        </p>
      </div>

      {/* Tre pannelli */}
      <div className="grid grid-cols-3 gap-4 h-[38vh]">
        {LEVE.map((l) => {
          const active = l.id === attiva;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => setAttiva(l.id)}
              className={`relative h-full overflow-hidden rounded-lg border text-left transition-colors ${
                active
                  ? "border-primary/70"
                  : "border-border/60 hover:border-border"
              }`}
            >
              <img
                src={l.img}
                alt=""
                aria-hidden
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div
                className={`absolute inset-0 ${active ? "bg-background/30" : "bg-background/60"}`}
                aria-hidden
              />
              <div className="relative z-10 h-full flex flex-col justify-end p-5">
                <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-primary mb-2">
                  {l.anno}
                </p>
                <p className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-foreground">
                  {l.nome}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Area dettaglio fissa — mai scroll, sostituisce il contenuto precedente */}
      <div className="h-[16vh] rounded-lg border border-border/60 bg-card/70 px-6 py-5 overflow-hidden">
        {level === "preview" ? (
          <div>
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-primary mb-2">
              {leva.nome}
            </p>
            <p className="text-base text-foreground/80">{leva.titolo}</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={leva.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-primary mb-2">
                {leva.nome} — {leva.titolo}
              </p>
              <p className="text-base md:text-lg text-foreground/80 leading-relaxed">
                {leva.testo}
              </p>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

/* =========================================================
   Numeri 2001 vs oggi
   ========================================================= */
const NUMERI = [
  { label: "Incidenti", a: "263.100", b: "173.364" },
  { label: "Morti", a: "7.096", b: "3.030" },
  { label: "Feriti", a: "373.286", b: "233.853" },
  { label: "Veicoli circolanti", a: "32,5 M", b: "41,3 M" },
];

const AulaModulo1 = () => {
  const navigate = useNavigate();
  const [showExit, setShowExit] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const aulaState = useAulaSubscriber(MODULO, "copertina");
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
  const embedBlocco = urlParams?.get("blocco") ?? "copertina";
  const embedPaused = urlParams?.get("pausa") === "1";
  const embedAtm =
    (urlParams?.get("atm") as import("@/lib/pauseAtmosphere").PauseAtmosphere | null) ?? null;

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
          className={`fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-md bg-background/70 backdrop-blur border border-border/40 text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-border transition-opacity duration-300 ${
            showExit ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Esci
        </Link>
      )}

      {/* ============================================================
          BLOCCO 1 — COPERTINA
          ============================================================ */}
      <Slide bg="black" blockId="copertina">
        <div className="relative z-10 text-center px-6">
          {/* TODO: sostituire con <img src={logoGsVda} /> quando l'asset è disponibile in src/assets/logo-gsvda.png */}
          <motion.p
            {...fade}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-none"
          >
            <span className="text-foreground">GUIDA SICURA </span>
            <span className="text-primary">VDA</span>
          </motion.p>
        </div>
      </Slide>

      {/* ============================================================
          BLOCCO 2 — HOOK
          ============================================================ */}
      <Slide blockId="hook">
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <motion.p
            {...fade}
            className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-8"
          >
            Modulo 01
          </motion.p>
          <motion.h1
            {...fade}
            className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.1]"
          >
            Perché un corso
          </motion.h1>
        </div>
      </Slide>

      <Free className="text-center">
        <motion.p
          {...fade}
          className="text-2xl md:text-4xl font-semibold leading-snug text-foreground/90"
        >
          Non è un'idea nuova.
          <br />
          <span className="text-foreground/60">
            È una storia che comincia più di vent'anni fa — e che oggi passa anche da
            questa aula.
          </span>
        </motion.p>
      </Free>

      {/* ============================================================
          BLOCCO 3 — LE TRE LEVE
          ============================================================ */}
      <Slide bg="darker" blockId="tre-leve" className="items-stretch">
        <TreLeveScene level={renderLevel} />
      </Slide>

      {/* ============================================================
          BLOCCO 4 — 2001 VS OGGI
          ============================================================ */}
      <Slide bg="card" blockId="numeri-2001-2024" className="items-stretch">
        <div className="relative z-10 w-full h-full flex flex-col justify-center px-6 md:px-12 py-10 gap-6">
          <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-primary text-center">
            2001 vs oggi
          </p>

          <div className="grid grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto w-full">
            {[
              { anno: "2001", key: "a" as const },
              { anno: "2024", key: "b" as const },
            ].map((col) => (
              <div key={col.anno} className="space-y-3">
                <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground text-center">
                  {col.anno}
                </p>
                {NUMERI.map((n) => (
                  <div
                    key={n.label}
                    className="rounded-lg border border-border/60 bg-card/70 px-4 py-3 text-center"
                  >
                    <p className="text-2xl md:text-3xl font-bold text-foreground">
                      {n[col.key]}
                    </p>
                    <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-1">
                      {n.label}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => setZoomed(true)}
              className="relative rounded-lg overflow-hidden border border-border/40 group h-[18vh]"
            >
              <img
                src={istatInfografica}
                alt="Infografica ISTAT – Incidenti stradali in Italia 2024"
                loading="lazy"
                className="h-full w-auto"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-background/0 group-hover:bg-background/30 transition-colors">
                <ZoomIn className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
            <p className="text-[11px] text-muted-foreground mt-2 font-mono tracking-wider">
              Fonte: ISTAT – ACI
            </p>
          </div>
        </div>
      </Slide>

      {/* ============================================================
          BLOCCO 5 — IL COSTO PER TUTTI
          ============================================================ */}
      <Slide bg="black" blockId="costi-stato">
        <div className="relative z-10 text-center px-6 max-w-4xl">
          <motion.p
            {...fade}
            className="text-5xl md:text-7xl font-bold text-primary leading-none mb-6"
          >
            18 miliardi di euro
          </motion.p>
          <motion.p
            {...fade}
            className="text-xl md:text-2xl text-foreground/70"
          >
            all'anno — quasi l'1% del PIL nazionale
          </motion.p>
        </div>
      </Slide>

      <Free className="text-center">
        <motion.p
          {...fade}
          className="text-2xl md:text-4xl font-semibold leading-snug text-foreground/90"
        >
          La strada è più sicura di ieri,
          <br />
          <span className="text-primary">
            ma il lavoro non è finito, ed è anche per questo che siete qui.
          </span>
        </motion.p>
      </Free>

      {/* ZOOM INFOGRAFICA */}
      <AnimatePresence>
        {zoomed && !embedMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-6"
            onClick={() => setZoomed(false)}
          >
            <button
              type="button"
              aria-label="Chiudi"
              className="absolute top-6 right-6 text-foreground/70 hover:text-foreground"
              onClick={() => setZoomed(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={istatInfografica}
              alt="Infografica ISTAT – Incidenti stradali in Italia 2024"
              className="max-h-full max-w-full object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AulaModulo1;
