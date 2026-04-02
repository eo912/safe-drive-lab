import { motion } from "framer-motion";
import { GitBranch, Eye, Lightbulb } from "lucide-react";

const steps = [
  { icon: GitBranch, label: "Decisione", desc: "Ogni scenario parte da una scelta. La tua." },
  { icon: Eye, label: "Conseguenza", desc: "Vedi cosa succede. Senza filtri." },
  { icon: Lightbulb, label: "Comprensione", desc: "Capisci il perché. Per non ripeterlo." },
];

const MethodSection = () => {
  return (
    <section className="section-full py-24 px-6">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <p className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-4">
            Il metodo
          </p>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">
            Non ti diciamo cosa fare.
          </h2>
          <p className="text-xl md:text-2xl font-light text-muted-foreground">
            Ti facciamo vedere cosa succede.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="card-lab text-center group"
            >
              <div className="w-14 h-14 rounded-full border border-primary/30 flex items-center justify-center mx-auto mb-5 transition-colors group-hover:border-primary/60 group-hover:bg-primary/5">
                <step.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-mono text-sm tracking-widest uppercase text-primary mb-3">
                {step.label}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Flow line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
          className="hidden md:block glow-line mt-12"
        />
      </div>
    </section>
  );
};

export default MethodSection;
