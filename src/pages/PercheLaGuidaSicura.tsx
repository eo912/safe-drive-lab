import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import heroBg from "@/assets/perche-hero-bg.jpg";
import urbanRoad from "@/assets/stat-urban-road.jpg";
import traffic from "@/assets/stat-traffic.jpg";
import hospital from "@/assets/stat-hospital.jpg";
import intersection from "@/assets/stat-intersection.jpg";
import familiarRoad from "@/assets/familiar-road.jpg";
import routineDriving from "@/assets/routine-driving.jpg";
import officeImg from "@/assets/meaning-office.jpg";
import hospitalImg from "@/assets/stat-hospital.jpg";
import familyImg from "@/assets/meaning-family.jpg";
import legalImg from "@/assets/meaning-legal.jpg";
import workDriving from "@/assets/work-driving.jpg";
import phoneDriving from "@/assets/phone-driving.jpg";
import povVideo from "@/assets/pov-distraction.mp4.asset.json";

const fade = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-10%" },
  transition: { duration: 0.8 },
};

const Section = ({
  children,
  className = "",
  bg,
}: {
  children: React.ReactNode;
  className?: string;
  bg?: "dark" | "darker" | "card";
}) => {
  const bgStyle =
    bg === "darker"
      ? "hsl(220 20% 5%)"
      : bg === "card"
        ? "hsl(var(--card))"
        : undefined;

  return (
    <section
      className={`min-h-screen w-full flex flex-col justify-center relative overflow-hidden ${className}`}
      style={bgStyle ? { backgroundColor: bgStyle } : undefined}
    >
      {children}
    </section>
  );
};

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
      width={1920}
      height={1080}
      className={`w-full h-full object-cover ${opacity}`}
    />
    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
  </div>
);

