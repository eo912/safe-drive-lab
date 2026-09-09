export type ModuleBlock = {
  id: string;
  index: number;
  title: string;
  kind: "intro" | "dati" | "scenario" | "riflessione" | "video" | "chiusura" | "cta";
  hasScenario?: boolean;
  hasOutcomes?: boolean;
  hasExplanation?: boolean;
  hasDeepDive?: boolean;
  /** Tempo previsto della slide in secondi. Configurabile, override locale lato istruttore. */
  expectedSeconds?: number;
  notes: string;
};

// Blocchi del Modulo 1a — Le Tre Leve
export const moduloUnoBlocks: ModuleBlock[] = [
  {
    id: "copertina",
    index: 1,
    expectedSeconds: 30,
    title: "Guida Sicura VDA",
    kind: "intro",
    notes:
      "Slide di apertura, solo logo e nome. Nessun intervento istruttore necessario, transizione rapida al blocco successivo.",
  },
  {
    id: "hook",
    index: 2,
    expectedSeconds: 60,
    title: "Perché un corso",
    kind: "intro",
    hasExplanation: true,
    notes:
      "Frase di apertura: «Non è un'idea nuova. È una storia che comincia più di vent'anni fa — e che oggi passa anche da questa aula.» Pausa, poi passare al blocco tre leve.",
  },
  {
    id: "tre-leve",
    index: 3,
    expectedSeconds: 180,
    title: "Le tre leve",
    kind: "scenario",
    hasScenario: true,
    hasExplanation: true,
    notes:
      "Nel 2001 l'Unione Europea si è posta l'obiettivo di dimezzare i morti sulla strada. Da lì tre leve: STATO (patente a punti, 2003), INDUSTRIA (da ABS a ADAS obbligatori 2022-2024), EDUCAZIONE (campagne e corsi come questo). Far toccare le tre card una per una, chiudere con: «Anche voi oggi siete dentro la terza leva.»",
  },
  {
    id: "numeri-2001-2024",
    index: 4,
    expectedSeconds: 150,
    title: "2001 vs oggi",
    kind: "dati",
    hasExplanation: true,
    hasDeepDive: true,
    notes:
      "Incidenti: 263.100 → 173.364. Morti: 7.096 → 3.030. Feriti: 373.286 → 233.853. Veicoli circolanti: 32,5M → 41,3M (fonte ACI). SUGGERIMENTO CHIAVE per l'istruttore, da NON mettere a schermo: rapportando al numero di veicoli, il rischio per veicolo è calato ancora di più del dato assoluto — incidenti/veicolo -48%, MORTI/VEICOLO -66%, feriti/veicolo -51%. Usare questa frase se l'aula sembra pensare che il miglioramento sia «solo perché ci sono più regole»: il calo è strutturale, non statistico. Fonte: ISTAT-ACI, Report Incidenti Stradali 2024.",
  },
  {
    id: "costi-stato",
    index: 5,
    expectedSeconds: 90,
    title: "Il costo per tutti",
    kind: "chiusura",
    hasExplanation: true,
    notes:
      "18 miliardi di euro l'anno, quasi l'1% del PIL nazionale (dato 2024, fonte Ministero Infrastrutture/ISTAT-ACI). Chiudere con: «La strada è più sicura di ieri, ma il lavoro non è finito, ed è anche per questo che siete qui.»",
  },
];

