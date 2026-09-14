import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const leve = [
  {
    id: "stato",
    label: "STATO",
    title: "Patente a punti (2003)",
    detail:
      "Regole più severe, sanzioni più incisive, controlli più frequenti. Lo Stato ha reso il comportamento a rischio costoso, spostando l'equilibrio verso la prudenza.",
  },
  {
    id: "industria",
    label: "INDUSTRIA",
    title: "Da ABS a ADAS obbligatori (2022-2024)",
    detail:
      "La tecnologia oggi interviene prima dell'errore: frenata automatica, mantenimento di corsia, assistenza alla distanza. L'industria ha imparato a costruire veicoli che aiutano a non sbagliare.",
  },
  {
    id: "educazione",
    label: "EDUCAZIONE",
    title: "Campagne e corsi come questo",
    detail:
      "Norme e sistemi contano, ma alla fine a guidare c'è una persona. La formazione cambia come guardiamo la strada, prima ancora di come la affrontiamo.",
  },
];

const TreLeve = () => {
  const [active, setActive] = useState<string | null>(null);

  const toggle = (id: string) => {
    setActive((prev) => (prev === id ? null : id));
  };

  return (
    <section className="min-h-screen w-full flex items-center py-24" style={{ backgroundColor: "hsl(var(--card))" }}>
      <div className="container mx-auto px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.7 }}
          className="mb-16 text-center"
        >
          <p className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-6">
            Le tre leve
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Come la strada è diventata più sicura
          </h2>
          <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            Nel 2001 l'Unione Europea si è posta un obiettivo: dimezzare i morti sulla strada.
            Da lì sono nate tre leve.
          </p>
        </motion.div>

        <div className="space-y-4 mb-16">
          {leve.map((leva, i) => {
            const isOpen = active === leva.id;
            return (
              <motion.div
                key={leva.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <button
                  onClick={() => toggle(leva.id)}
                  className={`w-full text-left rounded-lg border transition-all duration-300 ${
                    isOpen
                      ? "border-primary/60 bg-card/70"
                      : "border-border/60 bg-card/70 hover:border-primary/40"
                  }`}
                >
                  <div className="p-6 md:p-8 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-mono text-xs tracking-[0.25em] uppercase text-primary mb-2">
                        {leva.label}
                      </p>
                      <h3 className="text-lg md:text-2xl font-semibold text-foreground">
                        {leva.title}
                      </h3>
                    </div>
                    <div
                      className={`rounded-full p-2 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      <ChevronDown className="w-5 h-5 text-primary" />
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 md:px-8 md:pb-8 pt-0">
                          <div className="h-px bg-border/50 mb-6" />
                          <p className="text-foreground/70 leading-relaxed text-base md:text-lg max-w-2xl">
                            {leva.detail}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-center text-xl md:text-2xl font-semibold text-foreground"
        >
          Anche voi oggi siete dentro la{" "}
          <span className="text-primary">terza leva</span>.
        </motion.p>
      </div>
    </section>
  );
};

export default TreLeve;
