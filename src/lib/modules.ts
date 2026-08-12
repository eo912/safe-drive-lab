export type Module = {
  slug: string;
  title: string;
  short: string;
  available: boolean;
};

export const modules: Module[] = [
  {
    slug: "perche-la-guida-sicura",
    title: "Cultura della Sicurezza",
    short: "Rischio, prevenzione, catena degli eventi.",
    available: true,
  },
  {
    slug: "il-conducente",
    title: "Il Conducente",
    short: "Postura, osservazione, attenzione, stato psicofisico.",
    available: false,
  },
  {
    slug: "il-veicolo",
    title: "Il Veicolo",
    short: "Pneumatici, freni, sistemi elettronici, controlli.",
    available: false,
  },
  {
    slug: "dinamica-del-veicolo",
    title: "Dinamica del Veicolo",
    short: "Aderenza, trasferimenti di carico, frenata, curva.",
    available: false,
  },
  {
    slug: "tecniche-di-guida",
    title: "Tecniche di Guida",
    short: "Anticipazione, distanza, fluidità, gestione della curva.",
    available: false,
  },
  {
    slug: "guida-professionale",
    title: "Guida Professionale",
    short: "Pianificazione, pressione operativa, prevedibilità.",
    available: false,
  },
  {
    slug: "applicazione-est",
    title: "Applicazione EST",
    short: "Applicazione dei moduli al contesto operativo EST.",
    available: false,
  },
];
