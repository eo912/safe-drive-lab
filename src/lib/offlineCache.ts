/**
 * Copia locale dei dati letti dal backend, così l'app resta utilizzabile in
 * aula anche senza connessione. Nessun dato sensibile: solo associazioni
 * segnaposto→file e indirizzi firmati con la loro scadenza.
 */

const read = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* spazio esaurito: la cache è opzionale */
  }
};

const PATHS_KEY = "sdl:offline:placeholder-paths";
const SIGNED_KEY = "sdl:offline:signed-urls";

export type SignedEntry = { url: string; exp: number };

export const loadCachedPaths = () => read<Record<string, string>>(PATHS_KEY, {});
export const saveCachedPaths = (paths: Record<string, string>) =>
  write(PATHS_KEY, paths);

export const loadCachedSigned = () => {
  const all = read<Record<string, SignedEntry>>(SIGNED_KEY, {});
  const now = Date.now();
  const valid: Record<string, SignedEntry> = {};
  for (const [path, entry] of Object.entries(all)) {
    if (entry && entry.exp > now) valid[path] = entry;
  }
  return valid;
};

export const saveCachedSigned = (signed: Record<string, SignedEntry>) =>
  write(SIGNED_KEY, signed);
