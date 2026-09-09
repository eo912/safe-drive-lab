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

// Blocchi del Modulo 4 — Il Veicolo
export const moduloQuattroBlocks: ModuleBlock[] = [
  {
    id: "pneumatici",
    index: 1,
    expectedSeconds: 300,
    title: "Tutto passa da un palmo di mano per ruota",
    kind: "intro",
    hasExplanation: true,
    notes:
      "Schermata a hotspot: pressione, battistrada, aquaplaning (FR: aquaplanage), gomme estive, gomme invernali. Far cliccare un punto alla volta. Sottolineare che l'area di contatto totale con la strada è grande quanto quattro palmi di mano, e che ogni manovra passa da lì. Sulla pressione: si controlla a freddo, non dopo un'ora di viaggio.",
  },
  {
    id: "freni",
    index: 2,
    expectedSeconds: 240,
    title: "Fermare una tonnellata in pochi metri",
    kind: "dati",
    hasExplanation: true,
    hasDeepDive: true,
    notes:
      "Quattro pastiglie grandi come un mazzo di carte fermano più di una tonnellata; la forza diventa calore. Fading in discesa: pedale premuto ma frenata che risponde meno; rimedio è far lavorare il motore. SUGGERIMENTO per l'istruttore, NON a schermo: fermare un'auto significa smaltire un'enorme quantità di energia cinetica in pochi secondi, tutta concentrata sull'attrito tra pastiglia e disco. Utile se in aula c'è qualcuno con curiosità tecnica o formazione meccanica.",
  },
  {
    id: "sterzo-sospensioni",
    index: 3,
    expectedSeconds: 180,
    title: "Quello che non vedi, finché non serve",
    kind: "scenario",
    hasExplanation: true,
    notes:
      "Le sospensioni tengono la ruota a contatto con l'asfalto. Un ammortizzatore usurato non si percepisce nella guida normale: emerge solo in frenata forte, curva stretta o sterzata d'emergenza. Buon punto per chiedere chi ha mai fatto controllare gli ammortizzatori.",
  },
  {
    id: "sistemi-elettronici",
    index: 4,
    expectedSeconds: 240,
    title: "Gestiscono l'aderenza che c'è. Non la creano dal nulla",
    kind: "dati",
    hasExplanation: true,
    notes:
      "ABS, ESP, ASR: cosa fanno e cosa non fanno. Riprendere il Modulo 2 (fattore umano): sono sistemi che intervengono mentre guidi, qui arriva il dettaglio tecnico promesso. Insistere sull'errore comune: spostano il limite, non aumentano il margine per l'imprevisto.",
  },
  {
    id: "prima-di-partire",
    index: 5,
    expectedSeconds: 180,
    title: "Un problema trovato prima è un problema risolto",
    kind: "chiusura",
    hasExplanation: true,
    notes:
      "Luci: servono soprattutto a essere visti. Carico: sposta il baricentro e in frenata brusca diventa un pericolo in movimento nell'abitacolo. Scorrere la checklist pre-partenza voce per voce e chiedere quante di queste vengono fatte davvero prima di partire.",
  },
];

// Blocchi del Modulo 5 — Dinamica del Veicolo
export const moduloCinqueBlocks: ModuleBlock[] = [
  {
    id: "peso-trasferimenti",
    index: 1,
    expectedSeconds: 300,
    title: "Il peso non sta mai fermo",
    kind: "intro",
    hasExplanation: true,
    notes:
      "In frenata il peso va in avanti (i freni anteriori lavorano di più), in accelerazione indietro, in curva verso l'esterno. Non è un difetto: è fisica normale, ma cambia istante per istante l'aderenza (FR: adhérence) disponibile su ciascuna ruota.",
  },
  {
    id: "budget-aderenza",
    index: 2,
    expectedSeconds: 300,
    title: "Ogni ruota ha un budget. Non puoi spenderlo due volte",
    kind: "dati",
    hasExplanation: true,
    notes:
      "Metafora del budget: 100 di aderenza (FR: adhérence) per ruota. Se ne usi 80 per frenare ne restano 20 per sterzare. Frenata, sterzata e accelerazione vanno separate nel tempo: prima freni, poi sterzi. Frenare forte e sterzare forte insieme è la combinazione più critica.",
  },
  {
    id: "sottosterzo-sovrasterzo",
    index: 3,
    expectedSeconds: 300,
    title: "Quando l'auto non fa quello che chiedi",
    kind: "scenario",
    hasExplanation: true,
    notes:
      "Sottosterzo (FR: sous-virage): l'avantreno perde aderenza (FR: adhérence), l'auto allarga; si corregge riducendo l'input, non sterzando di più. Sovrasterzo (FR: survirage): il retrotreno perde aderenza, rischio testacoda; controsterzo dolce. L'obiettivo non è la tecnica sportiva ma riconoscerli per tempo: con velocità adeguata quasi mai si presentano.",
  },
  {
    id: "spazio-arresto",
    index: 4,
    expectedSeconds: 300,
    title: "Pochi km/h in più, molto più spazio per fermarti",
    kind: "dati",
    hasExplanation: true,
    hasDeepDive: true,
    notes:
      "Spazio di arresto = reazione + frenata; la frenata cresce col quadrato della velocità (raddoppiare la velocità → ×4). Collegare al tempo di reazione del Modulo 3. Frenata quotidiana progressiva; emergenza: pressione decisa a fondo, con ABS tenere premuto senza pompare e continuare a sterzare.",
  },
  {
    id: "aderenza-condizioni",
    index: 5,
    expectedSeconds: 300,
    title: "La strada non è sempre la stessa strada",
    kind: "chiusura",
    hasExplanation: true,
    notes:
      "Bagnato (primi minuti di pioggia i più critici), freddo anche su asciutto, neve/ghiaccio con aderenza (FR: adhérence) ridotta di un ordine di grandezza. Le transizioni improvvise (tunnel, ombra di un ponte, chiazza d'olio) sono i punti più insidiosi. Veicolo pesante o baricentro alto aggrava tutto. Chiudere collegando al modulo Il Veicolo: aderenza e mezzo si leggono insieme.",
  },
];

