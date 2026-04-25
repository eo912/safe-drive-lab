export type Module = {
  slug: string;
  title: string;
  short: string;
  available: boolean;
};

export const modules: Module[] = [
  {
    slug: "perche-la-guida-sicura",
    title: "Perché la guida sicura",
    short: "Dati, realtà, consapevolezza.",
    available: true,
  },
  {
    slug: "il-conducente",
    title: "Il conducente",
    short: "Percezione, reazione, limiti umani.",
    available: false,
  },
  {
    slug: "il-veicolo",
    title: "Il veicolo",
    short: "Freni, aderenza, elettronica.",
    available: false,
  },
  {
    slug: "fisica-della-guida",
    title: "La fisica della guida",
    short: "Forze, inerzia, traiettorie.",
    available: false,
  },
  {
    slug: "condizioni-reali",
    title: "Le condizioni reali",
    short: "Pioggia, neve, notte, stanchezza.",
    available: false,
  },
  {
    slug: "tecnica",
    title: "La tecnica",
    short: "Frenata, curva, sorpasso.",
    available: false,
  },
];
