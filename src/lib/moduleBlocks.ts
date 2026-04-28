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

// Blocchi del Modulo 01 — Perché la guida sicura
export const perchéBlocks: ModuleBlock[] = [
  {
    id: "hero",
    index: 1,
    expectedSeconds: 90,
    title: "La realtà della strada",
    kind: "intro",
    hasExplanation: true,
    notes:
      "Apertura. Tono reale, niente drammatizzazione. Introdurre con qualcosa tipo: «Prima di guardare i numeri, fermiamoci un attimo. Quando pensiamo a un incidente immaginiamo qualcosa di raro, lontano, che capita agli altri. I dati raccontano un'altra storia.» Pausa lunga prima di passare ai numeri.",
  },
  {
    id: "numeri",
    index: 2,
    expectedSeconds: 180,
    title: "I numeri reali",
    kind: "dati",
    hasExplanation: true,
    hasDeepDive: true,
    notes:
      "173.364 incidenti, 3.030 morti, 233.853 feriti, 475 al giorno. Non leggere i numeri: lasciarli leggere. Sottolineare: «475 al giorno = uno ogni 3 minuti. Mentre parliamo, da qualche parte sta succedendo». Domanda all'aula: «Pensavate fosse di più, di meno, o circa così?». Fonte: ISTAT–ACI 2024.",
  },
  {
    id: "strada-conosciuta",
    index: 3,
    expectedSeconds: 150,
    title: "Una strada che conosci",
    kind: "riflessione",
    hasScenario: true,
    hasExplanation: true,
    notes:
      "Far pensare al tragitto casa-lavoro. Domanda: «Quante curve, incroci, semafori ci sono sulla strada che fai più spesso? Riusciresti a elencarli?». Punto chiave: la familiarità abbassa la soglia di attenzione. Sei presente, ma non davvero.",
  },
  {
    id: "abitudine",
    index: 4,
    expectedSeconds: 120,
    title: "Non è esperienza. È abitudine.",
    kind: "riflessione",
    hasExplanation: true,
    notes:
      "Distinguere chiaramente esperienza (capacità acquisita) da abitudine (automatismo cieco). Esempio: chi guida da 30 anni può essere meno presente di un neopatentato attento.",
  },
  {
    id: "incidente-non-numero",
    index: 5,
    expectedSeconds: 180,
    title: "Un incidente non è solo un numero",
    kind: "riflessione",
    hasOutcomes: true,
    hasExplanation: true,
    notes:
      "Un incidente non finisce quando finisce. Le conseguenze continuano per mesi, anni, a volte per sempre. 4 aree: lavoro, salute, famiglia, responsabilità. Per le aziende: focus su capacità lavorativa e responsabilità. Tempo: max 2 minuti.",
  },
  {
    id: "guidare-lavoro",
    index: 6,
    expectedSeconds: 150,
    title: "Guidare è lavoro",
    kind: "riflessione",
    hasExplanation: true,
    hasDeepDive: true,
    notes:
      "Punto chiave per il pubblico aziendale. «Quando guidi per lavoro, stai lavorando. Il rischio è parte dell'attività». Gli incidenti in itinere e in missione sono tra le prime cause di infortunio sul lavoro. Approfondimento INAIL disponibile.",
  },
  {
    id: "distrazione",
    index: 7,
    expectedSeconds: 120,
    title: "Bastano pochi secondi",
    kind: "scenario",
    hasScenario: true,
    hasOutcomes: true,
    hasExplanation: true,
    notes:
      "Introduzione al video. Chiedere prima: «Quanti metri si percorrono in 2 secondi a 50 km/h?» (≈ 28 metri). Far rispondere prima di mostrare.",
  },
  {
    id: "video-pov",
    index: 8,
    expectedSeconds: 240,
    title: "Scenario POV — Distrazione",
    kind: "video",
    hasOutcomes: true,
    hasExplanation: true,
    notes:
      "Far guardare in silenzio. Niente commenti durante. Alla fine: pausa di 3-5 secondi prima di parlare. Chiedere: «Cosa avete visto per primo?» e «Quante volte oggi hai guardato il telefono in macchina, anche solo per un attimo?». Da ricordare: non serve un evento eccezionale, bastano i 2 secondi sbagliati nel posto sbagliato.",
  },
  {
    id: "chiusura",
    index: 9,
    expectedSeconds: 120,
    title: "Se il problema è umano…",
    kind: "chiusura",
    notes:
      "Sintesi. Spostare il focus dalla strada al comportamento. Preparare il passaggio al Modulo 02 (Il conducente).",
  },
  {
    id: "cta",
    index: 10,
    expectedSeconds: 90,
    title: "Verso il modulo successivo",
    kind: "cta",
    notes:
      "Chiusura operativa. Annunciare il prossimo blocco didattico. Se è la fine della sessione: dare 1 azione concreta da provare nei prossimi 7 giorni.",
  },
];

export const blocksBySlug: Record<string, ModuleBlock[]> = {
  "perche-la-guida-sicura": perchéBlocks,
};
