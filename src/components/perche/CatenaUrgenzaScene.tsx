import { useState } from "react";
import { motion } from "framer-motion";

import familiarRoad from "@/assets/familiar-road.jpg";

type Nodo = {
  n: number;
  testo: string;
  interrompe: string;
  prosegue: string;
  /** Testo neutro mostrato quando si sceglie di proseguire. */
  neutro: string;
  /** Spiegazione se è questa la scelta che ha rotto la catena. */
  rottura: string;
};

const NODI: Nodo[] = [
  {
    n: 1,
    testo: "Sono le 22. Mancano 40 minuti a casa.",
    interrompe: "Mi fermo 10 minuti a riposare",
    prosegue: "Continuo, tanto manca poco",
    neutro: "Prosegui. La strada è tranquilla, non succede niente.",
    rottura: "Fermarti dieci minuti ha rotto la catena: sei ripartito con più margine.",
  },
  {
    n: 2,
    testo: "Questo tratto lo fai talmente tante volte che ormai è automatico.",
    interrompe: "Mantengo la stessa attenzione di sempre",
    prosegue: "Il pilota automatico mentale prende il sopravvento",
    neutro: "Anche stavolta fila tutto liscio. Come sempre.",
    rottura: "Tenere alta l'attenzione su una strada nota ha rotto la catena.",
  },
];

type Esito = null | "sereno" | "incidente";

/**
 * Scena interattiva "La catena dell'urgenza".
 * Ritmo a tappe: proseguire non produce nulla di negativo sul momento.
 * Solo due "prosegue" consecutivi portano all'esito improvviso.
 */
export const CatenaUrgenzaScene = () => {
  const [attivo, setAttivo] = useState(1);
  const [esito, setEsito] = useState<Esito>(null);
  const [rottura, setRottura] = useState<string | null>(null);
  const [neutro, setNeutro] = useState<string | null>(null);

  const reset = () => {
    setAttivo(1);
    setEsito(null);
    setRottura(null);
    setNeutro(null);
  };

  const nodoCorrente = NODI[attivo - 1];

  const avanza = (esitoFinale: Esito) => {
    if (attivo < NODI.length) {
      setAttivo(attivo + 1);
    } else {
      setEsito(esitoFinale);
    }
  };

  const interrompi = () => {
    if (!rottura) setRottura(nodoCorrente.rottura);
    setNeutro(null);
    avanza("sereno");
  };

  const prosegui = () => {
    setNeutro(nodoCorrente.neutro);
    avanza(rottura ? "sereno" : "incidente");
  };

  const statoNodo = (n: number) => {
    if (esito !== null) return esito === "incidente" && n === NODI.length ? "fallito" : "fatto";
    if (n < attivo) return "fatto";
    if (n === attivo) return "attivo";
    return "neutro";
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Sfondo unico, atmosfera sera */}
      <div className="absolute inset-0" aria-hidden>
        <img
          src={familiarRoad}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/60" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 w-full max-w-5xl px-8">
        <p className="font-mono text-sm uppercase tracking-wide text-primary text-center">
          Ogni anello rotto in tempo è un incidente evitato
        </p>

        {/* Timeline nodi */}
        <div className="relative mt-10">
          <div className="absolute left-[25%] right-[25%] top-7 h-px bg-border/60" aria-hidden />
          <div className="relative grid grid-cols-2 gap-6">
            {NODI.map((nodo) => {
              const st = statoNodo(nodo.n);
              const ring =
                st === "attivo"
                  ? "border-primary bg-primary/15 text-primary"
                  : st === "fatto"
                    ? "border-border bg-card text-foreground/70"
                    : st === "fallito"
                      ? "border-destructive bg-destructive/15 text-destructive"
                      : "border-border/60 bg-card/60 text-muted-foreground";
              return (
                <div key={nodo.n} className="flex flex-col items-center text-center">
                  <div
                    className={`w-14 h-14 rounded-full border-2 flex items-center justify-center font-mono text-lg font-bold ${ring}`}
                  >
                    {nodo.n}
                  </div>
                  <p className="mt-4 text-sm md:text-base leading-snug text-foreground/80 px-2">
                    {nodo.testo}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Area fissa: scelta o esito */}
        <div className="mt-10 min-h-[200px] rounded-lg border border-border/60 bg-card/70 px-6 py-7 flex flex-col items-center justify-center text-center">
          {esito === null && (
            <motion.div
              key={attivo}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {neutro && (
                <p className="mb-5 text-sm md:text-base text-muted-foreground">{neutro}</p>
              )}
              <p className="text-lg md:text-2xl font-medium leading-snug max-w-3xl mx-auto">
                {nodoCorrente.testo}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={interrompi}
                  className="rounded-md border border-primary/60 bg-primary/10 px-5 py-3 text-sm md:text-base font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  {nodoCorrente.interrompe}
                </button>
                <button
                  type="button"
                  onClick={prosegui}
                  className="rounded-md border border-border/70 bg-card px-5 py-3 text-sm md:text-base font-medium text-foreground/80 hover:border-border transition-colors"
                >
                  {nodoCorrente.prosegue}
                </button>
              </div>
            </motion.div>
          )}

          {esito === "sereno" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <p className="text-2xl md:text-4xl font-bold text-primary">A casa. Sano e salvo.</p>
              <p className="mt-4 text-base md:text-lg text-foreground/80 max-w-3xl mx-auto leading-snug">
                {rottura}
              </p>
            </motion.div>
          )}

          {esito === "incidente" && (
            <div className="w-full">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.05 }}
                className="text-5xl md:text-7xl font-bold text-destructive leading-none"
              >
                Tac.
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.05, delay: 0.15 }}
                className="mt-5 text-2xl md:text-4xl font-bold text-foreground"
              >
                Incidente.
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.6 }}
                className="mt-4 text-base md:text-lg text-foreground/70 max-w-3xl mx-auto leading-snug"
              >
                Nessun anello si è rotto in tempo.
              </motion.p>
            </div>
          )}
        </div>

        {esito !== null && (
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={reset}
              className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Ricomincia
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
