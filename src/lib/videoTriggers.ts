/**
 * Video richiamabili manualmente dall'istruttore.
 *
 * Ogni voce ha un id stabile: quando l'id è presente in
 * `AulaState.revealedVideos` l'Aula mostra l'iframe reale, altrimenti
 * resta un segnaposto neutro (nessun autoplay, nessun caricamento).
 */
export type VideoTrigger = {
  id: string;
  /** Etichetta mostrata in Regia */
  label: string;
  modulo: string;
  blocco: string;
  /** Nota breve per la Regia */
  hint?: string;
};

export const VIDEO_TRIGGERS: VideoTrigger[] = [
  {
    id: "m3-cintura-crashtest",
    label: "Crash test ADAC — cinture posteriori",
    modulo: "modulo-3-il-conducente",
    blocco: "posizione-guida",
    hint: "Hotspot «Cintura»",
  },
  {
    id: "m4-esp-generico",
    label: "ESP — spiegazione generale",
    modulo: "modulo-4-il-veicolo",
    blocco: "sistemi-elettronici",
  },
  {
    id: "m4-esp-bosch",
    label: "ESP Bosch — come funziona",
    modulo: "modulo-4-il-veicolo",
    blocco: "sistemi-elettronici",
  },
  {
    id: "m1-mistakes",
    label: "The Speed ad — Mistakes",
    modulo: "modulo-1-perche-un-corso",
    blocco: "video-mistakes",
  },
];

export const videoTriggersFor = (modulo: string, blocco: string) =>
  VIDEO_TRIGGERS.filter((v) => v.modulo === modulo && v.blocco === blocco);
