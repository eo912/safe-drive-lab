import { useCallback, useEffect, useRef, useState } from "react";
import type { ModuleBlock } from "./moduleBlocks";

/**
 * Tempo previsto per slide.
 * - Default per blocco: `block.expectedSeconds` (definito nel modulo).
 * - Override istruttore: salvato in localStorage `safedrivelab-slide-times:<modulo>`.
 *
 * Il cronometro live parte quando una slide entra in Aula (live) e si resetta
 * automaticamente al cambio. Nessun autoplay, nessun blocco.
 */

const STORAGE_PREFIX = "safedrivelab-slide-times:";
const DEFAULT_SECONDS = 120;

type Overrides = Record<string, number>;

const readOverrides = (modulo: string): Overrides => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + modulo);
    return raw ? (JSON.parse(raw) as Overrides) : {};
  } catch {
    return {};
  }
};

const writeOverrides = (modulo: string, ov: Overrides) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_PREFIX + modulo, JSON.stringify(ov));
  } catch {
    /* ignore */
  }
};

export const useSlideTimes = (modulo: string) => {
  const [overrides, setOverrides] = useState<Overrides>(() => readOverrides(modulo));

  const getExpected = useCallback(
    (block: ModuleBlock | null | undefined): number => {
      if (!block) return DEFAULT_SECONDS;
      const ov = overrides[block.id];
      if (typeof ov === "number" && ov > 0) return ov;
      return block.expectedSeconds ?? DEFAULT_SECONDS;
    },
    [overrides],
  );

  const setExpected = useCallback(
    (blockId: string, seconds: number) => {
      setOverrides((prev) => {
        const next = { ...prev, [blockId]: Math.max(10, Math.round(seconds)) };
        writeOverrides(modulo, next);
        return next;
      });
    },
    [modulo],
  );

  const resetExpected = useCallback(
    (blockId: string) => {
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[blockId];
        writeOverrides(modulo, next);
        return next;
      });
    },
    [modulo],
  );

  return { getExpected, setExpected, resetExpected, overrides };
};

/**
 * Cronometro per la slide attualmente in Aula.
 * - parte quando `liveKey` cambia (nuova slide live)
 * - si ferma se `liveKey` è null (Aula in attesa)
 * - se `paused` è true (Aula in pausa) il cronometro continua a girare
 *   ma il valore non viene "resettato" — l'istruttore vede il tempo reale.
 */
export const useLiveSlideTimer = (liveKey: string | null) => {
  const [seconds, setSeconds] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!liveKey) {
      startRef.current = null;
      setSeconds(0);
      return;
    }
    startRef.current = performance.now();
    setSeconds(0);
    const id = window.setInterval(() => {
      if (startRef.current == null) return;
      setSeconds(Math.floor((performance.now() - startRef.current) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [liveKey]);

  return seconds;
};

export const formatMMSS = (s: number) => {
  const sign = s < 0 ? "-" : "";
  const abs = Math.abs(s);
  const m = Math.floor(abs / 60);
  const sec = abs % 60;
  return `${sign}${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};
