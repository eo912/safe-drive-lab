import { motion } from "framer-motion";

const HeroPercheUnCorso = () => {
  return (
    <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: "hsl(var(--primary))" }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-5 blur-3xl" style={{ background: "hsl(var(--primary))" }} />
      </div>

      <div className="relative z-10 container mx-auto px-6 max-w-3xl text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-8"
        >
          Modulo 01
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-8 leading-[1.1]"
        >
          Perché facciamo un corso di guida sicura
        </motion.h1>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="glow-line max-w-xs mx-auto mb-10"
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed mb-6"
        >
          La guida sicura non è saper reagire bene a un'emergenza.
          <br />
          <span className="text-foreground font-medium">È non arrivarci mai.</span>
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed"
        >
          Un corso costruito solo su manovre estreme dà un falso senso di controllo.
          Qui partiamo da un'idea diversa: prevenire prima che serva reagire.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-px h-12 bg-gradient-to-b from-primary/60 to-transparent animate-pulse-glow" />
      </motion.div>
    </section>
  );
};

export default HeroPercheUnCorso;
