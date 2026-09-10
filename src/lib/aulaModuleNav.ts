import { useEffect, type RefObject } from "react";
import { modules } from "@/lib/modules";

/** Slug del modulo precedente nella sequenza, se esiste. */
export const prevModuleSlug = (slug: string): string | null => {
  const idx = modules.findIndex((m) => m.slug === slug);
  if (idx <= 0) return null;
  return modules[idx - 1].slug;
};

/** Rotta Aula del modulo precedente, posizionata sull'ultima scheda. */
export const prevModuleAulaUrl = (slug: string): string | null => {
  const prev = prevModuleSlug(slug);
  return prev ? `/aula/${prev}?pos=last` : null;
};

/**
 * Se la pagina è stata aperta con ?pos=last (rientro dal modulo successivo),
 * posiziona lo scroller sull'ultima scheda del modulo.
 */
export const useEnterAtLastSection = (
  scrollerRef: RefObject<HTMLDivElement>,
  enabled: boolean,
) => {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("pos") !== "last") return;

    const go = () => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const sections = scroller.querySelectorAll<HTMLElement>("section");
      const last = sections[sections.length - 1];
      last?.scrollIntoView({ behavior: "auto", block: "start" });
    };

    const t1 = window.setTimeout(go, 60);
    const t2 = window.setTimeout(go, 400);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [scrollerRef, enabled]);
};
