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

];
