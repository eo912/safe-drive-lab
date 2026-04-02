import { motion } from "framer-motion";
import { Monitor, ShieldAlert, Brain } from "lucide-react";

const features = [
  {
    icon: Monitor,
    title: "Scenari reali",
    desc: "Situazioni ricostruite da dati reali di incidenti stradali. Nessuna simulazione generica.",
  },
  {
    icon: ShieldAlert,
    title: "Errori senza rischio",
    desc: "Sbagli in ambiente controllato. Comprendi le conseguenze prima che accadano.",
  },
  {
    icon: Brain,
    title: "Apprendimento attivo",
    desc: "Non guardi. Partecipi. Ogni modulo richiede una tua decisione.",
  },
];

const ExperienceSection = () => {
  return (
    <section className="section-full py-24 px-6" style={{ backgroundColor: "hsl(220 18% 9%)" }}>
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-4">
            L'esperienza
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Una piattaforma. Non una lezione.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="relative p-8 rounded-lg border border-border/50 bg-background/50 group hover:border-primary/30 transition-all duration-500"
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/0 to-transparent group-hover:via-primary/40 transition-all duration-500" />
              <f.icon className="w-8 h-8 text-primary/70 mb-6 group-hover:text-primary transition-colors" />
              <h3 className="text-lg font-semibold text-foreground mb-3">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;
