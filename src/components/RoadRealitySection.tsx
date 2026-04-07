import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, X } from "lucide-react";

const causes = [
  { label: "Distrazione", value: "15,7%" },
  { label: "Mancato rispetto precedenza", value: "13,5%" },
  { label: "Velocità", value: "8,6%" },
];

const cards = [
  { number: "173.364", label: "incidenti con lesioni" },
  { number: "3.030", label: "morti" },
  { number: "233.853", label: "feriti" },
  { number: "475/giorno", label: "incidenti medi" },
];

const RoadRealitySection = () => {
  const [activeCard, setActiveCard] = useState<number | null>(null);

  return (
    <section className="py-20 px-6 bg-background">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-4">
            I dati
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            La realtà della strada
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Non è un rischio raro. È la normalità.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {cards.map((card, i) => (
            <motion.button
              key={card.label}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveCard(activeCard === i ? null : i)}
              className={`relative p-6 rounded-lg border text-center cursor-pointer transition-colors duration-200 ${
                activeCard === i
                  ? "border-primary/60 bg-primary/5"
                  : "border-border/50 bg-card hover:border-primary/30"
              }`}
            >
              <span
                className={`block text-2xl md:text-3xl font-bold mb-1 ${
                  card.label === "morti"
                    ? "text-destructive"
                    : "text-primary"
                }`}
              >
                {card.number}
              </span>
              <span className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider">
                {card.label}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Expanded causes overlay */}
        <AnimatePresence>
          {activeCard !== null && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden mb-10"
            >
              <div className="rounded-lg border border-primary/20 bg-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                    Cause principali
                  </h3>
                  <button
                    onClick={() => setActiveCard(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  {causes.map((c) => (
                    <div
                      key={c.label}
                      className="flex-1 flex items-center justify-between sm:flex-col sm:items-center sm:text-center gap-2 py-2 px-3 rounded-md bg-background/50"
                    >
                      <span className="text-sm text-muted-foreground">
                        {c.label}
                      </span>
                      <span className="text-lg font-bold text-primary">
                        {c.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary text */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center text-sm md:text-base text-muted-foreground mb-10 max-w-lg mx-auto leading-relaxed"
        >
          Ogni 3 minuti avviene un incidente.
          <br />
          Ogni giorno: 8 morti e oltre 600 feriti.
        </motion.p>

        {/* ISTAT source */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center"
        >
          <p className="text-xs text-muted-foreground/60 mb-2">
            Fonte: ISTAT – ACI
          </p>
          <a
            href="https://www.istat.it/it/archivio/incidenti+stradali"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary/80 hover:text-primary transition-colors"
          >
            Visualizza infografica ufficiale
            <ExternalLink className="w-3 h-3" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default RoadRealitySection;
