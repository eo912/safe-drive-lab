import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, X, ExternalLink } from "lucide-react";
import istatInfografica from "@/assets/istat-infografica.jpg";

const InfographicBlock = () => {
  const [zoomed, setZoomed] = useState(false);

  return (
    <section className="py-32 px-6" style={{ backgroundColor: "hsl(var(--card))" }}>
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-6"
        >
          <p className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-4">
            Dati ufficiali
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            I numeri reali
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl">
            Questi sono i dati reali. Guardali con attenzione.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="my-16"
        >
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-center"
        >
          <a
            href="https://www.istat.it/infografiche/infografica-sugli-incidenti-stradali-anno-2024/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline-lab inline-flex items-center gap-2"
          >
            Approfondisci dati ufficiali ISTAT
            <ExternalLink className="w-4 h-4" />
          </a>
        </motion.div>
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

export default InfographicBlock;
