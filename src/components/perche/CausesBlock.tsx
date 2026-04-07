import { motion } from "framer-motion";
import distractionImg from "@/assets/cause-distraction.jpg";
import precedenzaImg from "@/assets/cause-precedenza.jpg";
import speedImg from "@/assets/cause-speed.jpg";

const causes = [
  {
    cause: "Distrazione",
    pct: 15.7,
    interpretation: "Attenzione persa",
    img: distractionImg,
    alt: "Smartphone sul cruscotto di un'auto",
  },
  {
    cause: "Mancata precedenza",
    pct: 13.5,
    interpretation: "Errore di valutazione",
    img: precedenzaImg,
    alt: "Incrocio trafficato visto dall'interno dell'auto",
  },
  {
    cause: "Velocità",
    pct: 8.6,
    interpretation: "Spazio insufficiente",
    img: speedImg,
    alt: "Guida veloce in autostrada",
  },
];

const CausesBlock = () => (
  <section className="py-32 px-6">
    <div className="container mx-auto max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="mb-20"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Perché succede davvero
        </h2>
        <p className="text-muted-foreground text-lg">
          Non è la strada. È come si guida.
        </p>
      </motion.div>

      <div className="space-y-24">
        {causes.map((c, i) => (
          <motion.div
            key={c.cause}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: i * 0.1 }}
            className={`flex flex-col ${i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"} gap-8 md:gap-12 items-center`}
          >
            <div className="w-full md:w-1/2 rounded-lg overflow-hidden aspect-[4/3]">
              <img
                src={c.img}
                alt={c.alt}
                loading="lazy"
                width={800}
                height={600}
                className="w-full h-full object-cover grayscale-[30%] opacity-80"
              />
            </div>
            <div className="w-full md:w-1/2">
              <p className="font-mono text-5xl md:text-6xl font-bold text-primary mb-3">
                {c.pct}%
              </p>
              <p className="text-2xl font-semibold text-foreground mb-2">{c.cause}</p>
              <p className="text-muted-foreground text-lg">{c.interpretation}</p>
              <div className="mt-6 h-2 rounded-full bg-secondary overflow-hidden max-w-xs">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(c.pct / 20) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default CausesBlock;
