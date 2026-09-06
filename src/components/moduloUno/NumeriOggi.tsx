import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, X, ExternalLink } from "lucide-react";
import istatInfografica from "@/assets/istat-infografica.jpg";

const NumeriOggi = () => {
  const [zoomed, setZoomed] = useState(false);

  return (
    <section className="min-h-screen w-full flex items-center py-24 bg-background">
      <div className="container mx-auto px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.7 }}
          className="mb-16 text-center"
        >
          <p className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-6">
            I numeri di oggi
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Più traffico, meno vittime
          </h2>
          <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            Il parco circolante è cresciuto, ma il numero di morti è sceso. La strada è oggettivamente più sicura di vent'anni fa.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="grid md:grid-cols-2 gap-6 mb-20"
        >
          <div className="rounded-lg border border-border/60 bg-card/70 p-8 text-center">
            <p className="font-mono text-xs tracking-[0.25em] uppercase text-muted-foreground mb-4">
              Veicoli circolanti
            </p>
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="text-3xl md:text-4xl font-bold text-foreground/40">32,5M</span>
              <span className="text-primary text-xl">→</span>
              <span className="text-3xl md:text-4xl font-bold text-foreground">41,3M</span>
            </div>
            <p className="text-sm text-muted-foreground">Più veicoli su strada</p>
          </div>

          <div className="rounded-lg border border-border/60 bg-card/70 p-8 text-center">
            <p className="font-mono text-xs tracking-[0.25em] uppercase text-muted-foreground mb-4">
              Morti per incidente
            </p>
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="text-3xl md:text-4xl font-bold text-foreground/40">7.000</span>
              <span className="text-primary text-xl">→</span>
              <span className="text-3xl md:text-4xl font-bold text-foreground">3.030</span>
            </div>
            <p className="text-sm text-muted-foreground">Meno della metà</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mb-10"
        >
          <p className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-4 text-center">
            Dati ufficiali
          </p>
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4 text-center">
            I numeri reali
          </h3>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto text-center mb-12">
            Questi sono i dati reali. Guardali con attenzione.
          </p>

          <div
            className="relative rounded-lg overflow-hidden border border-border/30 cursor-pointer group max-w-2xl mx-auto"
            onClick={() => setZoomed(true)}
          >
            <img
              src={istatInfografica}
              alt="Infografica ISTAT – Incidenti stradali in Italia 2024"
              loading="lazy"
              width={1024}
              height={1440}
              className="w-full h-auto"
            />
            <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded-full p-3">
                <ZoomIn className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">
            Fonte: ISTAT – ACI
          </p>

          <div className="text-center mt-8">
            <a
              href="https://www.istat.it/infografiche/infografica-sugli-incidenti-stradali-anno-2024/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline-lab inline-flex items-center gap-2"
            >
              Approfondisci dati ufficiali ISTAT
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="text-center text-xl md:text-2xl font-semibold text-foreground max-w-2xl mx-auto leading-relaxed"
        >
          La strada è più sicura di ieri, ma il lavoro non è finito,
          <br />
          ed è anche per questo che <span className="text-primary">siete qui</span>.
        </motion.p>
      </div>

      <AnimatePresence>
        {zoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/95 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setZoomed(false)}
          >
            <button
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setZoomed(false)}
            >
              <X className="w-8 h-8" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={istatInfografica}
              alt="Infografica ISTAT – Incidenti stradali in Italia 2024"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default NumeriOggi;
