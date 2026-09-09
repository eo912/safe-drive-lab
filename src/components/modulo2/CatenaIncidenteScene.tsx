import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { ImagePlaceholder } from "./ImagePlaceholder";

type RenderLevel = "full" | "live" | "preview";

type Scelta = {
  label: string;
  /** Valutazione interna: MAI mostrata a schermo. */
  rischiosa: boolean;
};

type Nodo = {
  id: string;
  titolo: string;
  domanda: string;
  immagine: string;
  scelte: [Scelta, Scelta];
};

const NODI: Nodo[] = [
  {
    id: "stanchezza",
    titolo: "Stanchezza",
    domanda: "Senti gli occhi pesanti. Mancano 40 minuti. Cosa fai?",
    immagine: "Occhi socchiusi alla guida oppure area di sosta di notte",
    scelte: [
      { label: "Continuo, ormai sono quasi a casa", rischiosa: true },
      { label: "Mi fermo cinque minuti, prendo un caffè", rischiosa: false },
    ],
  },
  {
    id: "notifica",
    titolo: "Notifica",
    domanda: "Il telefono squilla sul sedile. Sul display:",
    immagine: "Telefono illuminato sul sedile passeggero con chiamata in arrivo",
    scelte: [
      { label: "Rispondo, magari è successo qualcosa", rischiosa: true },
      {
        label: "Richiamo appena arrivo, tra venti minuti sono a casa",
        rischiosa: false,
      },
    ],
  },
  {
    id: "pioggia",
    titolo: "Pioggia improvvisa",
    domanda: "Inizia a piovere. L'asfalto diventa lucido.",
    immagine: "Parabrezza con pioggia, tergicristalli in movimento",
    scelte: [
      { label: "Mantengo l'andatura, sono quasi arrivato", rischiosa: true },
      { label: "Rallento e allargo la distanza", rischiosa: false },
    ],
  },
  {
    id: "imprevisto",
    titolo: "L'imprevisto",
    domanda: "In curva, senti l'auto perdere aderenza. Davanti, qualcosa si muove.",
    immagine: "Curva di notte, ostacolo o auto ferma sul bordo",
    scelte: [
      { label: "Freno di colpo e sterzo deciso", rischiosa: true },
      { label: "Rilascio l'acceleratore, correggo con dolcezza", rischiosa: false },
    ],
  },
];

const PROB_MIN = 0.1;

/** Cause esterne dell'incidente, coerenti col nodo in cui scatta l'esito. */
const CAUSE_ESTERNE: Record<string, string[]> = {
  stanchezza: [
    "L'auto davanti ha frenato di colpo.",
    "Un animale ha attraversato all'improvviso.",
  ],
  notifica: [
    "Qualcuno ti ha tagliato la strada.",
    "Un veicolo è uscito da una laterale senza dare la precedenza.",
  ],
  pioggia: [
    "Il veicolo davanti ha inchiodato sull'asfalto bagnato.",
    "Un pedone ha attraversato dove non te lo aspettavi.",
  ],
  imprevisto: [
    "Un'auto in senso opposto ha invaso la corsia.",
    "Un altro veicolo non ha rispettato la precedenza.",
  ],
};

const causaPerNodo = (id: string) => {
  const lista = CAUSE_ESTERNE[id] ?? CAUSE_ESTERNE.stanchezza;
  return lista[Math.floor(Math.random() * lista.length)];
};

type Fase = "intro" | "nodi" | "esito" | "riflessione";

/**
 * Scenario narrativo "La catena dell'incidente".
 * La probabilità accumulata è uno stato interno: non viene mai mostrata a schermo
 * (solo in console, come log per l'istruttore). Nessun punteggio per l'utente.
 */
