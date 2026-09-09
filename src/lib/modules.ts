export type Module = {
  slug: string;
  title: string;
  short: string;
  available: boolean;
};

export const modules: Module[] = [
  {
    slug: "modulo-1-perche-un-corso",
    title: "Le Tre Leve",
    short: "Le tre leve, i numeri, il perché siamo qui.",
    available: true,
  },
  {
    slug: "modulo-2-sicurezza-e-rischio",
    title: "Sicurezza e Rischio",
    short: "Somma di decisioni, catena dell'incidente, fattore umano.",
    available: true,
  },
  {
    slug: "modulo-3-il-conducente",
    title: "Il Conducente",
    short: "Posizione di guida, visione, distrazione e stanchezza.",
    available: true,
  },
  {
    slug: "modulo-4-il-veicolo",
    title: "Il Veicolo",
    short: "Pneumatici, freni, sospensioni, sistemi elettronici, controlli.",
    available: true,
  },
  {
    slug: "modulo-5-dinamica-del-veicolo",
    title: "Dinamica del Veicolo",
    short: "Trasferimenti di carico, aderenza, sottosterzo e sovrasterzo, spazi di arresto.",
    available: true,
  },
  {
    slug: "modulo-6-tecniche-di-guida",
    title: "Tecniche di Guida",
    short: "Anticipare, comandi progressivi, sequenza in curva, margini diversi.",
    available: true,
  },
  {
    slug: "modulo-7-guida-professionale",
    title: "Guida Professionale",
    short: "Ore al volante, pausa, veicolo allestito, immagine aziendale.",
    available: true,
  },
  {
    slug: "modulo-8-applicazione-est",
    title: "Applicazione EST",
    short: "Specializzazione Traforo del Monte Bianco: VST, catena, urgenza, emergenza.",
    available: true,
  },
];
