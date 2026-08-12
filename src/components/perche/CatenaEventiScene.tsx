import { motion } from "framer-motion";
import type { AulaStep } from "@/lib/aulaSync";

import intersection from "@/assets/stat-intersection.jpg";
import causeSpeed from "@/assets/cause-speed.jpg";
import causeDistraction from "@/assets/cause-distraction.jpg";
import causePrecedenza from "@/assets/cause-precedenza.jpg";

type RenderLevel = "full" | "live" | "preview";

type Props = {
  step: AulaStep;
  level?: RenderLevel;
};

/**
 * Scena "Un incidente è una catena di eventi" — Modulo 01 (Cultura della Sicurezza).
 *
 * Contenuto interamente dipendente dallo step inviato dalla regia
 * (intro → scenario → esiti → spiegazione → approfondimento).
 * Nessuna interazione richiesta agli allievi: l'istruttore conduce il debrief.
 * Layout 16:9 da proiettore, senza scroll interno.
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

const ANELLI = [
  { n: "01", t: "Velocità leggermente inadeguata", img: causeSpeed, alt: "Velocità" },
  { n: "02", t: "Attenzione che cala", img: causeDistraction, alt: "Distrazione" },
  { n: "03", t: "Osservazione tardiva", img: causePrecedenza, alt: "Mancata precedenza" },
  { n: "04", t: "Frenata tardiva", img: null, alt: "" },
];

export const CatenaEventiScene = ({ step, level = "full" }: Props) => {
  /* ---------------- INTRO ---------------- */
  if (step === "intro") {
    return (
      <>
        <Bg src={intersection} alt="Incrocio" opacity="opacity-[0.18]" level={level} />
        <div className="relative z-10 text-center px-8 max-w-5xl">
          <motion.h2
            {...appear(0.3)}
            className="text-4xl md:text-7xl font-bold leading-[1.05]"
          >
            Un incidente è una catena di eventi
          </motion.h2>
          <motion.p
            {...appear(0.9)}
            className="mt-8 text-xl md:text-3xl font-medium text-primary"
          >
            Quasi mai comincia con l'impatto.
          </motion.p>
        </div>
      </>
    );
  }

  /* ---------------- SCENARIO ---------------- */
  if (step === "scenario") {
    return (
      <>
        <Bg src={intersection} alt="Incrocio" opacity="opacity-[0.08]" level={level} />
        <div className="relative z-10 w-full max-w-6xl px-10">
          <motion.p
            {...appear(0.2)}
            className="font-mono text-xs tracking-[0.3em] uppercase text-primary"
          >
            La sequenza
          </motion.p>

          <div className="mt-6 grid grid-cols-4 gap-3 md:gap-4">
            {ANELLI.map((a, i) => (
              <motion.div
                key={a.n}
                {...appear(0.5 + i * 0.2)}
                className="rounded-lg border border-border/60 bg-card/70 backdrop-blur-sm overflow-hidden"
              >
                {a.img && level !== "preview" ? (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={a.img}
                      alt={a.alt}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover grayscale-[60%] opacity-40"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/9] bg-muted/20" aria-hidden />
                )}
                <div className="px-4 py-4 md:px-5 md:py-5">
                  <p className="font-mono text-xs tracking-[0.3em] text-primary mb-2">
                    {a.n}
                  </p>
                  <p className="text-sm md:text-lg font-medium leading-snug text-foreground/90">
                    {a.t}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.h3
            {...appear(1.4)}
            className="mt-8 text-xl md:text-3xl font-bold leading-tight max-w-4xl"
          >
            Quale di questi anelli, secondo voi, poteva essere interrotto per primo?
          </motion.h3>
        </div>
      </>
    );
  }

  /* ---------------- ESITI ---------------- */
  if (step === "esiti") {
    const rotture = [
      "ridurre prima la velocità",
      "rialzare l'attenzione",
      "osservare prima",
      "frenare con più margine",
    ];
    return (
      <>
        <Bg src={causeSpeed} alt="Velocità" opacity="opacity-[0.08]" level={level} />
        <div className="relative z-10 w-full max-w-6xl px-10">
          <motion.p
            {...appear(0.2)}
            className="text-2xl md:text-4xl font-semibold leading-snug max-w-4xl"
          >
            Non c'è un unico punto possibile.
          </motion.p>

          <div className="mt-10 flex flex-wrap items-center gap-3 md:gap-4">
            {rotture.map((r, i) => (
              <motion.div key={r} {...appear(0.7 + i * 0.3)} className="flex items-center gap-3 md:gap-4">
                {i > 0 && <span className="text-primary/70 text-xl md:text-2xl">→</span>}
                <span className="rounded-md border border-primary/50 bg-primary/5 px-4 py-2 md:px-5 md:py-3 text-sm md:text-lg font-medium">
                  {r}
                </span>
              </motion.div>
            ))}
          </div>

          <motion.p
            {...appear(2.1)}
            className="mt-10 text-lg md:text-2xl font-semibold text-primary leading-snug max-w-4xl"
          >
            Ogni anello lasciato intatto riduce il margine del successivo.
          </motion.p>
        </div>
      </>
    );
  }

  /* ---------------- SPIEGAZIONE ---------------- */
  if (step === "spiegazione") {
    const cols = [
      {
        t: "Lettura sbagliata",
        items: ["È successo tutto all'improvviso", "Non potevo farci niente", "È stato un solo errore"],
        accent: false,
      },
      {
        t: "Lettura utile",
        items: ["Cosa è successo prima?", "Quale margine si è ridotto?", "Dove potevo intervenire?"],
        accent: true,
      },
    ];
    return (
      <>
        <div className="absolute inset-0 bg-[hsl(220_20%_5%)]" aria-hidden />
        <div className="relative z-10 w-full max-w-5xl px-10 text-center">
          <motion.h2 {...appear(0.2)} className="text-3xl md:text-5xl font-bold leading-tight">
            Non cercare il colpevole.{" "}
            <span className="text-primary">Cerca il primo punto utile.</span>
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
                    <li key={it} className="text-base md:text-xl font-medium text-foreground/90">
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
            La sicurezza nasce prima dell'emergenza.
          </motion.p>
        </div>
      </>
    );
  }

  /* ---------------- APPROFONDIMENTO ---------------- */
  return (
    <>
      <Bg src={causeDistraction} alt="Distrazione" opacity="opacity-[0.08]" level={level} />
      <div className="relative z-10 w-full max-w-6xl px-10">
        <motion.h2 {...appear(0.2)} className="text-3xl md:text-5xl font-bold leading-tight">
          Rompi un anello
        </motion.h2>

        <div className="mt-8 grid grid-cols-4 gap-3 md:gap-4">
          {ANELLI.map((a, i) => (
            <motion.div
              key={a.n}
              {...appear(0.5 + i * 0.18)}
              className="rounded-md border border-border/60 bg-card/70 px-4 py-5 md:px-5 md:py-6"
              aria-hidden
            >
              <p className="font-mono text-xs tracking-[0.3em] text-primary mb-2">{a.n}</p>
              <p className="text-sm md:text-lg font-medium leading-snug text-foreground/90">
                {a.t}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.p
          {...appear(1.3)}
          className="mt-8 text-lg md:text-2xl font-medium text-primary leading-snug max-w-4xl"
        >
          Se potessi cambiare una sola cosa, quale sceglieresti? Perché?
        </motion.p>

        <motion.p
          {...appear(1.8)}
          className="mt-8 text-base md:text-2xl font-semibold text-foreground/85 leading-snug max-w-4xl"
        >
          La sicurezza non elimina ogni errore. Crea più occasioni per fermarlo prima.
        </motion.p>
      </div>
    </>
  );
};
