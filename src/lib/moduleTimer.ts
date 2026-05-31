import { useCallback, useEffect, useState } from "react";

/**
 * Timer del modulo: inizia al primo invio in Aula e persiste localmente
 * (per slug del modulo). NON è invasivo: l'istruttore lo legge a colpo d'occhio.
 *
 * Predisposto per evoluzione futura: ogni scena potrà avere durata propria,
 * questa API resta stabile e si limita a tempo trascorso del modulo.
 */
const KEY_PREFIX = "safedrivelab-module-start:";

const readStart = (slug: string): number | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY_PREFIX + slug);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
};

export const useModuleTimer = (slug: string, hasLive: boolean) => {
  const [start, setStart] = useState<number | null>(() => readStart(slug));
  const [now, setNow] = useState<number>(() => Date.now());

  // Avvio: alla prima slide pubblicata, salva timestamp se non presente.
  useEffect(() => {
    if (!hasLive || start != null) return;
    const ts = Date.now();
    try {
      localStorage.setItem(KEY_PREFIX + slug, String(ts));
    } catch {
      /* ignore */
    }
    setStart(ts);
  }, [hasLive, slug, start]);

  // Tick 1s solo se c'è uno start, per evitare re-render inutili.
  useEffect(() => {
    if (start == null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [start]);

  const elapsed = start != null ? Math.max(0, Math.floor((now - start) / 1000)) : 0;

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(KEY_PREFIX + slug);
    } catch {
      /* ignore */
    }
    setStart(null);
  }, [slug]);

  return { elapsed, started: start != null, reset };
};

export const formatTimerMMSS = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};
