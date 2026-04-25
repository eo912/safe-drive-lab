export type ModuleBlock = {
  id: string;
  index: number;
  title: string;
  kind: "intro" | "dati" | "scenario" | "riflessione" | "video" | "chiusura" | "cta";
  hasScenario?: boolean;
  hasOutcomes?: boolean;
  hasExplanation?: boolean;
  hasDeepDive?: boolean;
  notes: string;
};

// Blocchi del Modulo 01 — Perché la guida sicura
export const perchéBlocks: ModuleBlock[] = [
  {
    id: "hero",
    index: 1,
    title: "La realtà della strada",
    kind: "intro",
    hasExplanation: true,
    notes:
      "Apertura. Stabilire il tono: niente drammatizzazione, niente retorica. Far capire che parliamo di qualcosa di quotidiano. Pausa lunga prima di passare ai numeri.",
  },
  {
    id: "numeri",
    index: 2,
    title: "I numeri reali",
    kind: "dati",
    hasExplanation: true,
    hasDeepDive: true,
    notes:
      "173.364 incidenti, 3.030 morti, 233.853 feriti, 475 al giorno. Non leggere i numeri: lasciarli leggere. Chiedere in aula: «Quanti di voi pensavano fosse meno?». Fonte: ISTAT–ACI 2024.",
  },
  {
    id: "strada-conosciuta",
    index: 3,
    title: "Una strada che conosci",
    kind: "riflessione",
    hasScenario: true,
    hasExplanation: true,
    notes:
      "Chiedere ai partecipanti di pensare al tragitto casa-lavoro. Quanti dettagli ricordano davvero? Il punto: la familiarità abbassa la soglia di attenzione.",
  },
  {
    id: "abitudine",
    index: 4,
    title: "Non è esperienza. È abitudine.",
    kind: "riflessione",
    hasExplanation: true,
    notes:
      "Distinguere chiaramente esperienza (capacità acquisita) da abitudine (automatismo cieco). Esempio: chi guida da 30 anni può essere meno presente di un neopatentato attento.",
  },
  {
    id: "incidente-non-numero",
    index: 5,
    title: "Un incidente non è solo un numero",
    kind: "riflessione",
    hasOutcomes: true,
    hasExplanation: true,
    notes:
      "4 conseguenze: lavoro, sanità, famiglia, aspetti legali. Per le aziende: focus su capacità lavorativa e responsabilità. Tempo: max 2 minuti.",
  },
  {
    id: "guidare-lavoro",
    index: 6,
    title: "Guidare è lavoro",
    kind: "riflessione",
    hasExplanation: true,
    hasDeepDive: true,
    notes:
      "Punto chiave per il pubblico aziendale. Citare: gli incidenti in itinere e in missione sono tra le prime cause di infortunio. Approfondimento INAIL disponibile.",
  },
  {
    id: "distrazione",
    index: 7,
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
    title: "Scenario POV — Distrazione",
    kind: "video",
    hasOutcomes: true,
    hasExplanation: true,
    notes:
      "Far guardare in silenzio. Niente commenti durante. Alla fine: pausa di 3-5 secondi prima di parlare. Chiedere: «Cosa avete visto per primo?». Lasciare emergere le risposte.",
  },
  {
    id: "chiusura",
    index: 9,
    title: "Se il problema è umano…",
    kind: "chiusura",
    notes:
      "Sintesi. Spostare il focus dalla strada al comportamento. Preparare il passaggio al Modulo 02 (Il conducente).",
  },
  {
    id: "cta",
    index: 10,
    title: "Verso il modulo successivo",
    kind: "cta",
    notes:
      "Chiusura operativa. Annunciare il prossimo blocco didattico. Se è la fine della sessione: dare 1 azione concreta da provare nei prossimi 7 giorni.",
  },
];

export const blocksBySlug: Record<string, ModuleBlock[]> = {
  "perche-la-guida-sicura": perchéBlocks,
};