// Blocchi del Modulo 6 — Tecniche di Guida
export const moduloSeiBlocks: ModuleBlock[] = [
  {
    id: "anticipare",
    index: 1,
    expectedSeconds: 240,
    title: "Guidare è decidere in anticipo, non reagire",
    kind: "intro",
    hasExplanation: true,
    notes:
      "Guardare avanti nel tempo, non solo nello spazio: «cosa potrebbe succedere nei prossimi secondi». Regola dei secondi: punto fisso, 2-3 secondi di distanza; con pioggia o scarsa visibilità raddoppiare il margine. Far provare il conteggio «milleuno, milledue» su un punto di riferimento.",
  },
  {
    id: "comandi-progressivi",
    index: 2,
    expectedSeconds: 240,
    title: "Comandi progressivi, non a scatti",
    kind: "dati",
    hasExplanation: true,
    notes:
      "Fluidità = gradualità su acceleratore, freno e volante. Non solo comfort: meglio aderenza, meno usura, margine di reazione sempre disponibile. Collegare al budget di aderenza del Modulo 5: la manovra brusca spende tutto il budget in una volta.",
  },
  {
    id: "sequenza-curva",
    index: 3,
    expectedSeconds: 240,
    title: "Si frena prima, si sterza in curva, si accelera dopo",
    kind: "scenario",
    hasExplanation: true,
    notes:
      "Sequenza: osserva il raggio, riduci prima di entrare, traiettoria stabile, riprendi l'acceleratore dopo il punto più stretto. Errore frequente: entrare troppo veloci e frenare a metà curva. Blocco previsto per l'integrazione del simulatore interattivo: la zona visiva è modulare (FlexMediaPlaceholder).",
  },
  {
    id: "margini-diversi",
    index: 4,
    expectedSeconds: 240,
    title: "La stessa tecnica, margini diversi",
    kind: "chiusura",
    hasExplanation: true,
    notes:
      "Sequenza cambio direzione: specchio, indicatore, controllo angolo cieco, manovra. La tecnica va adattata alle condizioni con margini più ampi. Chiudere col ponte al modulo successivo: quando guidare diventa il tuo lavoro — ore al volante, ripetizione, pressione operativa.",
  },
];

// Blocchi del Modulo 7 — Guida Professionale
export const moduloSetteBlocks: ModuleBlock[] = [
  {
    id: "ore-al-volante",
    index: 1,
    expectedSeconds: 240,
    title: "Le stesse regole, molte più ore",
    kind: "intro",
    hasExplanation: true,
    notes:
      "Chi guida per lavoro ripete gli stessi percorsi o affronta condizioni sempre diverse: il rischio è la routine che abbassa la vigilanza. Pianificazione: tempi realistici, non ottimistici — la fretta iniziale contamina l'intero servizio.",
  },
  {
    id: "pausa-prevedibilita",
    index: 2,
    expectedSeconds: 240,
    title: "La pausa non è una debolezza, è parte del lavoro",
    kind: "dati",
    hasExplanation: true,
    notes:
      "Riconoscere i primi segnali di calo di attenzione è responsabilità professionale, non cedimento. Comportamento prevedibile: velocità costanti, intenzioni segnalate con anticipo, nessuna manovra improvvisa — la prevedibilità è una misura di sicurezza.",
  },
  {
    id: "veicolo-allestito",
    index: 3,
    expectedSeconds: 240,
    title: "Non è la tua utilitaria di famiglia",
    kind: "scenario",
    hasExplanation: true,
    notes:
      "Allestimenti e carichi modificano peso, baricentro e ingombri: adattare velocità in curva, distanze di frenata e margini. Sotto pressione operativa il professionista dimostra la capacità arrivando senza incidenti, non andando più veloce.",
  },
  {
    id: "riepilogo-professionale",
    index: 4,
    expectedSeconds: 180,
    title: "Non guidi solo per te",
    kind: "chiusura",
    hasExplanation: true,
    notes:
      "Il veicolo aziendale è anche immagine dell'organizzazione. Chiudere leggendo il riepilogo voce per voce: pianificazione, regolarità, gestione della stanchezza, comunicazione delle intenzioni, conoscenza del veicolo allestito, prevedibilità sotto pressione.",
  },
];

export const blocksBySlug: Record<string, ModuleBlock[]> = {
  "modulo-1-perche-un-corso": moduloUnoBlocks,
  "modulo-2-sicurezza-e-rischio": moduloDueBlocks,
  "modulo-3-il-conducente": moduloTreBlocks,
  "modulo-4-il-veicolo": moduloQuattroBlocks,
  "modulo-5-dinamica-del-veicolo": moduloCinqueBlocks,
  "modulo-6-tecniche-di-guida": moduloSeiBlocks,
  "modulo-7-guida-professionale": moduloSetteBlocks,
};

