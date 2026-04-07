import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, AlertTriangle, Clock, TrendingUp, Users, Briefcase, Heart, Scale, Brain, ExternalLink, ZoomIn, X } from "lucide-react";
import { Link } from "react-router-dom";
import istatInfografica from "@/assets/istat-infografica.jpg";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7 },
};

const stats = [
  { value: "173.364", label: "incidenti", icon: AlertTriangle },
  { value: "3.030", label: "morti", icon: Users },
  { value: "233.853", label: "feriti", icon: Heart },
  { value: "475", label: "al giorno", icon: Clock },
];

const impacts = [
  { icon: Briefcase, text: "Perdita della capacità lavorativa" },
  { icon: Heart, text: "Costi sanitari a lungo termine" },
  { icon: Users, text: "Impatto sulle famiglie" },
  { icon: Scale, text: "Conseguenze legali e gestionali" },
];

const causes = [
  { cause: "Distrazione", pct: 15.7, color: "hsl(var(--primary))" },
  { cause: "Mancata precedenza", pct: 13.5, color: "hsl(var(--accent))" },
  { cause: "Velocità", pct: 8.6, color: "hsl(0 70% 55%)" },
];

const PercheLaGuidaSicura = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Back nav */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-border/50" style={{ backgroundColor: "hsl(220 20% 7% / 0.9)", backdropFilter: "blur(12px)" }}>
        <div className="container mx-auto flex items-center h-16 px-6">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span>Torna alla home</span>
          </Link>
        </div>
      </div>

      {/* 1. HEADER */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.p {...fadeUp} className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-6">
            Modulo 01
          </motion.p>
          <motion.h1 {...fadeUp} transition={{ duration: 0.7, delay: 0.1 }} className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            La realtà della strada
          </motion.h1>
          <motion.p {...fadeUp} transition={{ duration: 0.7, delay: 0.2 }} className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Non è un rischio raro. È qualcosa che succede ogni giorno.
          </motion.p>
        </div>
      </section>

      <div className="glow-line" />

      {/* 2. BLOCCO DATI */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="text-center p-6 rounded-lg border border-border/50 bg-card"
              >
                <s.icon className="w-6 h-6 text-primary mx-auto mb-4 opacity-70" />
                <p className="text-3xl md:text-4xl font-bold text-foreground mb-2">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>
          <motion.p
            {...fadeUp}
            className="text-center text-xl md:text-2xl font-semibold text-foreground"
          >
            Ogni <span className="text-primary">3 minuti</span> succede.
          </motion.p>
        </div>
      </section>

      {/* 3. BLOCCO INFOGRAFICA ISTAT */}
      <IstatSection />

      {/* 4. BLOCCO SIGNIFICATO */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-3xl">
          <motion.h2 {...fadeUp} className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
            Un incidente non è solo un numero
          </motion.h2>
          <div className="grid sm:grid-cols-2 gap-5 mb-16">
            {impacts.map((item, i) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex items-start gap-4 p-6 rounded-lg border border-border/50 bg-card"
              >
                <item.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
              </motion.div>
            ))}
          </div>
          <motion.p
            {...fadeUp}
            className="text-center text-lg md:text-xl text-foreground font-medium italic"
          >
            "Un incidente continua anche dopo che è finito."
          </motion.p>
        </div>
      </section>

      <div className="glow-line" />

      {/* 5. BLOCCO COSTI */}
      <section className="py-28 px-6" style={{ backgroundColor: "hsl(220 18% 9%)" }}>
        <div className="container mx-auto max-w-3xl text-center">
          <motion.p {...fadeUp} className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-8">
            Il costo reale
          </motion.p>
          <motion.p
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground mb-6"
          >
            18,2 <span className="text-primary">miliardi €</span>
          </motion.p>
          <motion.p {...fadeUp} transition={{ duration: 0.7, delay: 0.2 }} className="text-lg md:text-xl text-muted-foreground mb-4">
            Costo annuale degli incidenti stradali in Italia
          </motion.p>
          <motion.p {...fadeUp} transition={{ duration: 0.7, delay: 0.3 }} className="text-sm text-muted-foreground">
            Circa l'<span className="text-foreground font-semibold">1% del PIL</span>
          </motion.p>
        </div>
      </section>

      {/* 6. BLOCCO CAUSE */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-3xl">
          <motion.h2 {...fadeUp} className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-center">
            Perché succede
          </motion.h2>
          <motion.p {...fadeUp} transition={{ delay: 0.1 }} className="text-center text-muted-foreground mb-16">
            Le prime tre cause di incidente in Italia
          </motion.p>

          <div className="space-y-8 mb-16">
            {causes.map((c, i) => (
              <motion.div
                key={c.cause}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
              >
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-foreground font-semibold">{c.cause}</span>
                  <span className="font-mono text-2xl md:text-3xl font-bold" style={{ color: c.color }}>
                    {c.pct}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: c.color }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(c.pct / 20) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.2 + i * 0.12, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          <motion.p
            {...fadeUp}
            className="text-center text-lg md:text-xl text-foreground font-medium"
          >
            Non è la strada. <span className="text-primary">È il comportamento.</span>
          </motion.p>
        </div>
      </section>

      <div className="glow-line" />

      {/* 7. TRANSIZIONE */}
      <section className="py-28 px-6">
        <div className="container mx-auto max-w-2xl text-center">
          <motion.p {...fadeUp} className="text-muted-foreground mb-8 text-lg">
            Se il problema è umano, la soluzione parte da chi guida.
          </motion.p>
          <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
            <Link to="/il-conducente" className="btn-primary-lab">
              <Brain className="w-5 h-5 mr-2 inline-block" />
              Scopri il fattore umano
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer minimo */}
      <div className="border-t border-border/50 py-8 px-6">
        <div className="container mx-auto max-w-3xl flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Modulo 01 — Perché la guida sicura</p>
          <Link to="/" className="text-xs text-primary hover:underline">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PercheLaGuidaSicura;
