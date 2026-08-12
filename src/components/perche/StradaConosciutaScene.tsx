import { motion } from "framer-motion";
import type { AulaStep } from "@/lib/aulaSync";

import familiarRoad from "@/assets/familiar-road.jpg";
import routineDriving from "@/assets/routine-driving.jpg";

type RenderLevel = "full" | "live" | "preview";

type Props = {
  step: AulaStep;
  level?: RenderLevel;
};

/**
 * Scena "Una strada conosciuta" — Modulo 01 (Cultura della Sicurezza).
 *
 * Unica section Aula il cui contenuto dipende interamente dallo step corrente
 * inviato dalla regia (intro → scenario → esiti → spiegazione → approfondimento).
 * Nessuna interazione richiesta agli allievi: l'istruttore conduce.
 * Layout pensato per proiettore 16:9, senza scroll interno.
 */
const Bg = ({
  src,
  alt,
  opacity,
  level,
}: {
  src: string;
  alt: string;
  opacity: string;
  level: RenderLevel;
}) => {
  if (level === "preview") {
    return <div className="absolute inset-0 bg-card" aria-hidden />;
  }
  return (
    <div className="absolute inset-0">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`w-full h-full object-cover ${opacity}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/50" />
    </div>
  );
};

const appear = (delay: number) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.4, delay },
});

export const StradaConosciutaScene = ({ step, level = "full" }: Props) => {
  /* ---------------- INTRO ---------------- */
  if (step === "intro") {
    return (
      <>
        <Bg src={familiarRoad} alt="Strada familiare" opacity="opacity-30" level={level} />
        <div className="relative z-10 text-center px-8 max-w-4xl">
          <motion.h2
            {...appear(0.3)}
            className="text-5xl md:text-7xl font-bold leading-[1.05]"
          >
            Una strada conosciuta
          </motion.h2>
          <motion.p
            {...appear(0.9)}
            className="mt-8 text-xl md:text-3xl font-medium text-primary"
          >
            È proprio lì che smetti di guardare davvero.
          </motion.p>
        </div>
      </>
    );
  }

  /* ---------------- SCENARIO ---------------- */
  if (step === "scenario") {
    const options = [
      { k: "A", t: "Andare un po' più veloce del solito" },
      { k: "B", t: "Distrarsi per eccesso di confidenza" },
      { k: "C", t: "Un problema improvviso del veicolo" },
    ];
    return (
      <>
        <Bg src={routineDriving} alt="Guida di routine" opacity="opacity-[0.12]" level={level} />
        <div className="relative z-10 w-full max-w-6xl px-10">
          <motion.p
            {...appear(0.2)}
            className="text-base md:text-xl leading-relaxed text-foreground/80 max-w-4xl"
          >
            È mattina. Percorri una strada che conosci molto bene. La fai quasi ogni
            giorno. Poco traffico. Nessuna situazione apparentemente critica. Hai un
            leggero ritardo. Ti senti tranquillo perché “tanto la strada la conosco”.
          </motion.p>

          <motion.h3
            {...appear(0.6)}
            className="mt-8 text-2xl md:text-4xl font-bold leading-tight"
          >
            Qual è il rischio più probabile in questo momento?
          </motion.h3>

          <div className="mt-8 grid grid-cols-3 gap-4 md:gap-6">
            {options.map((o, i) => (
              <motion.div
                key={o.k}
                {...appear(0.9 + i * 0.15)}
                className="rounded-lg border border-border/60 bg-card/70 backdrop-blur-sm px-5 py-6 md:px-6 md:py-8"
              >
                <p className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-3">
                  {o.k}
                </p>
                <p className="text-base md:text-xl font-medium leading-snug text-foreground/90">
                  {o.t}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </>
    );
  }

  /* ---------------- ESITI ---------------- */
  if (step === "esiti") {
    const chain = [
      "Il cervello anticipa",
      "Osserva meno",
      "Controlla meno",
      "Reagisce più tardi",
    ];
    return (
      <>
        <Bg src={familiarRoad} alt="Strada familiare" opacity="opacity-[0.08]" level={level} />
        <div className="relative z-10 w-full max-w-6xl px-10">
          <motion.div {...appear(0.2)} className="flex items-center gap-4">
            <span className="font-mono text-lg md:text-2xl font-bold text-primary border border-primary/60 rounded-md px-3 py-1">
              B
            </span>
            <span className="font-mono text-xs md:text-sm tracking-[0.3em] uppercase text-primary">
              Risposta più corretta
            </span>
          </motion.div>

          <motion.p
            {...appear(0.5)}
            className="mt-6 text-2xl md:text-4xl font-semibold leading-snug max-w-4xl"
          >
            Il rischio più probabile è la riduzione dell'attenzione dovuta alla
            familiarità.
          </motion.p>

          <div className="mt-10 flex flex-wrap items-center gap-3 md:gap-4">
            {chain.map((c, i) => (
              <motion.div key={c} {...appear(0.9 + i * 0.25)} className="flex items-center gap-3 md:gap-4">
                {i > 0 && <span className="text-primary/70 text-xl md:text-2xl">→</span>}
                <span className="rounded-md border border-border/60 bg-card/70 px-4 py-2 md:px-5 md:py-3 text-sm md:text-lg font-medium">
                  {c}
                </span>
              </motion.div>
            ))}
          </div>

          <motion.p
            {...appear(2.0)}
            className="mt-10 text-lg md:text-2xl font-semibold text-primary leading-snug max-w-4xl"
          >
            La familiarità non aumenta sempre la sicurezza. Spesso abbassa la soglia di
            attenzione.
          </motion.p>
        </div>
      </>
    );
  }

  /* ---------------- SPIEGAZIONE ---------------- */
  if (step === "spiegazione") {
    const cols = [
      { t: "Esperienza", items: ["osserva meglio", "anticipa", "mantiene margine"], accent: true },
      { t: "Abitudine", items: ["semplifica", "automatizza", "abbassa l'attenzione"], accent: false },
    ];
    return (
      <>
        <div className="absolute inset-0 bg-[hsl(220_20%_5%)]" aria-hidden />
        <div className="relative z-10 w-full max-w-5xl px-10 text-center">
          <motion.h2 {...appear(0.2)} className="text-3xl md:text-5xl font-bold leading-tight">
            Non è esperienza. <span className="text-primary">È abitudine.</span>
          </motion.h2>

          <div className="mt-10 grid grid-cols-2 gap-6 md:gap-10 text-left">
            {cols.map((c, i) => (
              <motion.div
                key={c.t}
                {...appear(0.6 + i * 0.25)}
                className={`rounded-lg border px-6 py-7 md:px-8 md:py-9 ${
                  c.accent ? "border-primary/50 bg-primary/5" : "border-border/60 bg-card/60"
                }`}
              >
                <p
                  className={`font-mono text-xs tracking-[0.3em] uppercase mb-5 ${
                    c.accent ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {c.t}
                </p>
                <ul className="space-y-3">
                  {c.items.map((it) => (
                    <li key={it} className="text-base md:text-2xl font-medium text-foreground/90">
                      {it}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <motion.p
            {...appear(1.3)}
            className="mt-10 text-base md:text-2xl font-semibold text-foreground/85 leading-snug"
          >
            L'esperienza ti rende più capace. L'abitudine, se non la controlli, ti rende
            meno presente.
          </motion.p>
        </div>
      </>
    );
  }

  /* ---------------- APPROFONDIMENTO ---------------- */
  const spunti = [
    "alzare lo scanning visivo",
    "non dare per scontati incroci e accessi laterali",
    "cercare ciò che normalmente non guardi più",
    "mantenere margine anche quando tutto sembra prevedibile",
  ];
  return (
    <>
      <Bg src={routineDriving} alt="Guida di routine" opacity="opacity-[0.1]" level={level} />
      <div className="relative z-10 w-full max-w-5xl px-10">
        <motion.h2 {...appear(0.2)} className="text-3xl md:text-5xl font-bold leading-tight">
          Dove si rompe il margine?
        </motion.h2>

        <motion.p
          {...appear(0.5)}
          className="mt-5 text-lg md:text-2xl font-medium text-primary leading-snug max-w-4xl"
        >
          Su una strada conosciuta, cosa dovresti fare in più per non guidare in
          automatico?
        </motion.p>

        <ul className="mt-8 space-y-3 md:space-y-4">
          {spunti.map((s, i) => (
            <motion.li
              key={s}
              {...appear(0.9 + i * 0.2)}
              className="flex items-start gap-4 text-base md:text-2xl text-foreground/90"
            >
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span>{s}</span>
            </motion.li>
          ))}
        </ul>

        <motion.p
          {...appear(1.9)}
          className="mt-10 text-base md:text-2xl font-semibold text-foreground/85"
        >
          Conoscere la strada non significa che la strada sia rimasta uguale.
        </motion.p>
      </div>
    </>
  );
};
