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
    id: "cosa-e-sicurezza",
    index: 2,
    expectedSeconds: 120,
    title: "Cos'è la sicurezza",
    kind: "dati",
    hasExplanation: true,
    notes:
      "«La sicurezza non è uno stato: è una somma di decisioni.» Passare in rassegna le sei voci: velocità scelta, distanza mantenuta, qualità dell'osservazione, condizioni del veicolo, adattamento al meteo, stato psicofisico. Chiedere all'aula quale di queste viene trascurata più spesso nella loro giornata di lavoro.",
  },
  {
    id: "catena-urgenza",
    index: 3,
    expectedSeconds: 150,
    title: "La catena dell'urgenza",
    kind: "scenario",
    hasScenario: true,
    hasExplanation: true,
    notes:
      "Scena interattiva. Quattro nodi: 1) Sono le 22, hai guidato tutto il giorno, mancano 40 minuti a casa. 2) Il telefono vibra, è una chiamata importante. 3) Il tratto lo fai tre-quattro volte al giorno, ormai è automatico. 4) Un imprevisto ordinario e hai meno margine di quanto pensavi. Per i primi tre nodi far scegliere all'aula fra interrompere (fermarsi, rispondere dopo, tenere l'attenzione) e proseguire. Se si interrompe: «Incidente evitato — fermarsi in tempo ha rotto la catena, anche se gli altri fattori erano già presenti». Se si prosegue sempre: «Incidente — nessun anello si è rotto in tempo». Usare il pulsante Ricomincia per provare percorsi diversi.",
  },
  {
    id: "rischio-percepito-reale",
    index: 4,
    expectedSeconds: 90,
    title: "Rischio percepito. Rischio reale.",
    kind: "riflessione",
    hasExplanation: true,
    notes:
      "«Su una strada che sembra facile, la percezione del rischio scende e la velocità sale — anche se il rischio reale resta identico, o aumenta.» Far esempi concreti dai loro percorsi abituali.",
  },
  {
    id: "fattore-umano",
    index: 5,
    expectedSeconds: 90,
    title: "Il fattore umano",
    kind: "chiusura",
    hasExplanation: true,
    notes:
      "«La tecnologia alza il margine di sicurezza. Non lo sostituisce.» ABS, ESP, ADAS aiutano, ma la decisione — quando frenare, quanta velocità tenere — resta di chi guida. Ponte verso il modulo Il Conducente.",
  },
  {
    id: "cosa-non-e",
    index: 6,
    expectedSeconds: 60,
    title: "Cosa NON è questo corso",
    kind: "chiusura",
    notes:
      "Chiarire le aspettative: «Non è un corso di guida sportiva, né un addestramento a manovre estreme. Il pilota da competizione cerca il limite del veicolo. Il conducente professionale lo evita.»",
  },
  {
    id: "strada-conosciuta",
    index: 7,
    expectedSeconds: 240,
    title: "Una strada conosciuta",
    kind: "scenario",
    hasScenario: true,
    hasOutcomes: true,
    hasExplanation: true,
    hasDeepDive: true,
    notes:
      "Apertura con domanda: «Pensate alla strada che fate più spesso. Vi sembra una strada sicura?». Non dare subito la risposta: far motivare 1-2 persone. Punto chiave: la familiarità può abbassare la soglia di attenzione. Distinguere esperienza (capacità acquisita) da abitudine (automatismo). Chiusura: «L'esperienza ti rende più capace. L'abitudine, se non la controlli, ti rende meno presente.»",
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
    expectedSeconds: 300,
    title: "Un incidente è una catena di eventi",
    kind: "scenario",
    hasScenario: true,
    hasOutcomes: true,
    hasExplanation: true,
    hasDeepDive: true,
    notes:
      "Aprire con: «Secondo voi, un incidente nasce davvero in un solo istante?». Far emergere dall'aula che quasi sempre esistono più anelli: velocità, attenzione, osservazione, frenata. Non cercare il colpevole, ma il primo punto utile in cui interrompere la sequenza. Domanda chiave: «Dove avreste potuto rompere la catena?». Chiusura: «La sicurezza non elimina ogni errore. Crea più occasioni per fermarlo prima.»",
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

// Blocchi del Modulo 1 — Perché un corso
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

export const blocksBySlug: Record<string, ModuleBlock[]> = {
  "modulo-1-perche-un-corso": moduloUnoBlocks,
  "perche-la-guida-sicura": perchéBlocks,
};
