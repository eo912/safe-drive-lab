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
import officeImg from "@/assets/meaning-office.jpg";
import familyImg from "@/assets/meaning-family.jpg";
import legalImg from "@/assets/meaning-legal.jpg";
import workDriving from "@/assets/work-driving.jpg";
import phoneDriving from "@/assets/phone-driving.jpg";
import povVideo from "@/assets/pov-distraction.mp4.asset.json";

const fade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-15%" },
  transition: { duration: 0.7 },
};

/* =========================================================
   Slide: sezione full-screen di impatto.
   Usata SOLO per: apertura, scenario, scelta, conseguenza, frase chiave.
   ========================================================= */
const Slide = ({
  children,
  bg,
  className = "",
}: {
  children: React.ReactNode;
  bg?: "dark" | "darker" | "card" | "black";
  className?: string;
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
      className={`relative w-full h-screen flex items-center justify-center overflow-hidden ${className}`}
      style={bgStyle ? { backgroundColor: bgStyle } : undefined}
    >
      {children}
    </section>
  );
};

/* =========================================================
   Free: sezione libera, altezza auto.
   Usata per: spiegazione, domande, esempi, comprensione, discussione.
   Layout volutamente diverso dalle slide: meno rigido, più respiro.
   ========================================================= */
const Free = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <section
    className={`relative w-full py-24 md:py-32 px-6 ${className}`}
  >
    <div className="max-w-3xl mx-auto">{children}</div>
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

  useEffect(() => {
    window.scrollTo(0, 0);
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // Mostra il pulsante uscita solo quando il mouse entra nell'angolo in alto a sinistra
    const handleMouseMove = (e: MouseEvent) => {
      setShowExit(e.clientX < 80 && e.clientY < 80);
    };

    // ESC come scorciatoia per uscire (utile per l'istruttore)
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
      {/* Uscita aula — invisibile durante la lezione, appare solo passando il mouse in alto a sx o premendo ESC */}
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
          Slide impatto → Sezione libera istruttore
          ============================================================ */}

      {/* SLIDE: Apertura */}
      <Slide>
        <ImgBg src={heroBg} alt="Strada reale" opacity="opacity-40" />
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-6"
          >
            Modulo 01
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="text-5xl md:text-7xl font-bold mb-6 leading-[1.05]"
          >
            La realtà della strada
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-xl md:text-2xl text-foreground/70"
          >
            Non è un rischio raro. È qualcosa che succede ogni giorno.
          </motion.p>
        </div>
      </Slide>

      {/* FREE: respiro tra apertura e dati */}
      <Free>
        <motion.p
          {...fade}
          className="text-2xl md:text-4xl font-semibold leading-snug text-foreground/90"
        >
          Non succede solo agli altri.
        </motion.p>
      </Free>

      {/* ============================================================
          BLOCCO 2 — I NUMERI
          Slide impatto (dati) → Sezione libera comprensione
          ============================================================ */}

      {/* SLIDE: Numeri */}
      <Slide bg="card">
        <div className="relative z-10 w-full max-w-5xl px-6">
          <div className="grid grid-cols-2 gap-8 md:gap-14 mb-10">
            {[
              { value: "173.364", label: "incidenti", img: urbanRoad, alt: "Strada urbana" },
              { value: "3.030", label: "morti", img: traffic, alt: "Traffico" },
              { value: "233.853", label: "feriti", img: hospital, alt: "Ospedale" },
              { value: "475", label: "al giorno", img: intersection, alt: "Incrocio" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
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
          <motion.p
            {...fade}
            className="text-center text-2xl md:text-3xl font-semibold"
          >
            Ogni <span className="text-primary">3 minuti</span>.
          </motion.p>
        </div>
      </Slide>

      {/* FREE: respiro dopo i numeri */}
      <Free>
        <motion.p
          {...fade}
          className="text-2xl md:text-4xl font-semibold leading-snug text-foreground/90"
        >
          Uno ogni <span className="text-primary">3 minuti</span>.
        </motion.p>
        <motion.p
          {...fade}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-lg md:text-xl text-foreground/60 mt-4"
        >
          Mentre parliamo, sta succedendo.
        </motion.p>
      </Free>

      {/* ============================================================
          BLOCCO 3 — STRADA CONOSCIUTA & ABITUDINE
          Slide frase chiave → Sezione libera esempio → Slide chiusura concetto
          ============================================================ */}

      {/* SLIDE: Frase chiave */}
      <Slide>
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

      {/* FREE: respiro */}
      <Free>
        <motion.p
          {...fade}
          className="text-2xl md:text-4xl font-semibold leading-snug text-foreground/90"
        >
          Sai dove sono le curve.
        </motion.p>
        <motion.p
          {...fade}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-2xl md:text-4xl font-semibold leading-snug text-foreground/60 mt-3"
        >
          Ed è proprio lì che smetti di guardare.
        </motion.p>
      </Free>

      {/* SLIDE: Conseguenza concettuale */}
      <Slide bg="darker">
        <ImgBg src={routineDriving} alt="Guida di routine" opacity="opacity-15" />
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <motion.h2
            {...fade}
            className="text-4xl md:text-6xl font-bold leading-tight mb-8"
          >
            Non è esperienza.<br />
            <span className="text-primary">È abitudine.</span>
          </motion.h2>
          <motion.p
            {...fade}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-foreground/60"
          >
            Non stai più guidando. Stai ripetendo.
          </motion.p>
        </div>
      </Slide>

      {/* ============================================================
          BLOCCO 4 — INCIDENTE NON È UN NUMERO
          Sezione libera (riflessione, no slide) — momento di respiro
          ============================================================ */}

      <Free className="bg-card/30">
        <motion.h2
          {...fade}
          className="text-3xl md:text-5xl font-bold mb-12 leading-tight"
        >
          Un incidente non finisce<br />
          <span className="text-primary">quando finisce.</span>
        </motion.h2>

        <div className="grid sm:grid-cols-2 gap-6">
          {[
            { title: "Lavoro", img: officeImg, alt: "Ufficio" },
            { title: "Salute", img: hospital, alt: "Ospedale" },
            { title: "Famiglia", img: familyImg, alt: "Famiglia" },
            { title: "Responsabilità", img: legalImg, alt: "Documenti" },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex items-center gap-4"
            >
              <div className="w-20 h-20 rounded-md overflow-hidden shrink-0">
                <img
                  src={item.img}
                  alt={item.alt}
                  loading="lazy"
                  className="w-full h-full object-cover grayscale-[50%] opacity-60"
                />
              </div>
              <p className="text-foreground/85 font-medium text-lg">{item.title}</p>
            </motion.div>
          ))}
        </div>
      </Free>

      {/* ============================================================
          BLOCCO 5 — GUIDARE È LAVORO
          Slide frase chiave → Sezione libera contesto B2B
          ============================================================ */}

      {/* SLIDE */}
      <Slide>
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

      {/* FREE */}
      <Free>
        <motion.p
          {...fade}
          className="text-2xl md:text-4xl font-semibold leading-snug text-foreground/90"
        >
          Quando guidi per lavoro,<br />
          <span className="text-primary">stai lavorando.</span>
        </motion.p>
      </Free>

      {/* ============================================================
          BLOCCO 6 — SCENARIO DISTRAZIONE
          Slide scenario → Slide scelta (POV video) → Slide conseguenza
          ============================================================ */}

      {/* SLIDE: Scenario — apertura */}
      <Slide bg="darker">
        <ImgBg src={phoneDriving} alt="Telefono al volante" opacity="opacity-25" />
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <motion.h2
            {...fade}
            className="text-4xl md:text-6xl font-bold leading-tight mb-6"
          >
            Bastano <span className="text-primary">pochi secondi.</span>
          </motion.h2>
          <motion.p
            {...fade}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-foreground/70"
          >
            Guardi il telefono. È un attimo. Ma la strada non si ferma.
          </motion.p>
        </div>
      </Slide>

      {/* SLIDE: Scelta / scenario POV — solo video, nessun testo */}
      <Slide bg="black">
        <video
          src={povVideo.url}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      </Slide>

      {/* SLIDE: Conseguenza */}
      <Slide bg="darker">
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <motion.p
            {...fade}
            className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-6"
          >
            A 50 km/h
          </motion.p>
          <motion.h2
            {...fade}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-6xl font-bold leading-tight mb-6"
          >
            2 secondi = <span className="text-primary">28 metri</span>
          </motion.h2>
          <motion.p
            {...fade}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-foreground/70"
          >
            Percorsi senza guardare la strada.
          </motion.p>
        </div>
      </Slide>

      {/* FREE: respiro dopo lo scenario */}
      <Free>
        <motion.p
          {...fade}
          className="text-2xl md:text-4xl font-semibold leading-snug text-foreground/90"
        >
          28 metri.
        </motion.p>
        <motion.p
          {...fade}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-2xl md:text-4xl font-semibold leading-snug text-foreground/60 mt-3"
        >
          Un incrocio. Un pedone. Un'auto ferma.
        </motion.p>
      </Free>

      {/* ============================================================
          BLOCCO 7 — CHIUSURA
          Slide frase chiave finale (impatto massimo)
          ============================================================ */}

      <Slide bg="black">
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

      {/* FREE: Chiusura operativa */}
      <Free className="text-center">
        <motion.div {...fade}>
          <p className="text-base md:text-lg text-foreground/70 leading-relaxed mb-3">
            Capire è il primo passo.
          </p>
          <p className="text-base md:text-lg text-foreground/70 leading-relaxed mb-12">
            Applicarlo è quello che fa la differenza.
          </p>
          <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-muted-foreground/60">
            Fine modulo 01
          </p>
        </motion.div>
      </Free>
    </div>
  );
};

export default AulaPerche;
