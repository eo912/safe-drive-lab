import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import heroBg from "@/assets/perche-hero-bg.jpg";
import urbanRoad from "@/assets/stat-urban-road.jpg";
import traffic from "@/assets/stat-traffic.jpg";
import hospital from "@/assets/stat-hospital.jpg";
import intersection from "@/assets/stat-intersection.jpg";
import familiarRoad from "@/assets/familiar-road.jpg";
import routineDriving from "@/assets/routine-driving.jpg";
import workDriving from "@/assets/work-driving.jpg";
import phoneDriving from "@/assets/phone-driving.jpg";
import povVideo from "@/assets/pov-distraction.mp4.asset.json";
import pauseCoffee from "@/assets/pause-coffee.jpg";
import { useAulaSubscriber } from "@/lib/aulaSync";

// Fade lento per testi principali — solo opacity, nessun movimento
const fade = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: "-15%" },
  transition: { duration: 0.4, delay: 0.5 },
};

// Fade breve per elementi secondari
const fadeQuick = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: "-15%" },
  transition: { duration: 0.25, delay: 0.5 },
};

/* =========================================================
   Slide: full-screen, impatto.
   Apertura, scenario, tensione, scelta, conseguenza, frase chiave.
   ========================================================= */
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
      className={`relative w-full h-screen flex items-center justify-center overflow-hidden ${className}`}
      style={bgStyle ? { backgroundColor: bgStyle } : undefined}
    >
      {children}
    </section>
  );
};

/* =========================================================
   Free: respiro per l'istruttore. Altezza auto, testo minimo.
   ========================================================= */
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
    className={`relative w-full py-32 md:py-44 px-6 ${className}`}
  >
    <div className="max-w-2xl mx-auto">{children}</div>
  </section>
);

const ImgBg = ({
  src,
  alt,
  opacity = "opacity-30",
}: {
  src: string;
  alt: string;
  opacity?: string;
}) => (
  <div className="absolute inset-0">
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`w-full h-full object-cover ${opacity}`}
    />
    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
  </div>
);

