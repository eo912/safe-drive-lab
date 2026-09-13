/**
 * Test finale di apprendimento (ISAMED) — chiusura del corso.
 * Dieci domande a scelta multipla (A/B/C) gestite dal vivo dal docente:
 * nessun punteggio a schermo, nessuna persistenza dei risultati.
 */

export type QuizQuestionData = {
  id: string;
  question: string;
  /** Tre opzioni, in ordine A/B/C. */
  options: [string, string, string];
  /** Indice (0-based) dell'opzione corretta. */
  correctIndex: number;
  /** Spiegazione breve mostrata dopo il primo click. */
  explanation: string;
};

export const quizFinale: QuizQuestionData[] = [
  {
    id: "q1",
    question: "Qual è l'obiettivo principale della guida sicura?",
    options: [
      "Portare il veicolo vicino al limite",
      "Prevenire le situazioni critiche e mantenere margini di sicurezza",
      "Ridurre sempre la velocità al minimo",
    ],
    correctIndex: 1,
    explanation:
      "La guida sicura punta a prevenire le criticità e mantenere margini, non a \u201crischiare meno\u201d in astratto né ad andare sempre piano: è gestione consapevole del rischio.",
  },
  {
    id: "q2",
    question: "In una frenata di emergenza con ABS funzionante è corretto:",
    options: [
      "Premere con decisione e mantenere il freno",
      "Pompare il pedale",
      "Rilasciare appena si avverte la vibrazione",
    ],
    correctIndex: 0,
    explanation:
      "Con ABS funzionante si preme con decisione e si mantiene il freno: il sistema gestisce da solo il bloccaggio delle ruote, pompare o rilasciare riduce l'efficacia della frenata.",
  },
  {
    id: "q3",
    question: "Con l'aumento della velocità, lo spazio di frenata:",
    options: [
      "Cresce in modo più che proporzionale",
      "Rimane quasi uguale",
      "Dipende solo dal tipo di veicolo",
    ],
    correctIndex: 0,
    explanation:
      "Lo spazio di frenata cresce più che proporzionalmente con la velocità: raddoppiare la velocità più che raddoppia lo spazio necessario per fermarsi.",
  },
  {
    id: "q4",
    question: "La distrazione cognitiva si verifica quando:",
    options: [
      "La mente è impegnata altrove anche se occhi e mani sono al loro posto",
      "Si guarda negli specchi",
      "Si usa il freno motore",
    ],
    correctIndex: 0,
    explanation:
      "La distrazione cognitiva è mentale: anche con occhi sulla strada e mani al volante, la mente \u201caltrove\u201d riduce tempo di reazione e percezione del rischio.",
  },
  {
    id: "q5",
    question: "Con aderenza ridotta è opportuno:",
    options: [
      "Rendere più progressivi i comandi e aumentare i margini",
      "Frenare e sterzare bruscamente insieme",
      "Ridurre la distanza dal veicolo che precede",
    ],
    correctIndex: 0,
    explanation:
      "Con aderenza ridotta i comandi vanno resi più dolci e progressivi, aumentando i margini di sicurezza — mai bruschi.",
  },
  {
    id: "q6",
    question: "Gli pneumatici sono importanti perché:",
    options: [
      "Sono il punto attraverso cui il veicolo scambia le forze con la strada",
      "Servono soprattutto per il comfort",
      "Con ABS non incidono sulla frenata",
    ],
    correctIndex: 0,
    explanation:
      "Gli pneumatici sono l'unico punto di contatto reale tra veicolo e strada: da lì passano tutte le forze, ABS compreso.",
  },
  {
    id: "q7",
    question: "La regola dei secondi serve per:",
    options: [
      "Stimare una corretta distanza di sicurezza",
      "Calcolare il turno",
      "Valutare il consumo di carburante",
    ],
    correctIndex: 0,
    explanation:
      "La regola dei secondi (contare da un riferimento fisso) è un modo pratico per stimare la distanza di sicurezza a ogni velocità.",
  },
  {
    id: "q8",
    question:
      "Quando l'avantreno perde aderenza e il veicolo allarga la traiettoria si parla di:",
    options: ["Sottosterzo", "Sovrasterzo", "Aquaplaning"],
    correctIndex: 0,
    explanation:
      "Quando l'avantreno perde aderenza e il veicolo \u201cva dritto\u201d nonostante lo sterzo, è sottosterzo; il sovrasterzo è l'opposto.",
  },
  {
    id: "q9",
    question: "La pressione operativa durante la guida professionale:",
    options: [
      "Può ridurre i margini di sicurezza e va gestita",
      "Migliora sempre la guida",
      "Giustifica automaticamente maggiore velocità",
    ],
    correctIndex: 0,
    explanation:
      "La pressione (tempo, consegne, aspettative) può ridurre inconsapevolmente i margini di sicurezza: va riconosciuta e gestita, mai ignorata.",
  },
  {
    id: "q10",
    question: "In una situazione urgente il conducente deve:",
    options: [
      "Verificare sempre lo spazio disponibile e la reazione degli altri utenti",
      "Presumere che gli altri lo abbiano visto",
      "Concentrarsi soltanto sul tempo di arrivo",
    ],
    correctIndex: 0,
    explanation:
      "Prima di ogni manovra urgente va sempre verificato lo spazio realmente disponibile e la reazione degli altri utenti, mai dato per scontato.",
  },
];