// Blocchi del Modulo 2 — Sicurezza e Rischio
export const moduloDueBlocks: ModuleBlock[] = [
  {
    id: "sicurezza-rischio",
    index: 1,
    expectedSeconds: 510,
    title: "La sicurezza è una somma di decisioni",
    kind: "intro",
    hasExplanation: true,
    notes:
      "Sei decisioni: velocità, distanza, osservazione, condizioni del veicolo, adattamento al meteo, stato psicofisico. Nessuna da sola salva o condanna: è la somma. Chiedi in aula: quando vi sentite più sicuri alla guida — su una strada larga e dritta, o su una tortuosa di montagna? Quasi tutti diranno la prima: è l'aggancio per introdurre il rischio percepito. Esempio pratico: statale ampia con incrocio nascosto vs tornante stretto ma con visuale libera — stesso rischio oggettivo, percezione opposta. Se qualcuno racconta un episodio personale di «mi sentivo tranquillo e invece...», usalo: vale più di ogni slide. Chiudere con: il corso non insegna ad avere più paura, allena a leggere quello che c'è davvero. Poi il callout: non è un corso per guidare come un pilota; il pilota cerca il limite dell'auto, il conducente lo evita. Anche con un'auto perfetta si resta su una strada condivisa con persone che sbagliano, che sono distratte, che non ti hanno visto.",
  },
  {
    id: "catena-incidente",
    index: 2,
    expectedSeconds: 420,
    title: "La catena dell'incidente",
    kind: "scenario",
    hasScenario: true,
    hasOutcomes: true,
    hasExplanation: true,
    notes:
      "Scenario narrativo, NON un quiz: nessun punteggio a schermo. Contesto: auto di 10 anni, gomme discrete, 22:00, due ore di guida, 40 minuti a casa, statale. Quattro nodi: stanchezza, notifica telefono (il chiamante è Mamma o Moglie, estratto a caso; se si rimanda, a volte il telefono risquilla e la scelta torna identica), pioggia improvvisa, imprevisto in curva. La probabilità di incidente si accumula in modo nascosto e l'esito è estratto a sorte ad ogni step: due erogazioni possono finire diverse a parità di scelte, ed è voluto. Sullo specchietto del telefono: se nessuno reagisce, rilancia a voce «avete visto quanti metri fate alla cieca solo per controllare chi vi chiama?». Per aule con molti utenti autostrada: stesso calcolo a 120 km/h, circa 67 metri, più della lunghezza di un campo da calcio. Chiudere SEMPRE con la riflessione guidata «in quale punto della catena si decideva davvero l'esito?»: nessuna risposta corretta. La probabilità accumulata resta solo nel log interno, mai in aula: serve a capire dove le persone rischiano di più, non a giudicare i singoli davanti al gruppo.",
  },
  {
    id: "fattore-umano",
    index: 3,
    expectedSeconds: 180,
    title: "Il fattore umano",
    kind: "chiusura",
    hasExplanation: true,
    notes:
      "Cintura, airbag e poggiatesta proteggono dopo l'impatto; altri sistemi intervengono mentre guidi. Non nominare ancora ABS/ESP/ASR in dettaglio: solo «sistemi che intervengono», il dettaglio tecnico arriva nel modulo dedicato al veicolo. Buon punto per un aneddoto personale su un intervento elettronico che ha aiutato ma non ha «salvato» da solo. Ponte al Modulo Il Conducente: prima di essere un sistema tecnologico, la tua auto ha già un primo sistema di sicurezza — e sei tu.",
  },
];

// Blocchi del Modulo 3 — Il Conducente
export const moduloTreBlocks: ModuleBlock[] = [
  {
    id: "posizione-guida",
    index: 1,
    expectedSeconds: 300,
    title: "Prima ancora della tecnologia, ci sei tu",
    kind: "intro",
    hasExplanation: true,
    notes:
      "Schermata a hotspot: illustrazione del conducente in abitacolo con 5 punti interattivi (sedile, volante, poggiatesta, cintura, specchi). Far cliccare un punto alla volta e leggere il dettaglio. Sugli specchi sottolineare: si regolano prima di partire, e anche ben regolati restano angoli ciechi — prima di cambiare corsia serve un'occhiata diretta.",
  },
  {
    id: "visione",
    index: 2,
    expectedSeconds: 300,
    title: "Il 90% di quello che sai sulla strada, lo sai perché lo vedi",
    kind: "dati",
    hasExplanation: true,
    notes:
      "Schermata a hotspot sulla visuale frontale: visione centrale, periferica, scanning. Poi il tempo di reazione: 0,7-1,5 secondi, che a 50 km/h significano circa 14 metri e a 90 km/h circa 25 metri prima di iniziare a frenare. Collegare allo specchietto dei metri già visto nel Modulo 2 (telefono).",
  },
  {
    id: "distrazione",
    index: 3,
    expectedSeconds: 240,
    title: "Bastano pochi secondi",
    kind: "chiusura",
    hasExplanation: true,
    notes:
      "Tre tipi di distrazione: visiva, manuale, cognitiva (la più insidiosa, invisibile dall'esterno). Stanchezza: i segnali evidenti sono già tardivi, l'unico rimedio è la pausa. Stress e fretta: il campo di attenzione si restringe, capita anche a chi guida da anni — va gestita, non ignorata.",
  },
];

export const blocksBySlug: Record<string, ModuleBlock[]> = {
  "modulo-1-perche-un-corso": moduloUnoBlocks,
  "modulo-2-sicurezza-e-rischio": moduloDueBlocks,
  "modulo-3-il-conducente": moduloTreBlocks,
};