const AulaPerche = () => {
  const navigate = useNavigate();
  const [showExit, setShowExit] = useState(false);
  const aulaState = useAulaSubscriber("perche-la-guida-sicura", "hero");

  // Scroll automatico al blocco indicato dall'istruttore
  useEffect(() => {
    if (!aulaState.blocco) return;
    if (aulaState.paused) return; // durante la pausa non scrolliamo
    const el = document.querySelector<HTMLElement>(
      `[data-block="${aulaState.blocco}"]`,
    );
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [aulaState.blocco, aulaState.step, aulaState.ts, aulaState.paused]);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const handleMouseMove = (e: MouseEvent) => {
      setShowExit(e.clientX < 80 && e.clientY < 80);
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate("/istruttore/perche-la-guida-sicura");
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKey);
    };
  }, [navigate]);

  return (
    <div className="bg-background text-foreground">
      {/* Blocco orientamento: aula = solo landscape su schermi piccoli */}
      <div
        className="fixed inset-0 z-[100] bg-background flex-col items-center justify-center text-center px-8 hidden portrait:flex landscape:hidden md:portrait:hidden"
        role="alert"
      >
        <div className="w-12 h-12 rounded-md border border-border flex items-center justify-center mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-6 h-6 text-primary"
          >
            <rect x="3" y="6" width="18" height="12" rx="2" />
            <path d="M7 21h10" strokeLinecap="round" />
          </svg>
        </div>
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-primary mb-3">
          Modalità Aula
        </p>
        <p className="text-lg font-semibold text-foreground mb-2">
          Ruota il dispositivo in orizzontale
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">
          L'aula è progettata per schermi orizzontali e proiettori.
        </p>
      </div>

      {/* OVERLAY PAUSA AULA — controllato solo dall'istruttore */}
      {aulaState.paused && (
        <div
          className="fixed inset-0 z-[90] bg-background flex flex-col items-center justify-center text-center px-8"
          role="status"
          aria-live="polite"
        >
          <div className="relative w-full max-w-2xl aspect-[3/2] mb-10 rounded-lg overflow-hidden">
            <img
              src={pauseCoffee}
              alt=""
              loading="lazy"
              width={1536}
              height={1024}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>
          <p className="font-mono text-xs tracking-[0.4em] uppercase text-primary mb-4">
            Intervallo
          </p>
          <h2 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            Pausa
          </h2>
          {aulaState.pauseMinutes && (
            <p className="text-lg md:text-xl text-muted-foreground">
              Riprendiamo tra {aulaState.pauseMinutes} minuti
            </p>
          )}
        </div>
      )}

      {/* Uscita aula — invisibile durante la lezione */}
      <Link
        to="/istruttore/perche-la-guida-sicura"
        aria-label="Esci dalla modalità aula"
        className={`fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-md bg-background/70 backdrop-blur border border-border/40 text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-border transition-opacity duration-300 ${
          showExit ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Esci
      </Link>

      {/* ============================================================
          BLOCCO 1 — APERTURA
          Slide impatto → Free (respiro istruttore)
          ============================================================ */}

      {/* SLIDE IMPATTO: Apertura */}
      <Slide blockId="hero">
        <ImgBg src={heroBg} alt="Strada reale" opacity="opacity-40" />
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-6"
          >
            Modulo 01
          </motion.p>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.9 }}
            className="text-5xl md:text-7xl font-bold leading-[1.05]"
          >
            La realtà della strada
          </motion.h1>
        </div>
      </Slide>

      {/* FREE: respiro */}
      <Free>
        <motion.p
          {...fade}
          className="text-2xl md:text-4xl font-semibold leading-snug text-foreground/90 text-center"
        >
          Non succede solo agli altri.
        </motion.p>
      </Free>

      {/* ============================================================
          BLOCCO 2 — I NUMERI
          Slide tensione (dati) → Slide conseguenza (ritmo) → Free comprensione
          ============================================================ */}

      {/* SLIDE TENSIONE: Numeri */}
      <Slide bg="card" blockId="numeri">
        <div className="relative z-10 w-full max-w-5xl px-6">
          <div className="grid grid-cols-2 gap-8 md:gap-14">
            {[
              { value: "173.364", label: "incidenti", img: urbanRoad, alt: "Strada urbana" },
              { value: "3.030", label: "morti", img: traffic, alt: "Traffico" },
              { value: "233.853", label: "feriti", img: hospital, alt: "Ospedale" },
              { value: "475", label: "al giorno", img: intersection, alt: "Incrocio" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.15 }}
              >
                <div className="rounded-md overflow-hidden mb-3 aspect-[16/9]">
                  <img
                    src={s.img}
                    alt={s.alt}
                    loading="lazy"
                    className="w-full h-full object-cover grayscale-[40%] opacity-50"
                  />
                </div>
                <p className="font-mono text-3xl md:text-5xl font-bold mb-1">
                  {s.value}
                </p>
                <p className="text-primary text-sm md:text-base font-medium">
                  {s.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Slide>

      {/* SLIDE CONSEGUENZA: il ritmo */}
      <Slide bg="darker">
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <motion.p
            {...fade}
            className="text-4xl md:text-6xl font-bold leading-tight"
          >
            Uno ogni <span className="text-primary">3 minuti</span>.
          </motion.p>
        </div>
      </Slide>

      {/* FREE: comprensione */}
      <Free>
        <motion.p
          {...fade}
          className="text-xl md:text-3xl font-semibold leading-snug text-foreground/80 text-center"
        >
          Mentre parliamo, sta succedendo.
        </motion.p>
      </Free>

      {/* ============================================================
          BLOCCO 3 — STRADA CONOSCIUTA & ABITUDINE
          Slide impatto → Free → Slide tensione → Slide conseguenza
          ============================================================ */}

      {/* SLIDE IMPATTO */}
      <Slide blockId="strada-conosciuta">
        <ImgBg src={familiarRoad} alt="Strada familiare" opacity="opacity-25" />
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <motion.h2
            {...fade}
            className="text-4xl md:text-6xl font-bold leading-tight"
          >
            Una strada<br />
            <span className="text-primary">che conosci.</span>
          </motion.h2>
        </div>
      </Slide>

      {/* FREE: respiro / domanda istruttore */}
      <Free>
        <motion.p
          {...fade}
          className="text-2xl md:text-4xl font-semibold leading-snug text-foreground/90 text-center"
        >
          Sai dove sono le curve.
        </motion.p>
      </Free>

      {/* SLIDE TENSIONE */}
      <Slide bg="darker">
        <ImgBg src={routineDriving} alt="Guida di routine" opacity="opacity-15" />
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <motion.h2
            {...fade}
            className="text-4xl md:text-6xl font-bold leading-tight"
          >
            Ed è proprio lì<br />
            <span className="text-primary">che smetti di guardare.</span>
          </motion.h2>
        </div>
      </Slide>

      {/* SLIDE CONSEGUENZA */}
      <Slide bg="black" blockId="abitudine">
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <motion.h2
            {...fade}
            className="text-4xl md:text-6xl font-bold leading-tight"
          >
            Non è esperienza.<br />
            <span className="text-primary">È abitudine.</span>
          </motion.h2>
        </div>
      </Slide>

      {/* ============================================================
          BLOCCO 4 — GUIDARE È LAVORO
          Slide impatto → Free comprensione
          ============================================================ */}

      <Slide blockId="guidare-lavoro">
        <ImgBg src={workDriving} alt="Veicolo aziendale" opacity="opacity-20" />
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <motion.h2
            {...fade}
            className="text-4xl md:text-6xl font-bold leading-tight"
          >
            Guidare è <span className="text-primary">lavoro.</span>
          </motion.h2>
        </div>
      </Slide>

      <Free>
        <motion.p
          {...fade}
          className="text-2xl md:text-4xl font-semibold leading-snug text-foreground/90 text-center"
        >
          Quando guidi per lavoro,<br />
          <span className="text-primary">stai lavorando.</span>
        </motion.p>
      </Free>

      {/* ============================================================
          BLOCCO 5 — SCENARIO DISTRAZIONE
          Slide scenario → Slide scelta (POV) → Slide conseguenza → Free comprensione
          ============================================================ */}

      {/* SLIDE SCENARIO */}
      <Slide bg="darker" blockId="distrazione">
        <ImgBg src={phoneDriving} alt="Telefono al volante" opacity="opacity-25" />
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <motion.h2
            {...fade}
            className="text-4xl md:text-6xl font-bold leading-tight"
          >
            Bastano <span className="text-primary">pochi secondi.</span>
          </motion.h2>
        </div>
      </Slide>

      {/* SLIDE SCELTA: POV video, nessun testo */}
      <Slide bg="black" blockId="video-pov">
        <video
          src={povVideo.url}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      </Slide>

      {/* SLIDE CONSEGUENZA */}
      <Slide bg="darker">
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <motion.p
            {...fadeQuick}
            className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-6"
          >
            A 50 km/h
          </motion.p>
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.25, delay: 1.1 }}
            className="text-4xl md:text-6xl font-bold leading-tight"
          >
            2 secondi = <span className="text-primary">28 metri</span>
          </motion.h2>
        </div>
      </Slide>

      {/* FREE: comprensione / domanda aperta */}
      <Free>
        <motion.p
          {...fade}
          className="text-2xl md:text-4xl font-semibold leading-snug text-foreground/90 text-center"
        >
          Un incrocio.<br />Un pedone.<br />Un'auto ferma.
        </motion.p>
      </Free>

      {/* ============================================================
          BLOCCO 6 — CHIUSURA
          Slide impatto finale
          ============================================================ */}

      <Slide bg="black" blockId="chiusura">
        <div className="relative z-10 text-center px-6 max-w-4xl">
          <motion.p
            {...fade}
            className="text-3xl md:text-5xl lg:text-6xl font-bold leading-[1.15]"
          >
            <span className="text-foreground/60">Se il problema è umano…</span>
            <br />
            <span className="text-primary">la soluzione parte da chi guida.</span>
          </motion.p>
        </div>
      </Slide>

      {/* FREE: chiusura minima */}
      <Free className="text-center">
        <motion.p
          {...fade}
          className="font-mono text-[11px] tracking-[0.3em] uppercase text-muted-foreground/60"
        >
          Fine modulo 01
        </motion.p>
      </Free>
    </div>
  );
};

export default AulaPerche;
