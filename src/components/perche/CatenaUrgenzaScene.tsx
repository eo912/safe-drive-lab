import { useState } from "react";
import { motion } from "framer-motion";

type Nodo = {
  n: number;
  testo: string;
  interrompe: string;
  prosegue: string;
};

const NODI: Nodo[] = [
  {
    n: 1,
    testo: "Sono le 22. Hai guidato tutto il giorno. Mancano 40 minuti a casa.",
    interrompe: "Mi fermo 10 minuti a riposare",
    prosegue: "Continuo, tanto manca poco",
  },
  {
    n: 2,
    testo: "Il telefono vibra. È una chiamata che aspettavi, importante.",
    interrompe: "Aspetto di fermarmi per rispondere",
    prosegue: "Rispondo subito, anche in movimento",
  },
  {
    n: 3,
    testo: "Questo tratto lo fai tre, quattro volte al giorno. Ormai è automatico.",
    interrompe: "Mantengo la stessa attenzione di sempre",
    prosegue: "Il pilota automatico mentale prende il sopravvento",
  },
  {
    n: 4,
    testo:
      "Un imprevisto ordinario — una curva, un incrocio — e hai meno margine di quanto pensavi.",
    interrompe: "",
    prosegue: "",
  },
];

type Esito = null | "evitato" | "incidente";

/**
 * Scena interattiva "Ogni anello rotto in tempo è un incidente evitato".
 * Stato locale, altezza fissa, nessuno scroll interno.
 */
export const CatenaUrgenzaScene = () => {
  const [attivo, setAttivo] = useState(1);
  const [esito, setEsito] = useState<Esito>(null);

  const reset = () => {
    setAttivo(1);
    setEsito(null);
  };

  const interrompi = () => setEsito("evitato");

  const prosegui = () => {
    if (attivo < 3) {
      setAttivo(attivo + 1);
    } else {
      setAttivo(4);
      setEsito("incidente");
    }
  };

  const nodoCorrente = NODI[attivo - 1];

  const statoNodo = (n: number) => {
    if (esito === "evitato") return n <= attivo ? "spento" : "spento";
    if (esito === "incidente") return n === 4 ? "fallito" : "fatto";
    if (n < attivo) return "fatto";
    if (n === attivo) return "attivo";
    return "neutro";
  };

  return (
    <div className="relative z-10 w-full max-w-6xl px-8">
      <p className="font-mono text-sm uppercase tracking-wide text-primary text-center">
        Ogni anello rotto in tempo è un incidente evitato
      </p>

      {/* Timeline nodi */}
      <div className="relative mt-10">
        <div className="absolute left-[12.5%] right-[12.5%] top-7 h-px bg-border/60" aria-hidden />
        <div className="relative grid grid-cols-4 gap-4">
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
              <div
                key={nodo.n}
                className={`flex flex-col items-center text-center transition-opacity duration-300 ${
                  st === "spento" ? "opacity-25" : "opacity-100"
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-full border-2 flex items-center justify-center font-mono text-lg font-bold ${ring}`}
                >
                  {nodo.n}
                </div>
                <p className="mt-4 text-xs md:text-sm leading-snug text-foreground/80 px-1">
                  {nodo.testo}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Area fissa: scelta o esito */}
      <div className="mt-10 min-h-[190px] rounded-lg border border-border/60 bg-card/60 px-6 py-7 flex flex-col items-center justify-center text-center">
        {esito === null && (
          <motion.div
            key={attivo}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
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

        {esito === "evitato" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
            <p className="text-2xl md:text-4xl font-bold text-primary">Incidente evitato</p>
            <p className="mt-4 text-base md:text-xl text-foreground/80 max-w-3xl mx-auto leading-snug">
              Fermarsi in tempo ha rotto la catena — anche se gli altri fattori erano già
              presenti.
            </p>
          </motion.div>
        )}

        {esito === "incidente" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
            <p className="text-2xl md:text-4xl font-bold text-destructive">Incidente</p>
            <p className="mt-4 text-base md:text-xl text-foreground/80 max-w-3xl mx-auto leading-snug">
              Nessun anello si è rotto in tempo.
            </p>
          </motion.div>
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
  );
};
