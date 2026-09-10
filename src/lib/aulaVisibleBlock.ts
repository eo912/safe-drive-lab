import { useEffect, useState, type RefObject } from "react";

/**
 * Traccia la scheda (`<section data-block="...">`) realmente visibile a schermo
 * in Aula, indipendentemente da come ci si è arrivati: comando dalla Regia
 * oppure scroll manuale locale (tastiera / rotellina / touch).
 *
 * Serve per alimentare l'heartbeat verso la Regia con la posizione REALE.
 */
export const useVisibleBlock = (
  scrollerRef: RefObject<HTMLElement>,
  fallback: string,
  enabled = true,
): string => {
  const [visible, setVisible] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const scroller = scrollerRef.current;
    if (!scroller || typeof IntersectionObserver === "undefined") return;

    const sections = Array.from(
      scroller.querySelectorAll<HTMLElement>("section[data-block]"),
    );
    if (sections.length === 0) return;

    const ratios = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.block;
          if (id) ratios.set(id, entry.intersectionRatio);
        }
        let bestId: string | null = null;
        let best = 0;
        ratios.forEach((ratio, id) => {
          if (ratio > best) {
            best = ratio;
            bestId = id;
          }
        });
        if (bestId) setVisible(bestId);
      },
      {
        root: scroller,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [scrollerRef, enabled]);

  return visible ?? fallback;
};