const PercheLaGuidaSicura = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-background text-foreground">
      {/* Fixed nav */}
      <div
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/30"
        style={{
          backgroundColor: "hsl(var(--background) / 0.85)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="container mx-auto flex items-center h-14 px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Torna alla home</span>
          </Link>
        </div>
      </div>

      {/* 1. HERO */}
      <Section>
        <ImgBg src={heroBg} alt="Strada reale di montagna" opacity="opacity-40" />
        <div className="relative z-10 container mx-auto px-6 max-w-3xl">
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
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-[1.1]"
          >
            La realtà della strada
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-lg md:text-xl text-foreground/70 max-w-xl leading-relaxed"
          >
            Non è un rischio raro. È qualcosa che succede ogni giorno.
          </motion.p>
        </div>
      </Section>

      {/* 2. NUMERI 2x2 */}
      <Section bg="card">
        <div className="relative z-10 container mx-auto px-6 max-w-4xl">
          <div className="grid grid-cols-2 gap-6 md:gap-10 mb-12">
            {[
              { value: "173.364", label: "incidenti", desc: "Succedono ogni giorno, ovunque.", img: urbanRoad, alt: "Strada urbana" },
              { value: "3.030", label: "morti", desc: "Ogni giorno qualcuno non torna.", img: traffic, alt: "Traffico" },
              { value: "233.853", label: "feriti", desc: "Molti incidenti non finiscono lì.", img: hospital, alt: "Ospedale" },
              { value: "475", label: "al giorno", desc: "Mentre stai guidando, sta succedendo.", img: intersection, alt: "Incrocio" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="relative"
              >
                <div className="rounded-lg overflow-hidden mb-4 aspect-[16/10]">
                  <img
                    src={s.img}
                    alt={s.alt}
                    loading="lazy"
                    width={800}
                    height={500}
                    className="w-full h-full object-cover grayscale-[40%] opacity-50"
                  />
                </div>
                <p className="font-mono text-3xl md:text-4xl font-bold text-foreground mb-1">
                  {s.value}
                </p>
                <p className="text-primary text-sm md:text-base font-medium mb-1">{s.label}</p>
                <p className="text-muted-foreground text-xs md:text-sm">{s.desc}</p>
              </motion.div>
            ))}
          </div>
          <motion.p
            {...fade}
            className="text-center text-2xl md:text-3xl font-semibold text-foreground"
          >
            Ogni <span className="text-primary">3 minuti</span>.
          </motion.p>
        </div>
      </Section>

      {/* 3. STRADA CONOSCIUTA */}
      <Section>
        <ImgBg src={familiarRoad} alt="Strada italiana familiare" opacity="opacity-25" />
        <div className="relative z-10 container mx-auto px-6 max-w-2xl text-center">
          <motion.h2
            {...fade}
            className="text-3xl md:text-5xl font-bold text-foreground mb-8"
          >
            Una strada che conosci
          </motion.h2>
          <motion.div
            {...fade}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <p className="text-lg md:text-xl text-foreground/80 leading-relaxed mb-8">
              Ci passi ogni giorno.<br />
              Sai dove sono le curve.<br />
              Sai cosa aspettarti.
            </p>
            <p className="text-lg md:text-xl text-foreground/60 leading-relaxed">
              Ed è proprio lì che l'attenzione cala.<br />
              E l'abitudine prende il controllo.
            </p>
          </motion.div>
        </div>
      </Section>

      {/* 4. ABITUDINE */}
      <Section bg="darker">
        <ImgBg src={routineDriving} alt="Guida di routine" opacity="opacity-15" />
        <div className="relative z-10 container mx-auto px-6 max-w-2xl text-center">
          <motion.h2
            {...fade}
            className="text-3xl md:text-5xl font-bold text-foreground mb-8"
          >
            Non è esperienza.<br />
            <span className="text-primary">È abitudine.</span>
          </motion.h2>
          <motion.div
            {...fade}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <p className="text-lg md:text-xl text-foreground/70 leading-relaxed mb-6">
              Più una strada è familiare,<br />
              meno la osservi davvero.
            </p>
            <p className="text-lg md:text-xl text-foreground/50 leading-relaxed">
              Non stai più guidando.<br />
              Stai ripetendo.
            </p>
          </motion.div>
        </div>
      </Section>

      {/* 5. INCIDENTE ≠ NUMERO */}
      <Section bg="card">
        <div className="relative z-10 container mx-auto px-6 max-w-4xl">
          <motion.h2
            {...fade}
            className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center"
          >
            Un incidente non è solo un numero
          </motion.h2>
          <div className="grid grid-cols-2 gap-6 md:gap-10 mb-12">
            {[
              { title: "Perdita della capacità lavorativa", img: officeImg, alt: "Ufficio vuoto" },
              { title: "Costi sanitari a lungo termine", img: hospitalImg, alt: "Ospedale" },
              { title: "Impatto sulle famiglie", img: familyImg, alt: "Famiglia" },
              { title: "Conseguenze legali", img: legalImg, alt: "Documenti legali" },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="rounded-lg overflow-hidden mb-3 aspect-[16/10]">
                  <img
                    src={item.img}
                    alt={item.alt}
                    loading="lazy"
                    width={800}
                    height={500}
                    className="w-full h-full object-cover grayscale-[50%] opacity-50"
                  />
                </div>
                <p className="text-foreground/80 text-sm md:text-base font-medium">{item.title}</p>
              </motion.div>
            ))}
          </div>
          <motion.p
            {...fade}
            className="text-center text-foreground/60 text-base md:text-lg leading-relaxed"
          >
            Non finisce con l'impatto.<br />
            Continua nel tempo.<br />
            Cambia la vita.
          </motion.p>
        </div>
      </Section>

      {/* 6. GUIDARE È LAVORO */}
      <Section>
        <ImgBg src={workDriving} alt="Veicolo commerciale in autostrada" opacity="opacity-20" />
        <div className="relative z-10 container mx-auto px-6 max-w-2xl text-center">
          <motion.h2
            {...fade}
            className="text-3xl md:text-5xl font-bold text-foreground mb-8"
          >
            Guidare è <span className="text-primary">lavoro</span>
          </motion.h2>
          <motion.div
            {...fade}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <p className="text-lg md:text-xl text-foreground/70 leading-relaxed mb-6">
              Quando guidi per lavoro, stai lavorando.<br />
              E il rischio è parte dell'attività.
            </p>
            <p className="text-base md:text-lg text-foreground/50 leading-relaxed">
              È una delle principali cause di infortunio sul lavoro.
            </p>
          </motion.div>
        </div>
      </Section>

      {/* 7. DISTRAZIONE */}
      <Section bg="darker">
        <ImgBg src={phoneDriving} alt="Distrazione alla guida" opacity="opacity-20" />
        <div className="relative z-10 container mx-auto px-6 max-w-2xl text-center">
          <motion.h2
            {...fade}
            className="text-3xl md:text-5xl font-bold text-foreground mb-8"
          >
            Bastano <span className="text-primary">pochi secondi</span>
          </motion.h2>
          <motion.div
            {...fade}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <p className="text-lg md:text-xl text-foreground/70 leading-relaxed mb-6">
              Guardi il telefono.<br />
              È un attimo.
            </p>
            <p className="text-lg md:text-xl text-foreground/50 leading-relaxed">
              Ma la strada non si ferma.
            </p>
          </motion.div>
        </div>
      </Section>

      {/* 8. VIDEO */}
      <Section>
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <video
            src={povVideo.url}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-background/60" />
        </div>
      </Section>

      {/* 9. CHIUSURA */}
      <Section bg="darker">
        <div className="relative z-10 container mx-auto px-6 max-w-3xl text-center">
          <motion.p
            {...fade}
            className="text-2xl md:text-4xl lg:text-5xl font-bold leading-snug"
          >
            <span className="text-foreground/70">Se il problema è umano…</span>
            <br />
            <span className="text-primary">la soluzione parte da chi guida.</span>
          </motion.p>
        </div>
      </Section>

      {/* 10. CTA */}
      <Section bg="card">
        <div className="relative z-10 container mx-auto px-6 max-w-2xl text-center">
          <motion.div {...fade}>
            <p className="text-lg md:text-xl text-foreground/70 leading-relaxed mb-12">
              Capire è il primo passo.<br />
              Applicarlo è quello che fa la differenza.
            </p>
            <Link
              to="/"
              className="btn-primary-lab text-base md:text-lg px-10 py-4 uppercase tracking-widest font-semibold"
            >
              Scopri il corso completo
            </Link>
          </motion.div>
        </div>
      </Section>

      {/* Footer minimo */}
      <div className="border-t border-border/30 py-8 px-6">
        <div className="container mx-auto max-w-3xl flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Modulo 01 — Perché la guida sicura
          </p>
          <Link to="/" className="text-xs text-primary hover:underline">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PercheLaGuidaSicura;