export const CatenaIncidenteScene = ({ level }: { level: RenderLevel }) => {
  const [fase, setFase] = useState<Fase>("intro");
  const [idx, setIdx] = useState(0);
  const [esito, setEsito] = useState<"casa" | "incidente" | null>(null);
  const [secondaChiamata, setSecondaChiamata] = useState(false);
  const [specchietto, setSpecchietto] = useState(false);
  const [causa, setCausa] = useState<string | null>(null);

  // stato NASCOSTO
  const probRef = useRef(0.2);
  const logRef = useRef<string[]>([]);
  const rischioseRef = useRef(0);

  const [chiamante, setChiamante] = useState(() =>
    Math.random() < 0.5 ? "Mamma" : "Moglie",
  );

  const reset = () => {
    probRef.current = 0.2;
    logRef.current = [];
    setIdx(0);
    setEsito(null);
    setSecondaChiamata(false);
    setSpecchietto(false);
    setCausa(null);
    rischioseRef.current = 0;
    setChiamante(Math.random() < 0.5 ? "Mamma" : "Moglie");
    setFase("intro");
  };

  const nodo = NODI[idx];

  const registra = (etichetta: string, delta: number) => {
    probRef.current = Math.max(PROB_MIN, Math.min(0.95, probRef.current + delta));
    logRef.current.push(`${etichetta} → p=${Math.round(probRef.current * 100)}%`);
    // Log interno riservato all'istruttore, mai visibile in aula.
    // eslint-disable-next-line no-console
    console.debug("[catena-incidente]", logRef.current[logRef.current.length - 1]);
  };

  const avanza = () => {
    // estrazione casuale pesata sulla probabilità corrente, ad ogni step
    if (Math.random() < probRef.current) {
      setCausa(causaPerNodo(NODI[idx].id));
      setEsito("incidente");
      setFase("esito");
      return;
    }
    if (idx >= NODI.length - 1) {
      setEsito("casa");
      setFase("esito");
      return;
    }
    setIdx(idx + 1);
  };

  const scegli = (scelta: Scelta, i: number) => {
    const primoStep = idx === 0 && !secondaChiamata;
    const extra = secondaChiamata && scelta.rischiosa;
    if (scelta.rischiosa) rischioseRef.current += 1;

    if (primoStep) {
      registra(`stanchezza:${scelta.rischiosa ? "rischiosa" : "prudente"}`, scelta.rischiosa ? 0.2 : 0);
    } else {
      registra(
        `${nodo.id}:${scelta.rischiosa ? "rischiosa" : "prudente"}${extra ? "+richiamata" : ""}`,
        scelta.rischiosa ? (extra ? 0.25 : 0.2) : -0.05,
      );
    }

    // Specchietto contestuale sul telefono
    if (nodo.id === "notifica" && scelta.rischiosa) {
      setSpecchietto(true);
      return;
    }

    // Seconda chiamata: a volte il telefono risquilla
    if (nodo.id === "notifica" && !scelta.rischiosa && !secondaChiamata && Math.random() < 0.5) {
      setSecondaChiamata(true);
      // l'estrazione avviene comunque su questo step
      if (Math.random() < probRef.current) {
        setCausa(causaPerNodo(nodo.id));
        setEsito("incidente");
        setFase("esito");
      }
      return;
    }

    if (nodo.id === "notifica") setSecondaChiamata(false);
    void i;
    avanza();
  };

  const chiudiSpecchietto = () => {
    setSpecchietto(false);
    setSecondaChiamata(false);
    avanza();
  };

  const statoNodo = (i: number) => {
    if (fase === "esito" || fase === "riflessione")
      return esito === "incidente" && i === idx ? "fallito" : "fatto";
    if (i < idx) return "fatto";
    if (i === idx && fase === "nodi") return "attivo";
    return "neutro";
  };

  return (
    <div className="relative z-10 w-full h-full flex flex-col justify-between px-6 md:px-12 py-12 md:py-14 lg:py-16 gap-5 md:gap-6">
      <div className="text-center">
        <p className="font-mono text-sm uppercase tracking-[0.3em] text-primary">
          La catena dell'incidente
        </p>
        <h2 className="mt-3 text-2xl md:text-4xl font-bold leading-snug">
          Ogni incidente è una catena.{" "}
          <span className="text-primary">Tu decidi dove si rompe.</span>
        </h2>
      </div>

      {/* Timeline nodi */}
      <div className="relative max-w-3xl mx-auto w-full">
        <div className="absolute left-[10%] right-[10%] top-6 h-px bg-border/60" aria-hidden />
        <div className="relative grid grid-cols-4 gap-4">
          {NODI.map((n, i) => {
            const st = statoNodo(i);
            const ring =
              st === "attivo"
                ? "border-primary bg-primary/15 text-primary"
                : st === "fatto"
                  ? "border-border bg-card text-foreground/70"
                  : st === "fallito"
                    ? "border-destructive bg-destructive/15 text-destructive"
                    : "border-border/60 bg-card/60 text-muted-foreground";
            return (
              <div key={n.id} className="flex flex-col items-center text-center">
                <div
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-mono text-base font-bold ${ring}`}
                >
                  {i + 1}
                </div>
                <p className="mt-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {n.titolo}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Area fissa: contesto / nodo / esito / riflessione */}
      <div className="min-h-[34vh] rounded-lg border border-primary/40 bg-card/70 px-6 py-6 flex flex-col items-center justify-center text-center gap-5 overflow-hidden">
        {fase === "intro" && (
          <div className="w-full grid grid-cols-2 gap-6 items-center">
            <ImagePlaceholder
              label="Abitacolo auto vista conducente, buio, luci cruscotto, strada notturna"
              className="h-[22vh]"
            />
            <div className="text-left">
              <p className="text-lg md:text-2xl leading-snug text-foreground/90">
                Stai rientrando a casa. Mancano 40 minuti. Guidi da due ore.
              </p>
              {level !== "preview" && (
                <button
                  type="button"
                  onClick={() => setFase("nodi")}
                  className="mt-6 rounded-md border border-primary/60 bg-primary/10 px-5 py-3 text-sm md:text-base font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  Parti
                </button>
              )}
            </div>
          </div>
        )}

        {fase === "nodi" && !specchietto && (
          <motion.div
            key={`${nodo.id}-${secondaChiamata ? "bis" : "uno"}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full grid grid-cols-2 gap-6 items-center"
          >
            <ImagePlaceholder label={nodo.immagine} className="h-[22vh]" />
            <div className="text-left">
              {secondaChiamata && (
                <p className="font-mono text-xs uppercase tracking-widest text-primary mb-2">
                  Il telefono squilla di nuovo
                </p>
              )}
              <p className="text-lg md:text-2xl font-medium leading-snug">
                {nodo.domanda}
                {nodo.id === "notifica" && (
                  <span className="text-primary"> «{chiamante}»</span>
                )}
              </p>
              <div className="mt-5 flex flex-col gap-3">
                {nodo.scelte.map((s, i) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => scegli(s, i)}
                    className="rounded-md border border-border/70 bg-card px-4 py-3 text-left text-sm md:text-base text-foreground/85 hover:border-primary/60 transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {specchietto && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-2xl rounded-lg border border-primary/60 bg-background/90 px-6 py-7"
            >
              <p className="font-mono text-xs uppercase tracking-widest text-primary mb-3">
                Un attimo
              </p>
              <p className="text-lg md:text-2xl leading-snug">
                Un'occhiata al telefono dura in media 2-3 secondi.
                <br />
                <span className="text-primary font-semibold">
                  A 50 km/h: circa 28 metri percorsi senza guardare la strada.
                </span>
              </p>
              <button
                type="button"
                onClick={chiudiSpecchietto}
                className="mt-6 rounded-md border border-border/70 bg-card px-5 py-2.5 text-sm font-medium text-foreground/80 hover:border-border transition-colors"
              >
                Torna alla strada
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {fase === "esito" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full grid grid-cols-2 gap-6 items-center"
          >
            <ImagePlaceholder
              label={
                esito === "casa"
                  ? "Porta di casa, luce accesa, sera"
                  : "Luci di emergenza sfocate in lontananza, sobrio"
              }
              className="h-[22vh]"
            />
            <div className="text-left">
              <p
                className={`text-3xl md:text-5xl font-bold ${
                  esito === "casa" ? "text-primary" : "text-destructive"
                }`}
              >
                {esito === "casa"
                  ? "Dopo qualche imprevisto lungo la strada, sei arrivato a casa."
                  : "Non ce l'hai fatta."}
              </p>
              <p className="mt-4 text-base md:text-lg leading-snug text-foreground/80">
                {esito === "casa"
                  ? "Stessa strada, stesse condizioni. Qualche imprevisto c'è stato: questa volta la catena si è fermata prima."
                  : rischioseRef.current === 0
                    ? `${causa ?? ""} Non dipendeva dalle tue scelte: il rischio non è mai a zero, e non dipende solo da te.`
                    : `${causa ?? ""} Stessa strada, stesse condizioni. Questa volta la catena è arrivata fino in fondo.`}
              </p>
              <button
                type="button"
                onClick={() => setFase("riflessione")}
                className="mt-6 rounded-md border border-primary/60 bg-primary/10 px-5 py-3 text-sm md:text-base font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                Continua
              </button>
            </div>
          </motion.div>
        )}

        {fase === "riflessione" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full"
          >
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Riflessione guidata
            </p>
            <p className="mt-4 text-2xl md:text-4xl font-semibold leading-snug max-w-3xl mx-auto">
              In quale punto della catena, secondo voi, si decideva davvero l'esito?
            </p>
            <p className="mt-5 text-base md:text-lg leading-relaxed text-foreground/75 max-w-3xl mx-auto">
              Non c'è una risposta giusta scritta qui. Ripercorretela insieme: stanchezza,
              telefono, pioggia, imprevisto. Dove avreste rotto la catena voi, e dove invece
              avreste fatto la stessa scelta?
            </p>
          </motion.div>
        )}
      </div>

      {(fase === "esito" || fase === "riflessione") && (
        <div className="text-center">
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
