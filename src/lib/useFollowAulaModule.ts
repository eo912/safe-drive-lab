import { useEffect, useRef } from "react";
import type { NavigateFunction } from "react-router-dom";
import { blocksBySlug } from "./moduleBlocks";
import { useBusListener, type AulaStep } from "./aulaSync";

const VALID_STEPS = new Set<AulaStep>([
  "intro",
  "scenario",
  "esiti",
  "spiegazione",
  "approfondimento",
]);

/** Segue solo i cambi modulo dichiarati dall'Aula, senza pubblicare comandi. */
export const useFollowAulaModule = (
  currentModuleId: string,
  navigate: NavigateFunction,
) => {
  const navigatingToRef = useRef<string | null>(null);

  useEffect(() => {
    navigatingToRef.current = null;
  }, [currentModuleId]);

  useBusListener("aula_position", (event) => {
    if (event.moduleId === currentModuleId) return;
    if (!event.blockId || !event.step || !VALID_STEPS.has(event.step)) return;

    const targetBlocks = blocksBySlug[event.moduleId];
    if (!targetBlocks?.some((block) => block.id === event.blockId)) return;

    const query = new URLSearchParams({
      blocco: event.blockId,
      step: event.step,
    });
    const destination = `/istruttore/${event.moduleId}?${query.toString()}`;
    if (navigatingToRef.current === destination) return;

    navigatingToRef.current = destination;
    navigate(destination, { replace: true });
  });
};
