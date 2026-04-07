import { motion } from "framer-motion";
import heroBg from "@/assets/perche-hero-bg.jpg";

const HeroPerche = () => (
  <section className="relative min-h-[85vh] flex items-end pb-24 overflow-hidden">
    <div className="absolute inset-0">
      <img
        src={heroBg}
        alt="Strada di montagna al tramonto"
        className="w-full h-full object-cover"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
    </div>
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
  </section>
);

export default HeroPerche;
