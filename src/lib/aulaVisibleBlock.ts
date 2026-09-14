import { useEffect, useRef, useState, type RefObject } from "react";
import { syncTrace } from "./syncTrace";

/**
 * Traccia la scheda (`<section data-block="...">`) realmente visibile a schermo
 * in Aula, indipendentemente da come ci si è arrivati: comando dalla Regia
 * oppure scroll manuale locale (tastiera / rotellina / touch).
 *
 * Fonte di verità: geometria reale delle sezioni rispetto al viewport dello
 * scroller, ricalcolata a scroll FERMO. Gli eventi intermedi dello scroll
 * fluido non decidono nulla: in passato l'ultimo callback di
 * IntersectionObserver poteva congelare un vincitore sbagliato (la scheda
 * precedente) e l'heartbeat restava indietro per sempre.
 */
export const useVisibleBlock = (
  scrollerRef: RefObject<HTMLElement>,
  fallback: string,
  enabled = true,
): string => {
  const [visible, setVisible] = useState<string | null>(null);
  const visibleRef = useRef<string | null>(null);
  visibleRef.current = visible;

  useEffect(() => {
    if (!enabled) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const compute = (reason: string) => {
      const sections = Array.from(
        scroller.querySelectorAll<HTMLElement>("section[data-block]"),
      );
      if (sections.length === 0) return;
      const root = scroller.getBoundingClientRect();
      let bestId: string | null = null;
      let best = 0;
      for (const s of sections) {
        const r = s.getBoundingClientRect();
        const overlap =
          Math.min(r.bottom, root.bottom) - Math.max(r.top, root.top);
        if (overlap > best) {
          best = overlap;
          bestId = s.dataset.block ?? null;
        }
      }
      if (!bestId || bestId === visibleRef.current) return;
      syncTrace("LOCAL_EFFECT", "useVisibleBlock.compute", {
        previousBlockId: visibleRef.current,
        resultBlockId: bestId,
        overlapPx: Math.round(best),
        reason,
        observed: sections.length,
      });
      visibleRef.current = bestId;
      setVisible(bestId);
    };

    let timer = 0;
    const schedule = (reason: string) => {
      window.clearTimeout(timer);
      // Attende la fine dello scroll fluido prima di decidere.
      timer = window.setTimeout(() => compute(reason), 180);
    };

    const onScroll = () => schedule("scroll");
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // Prima misurazione dopo il montaggio/scroll iniziale.
    schedule("init");

    return () => {
      window.clearTimeout(timer);
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [scrollerRef, enabled]);

  return visible ?? fallback;
};
