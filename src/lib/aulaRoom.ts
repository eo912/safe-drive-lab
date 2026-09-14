/**
 * Identità della "stanza" (coppia Regia ↔ Aula) e dell'istanza (finestra).
 *
 * Ogni evento di sincronizzazione viaggia con un roomId: due corsi diversi,
 * aperti in contemporanea sullo stesso canale realtime, non si disturbano più.
 * Il token viaggia nell'URL (`?room=...`) quando la Regia apre l'Aula, e viene
 * ricordato in localStorage per le finestre riaperte a mano sullo stesso PC.
 */

export const ROOM_PARAM = "room";
const ROOM_STORAGE = "sdl-aula-room";

const randomId = () => Math.random().toString(36).slice(2, 10);

const resolveRoomId = (): string => {
  if (typeof window === "undefined") return "srv";
  try {
    const fromUrl = new URLSearchParams(window.location.search).get(ROOM_PARAM);
    if (fromUrl) {
      localStorage.setItem(ROOM_STORAGE, fromUrl);
      return fromUrl;
    }
    const stored = localStorage.getItem(ROOM_STORAGE);
    if (stored) return stored;
    const created = randomId();
    localStorage.setItem(ROOM_STORAGE, created);
    return created;
  } catch {
    return randomId();
  }
};

/** Stanza condivisa dalla coppia Regia/Aula di questo corso. */
export const ROOM_ID = resolveRoomId();

/** Identità della singola finestra: serve a scartare gli eventi propri. */
export const INSTANCE_ID = `${ROOM_ID}-${randomId()}`;

/** Aggiunge il token stanza a un URL relativo (usato da "Avvia Aula"). */
export const withRoom = (url: string): string => {
  const [path, query = ""] = url.split("?");
  const params = new URLSearchParams(query);
  params.set(ROOM_PARAM, ROOM_ID);
  return `${path}?${params.toString()}`;
};
