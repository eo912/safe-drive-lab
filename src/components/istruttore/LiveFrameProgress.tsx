/**
 * Barra perimetrale che percorre la cornice della preview LIVE in senso orario,
 * a partire dall'angolo superiore sinistro. Sostituisce il timer numerico come
 * strumento di "percezione del tempo" via visione periferica.
 *
 * Stati:
 *  - 0%..80%   → blu (primary)
 *  - 80%..100% → blu più intenso
 *  - oltre 100%→ cornice completa + tratto rosso che cresce sopra
 */
type Props = {
  /** Frazione 0..1 di avanzamento; >1 = sforamento. */
  progress: number;
  /** Mostra la cornice anche se progress è 0 (sottile guida). */
  active: boolean;
};

export const LiveFrameProgress = ({ progress, active }: Props) => {
  const p = Math.max(0, progress);
  const base = Math.min(1, p);
  const over = Math.max(0, p - 1);
  // Tratto blu: avanza fino al 100% lungo l'intero perimetro.
  // dasharray normalizzato in "pathLength" 100 per facilitare i calcoli.
  const intense = base >= 0.8;
  const baseColor = over > 0
    ? "hsl(var(--primary))"
    : intense
      ? "hsl(var(--primary))"
      : "hsl(var(--primary) / 0.85)";
  const baseWidth = intense || over > 0 ? 3 : 2;
  const overColor = "hsl(0 80% 55%)";
  // Tratto rosso (sforamento): cresce da 0 a 100% del perimetro, sovrapposto.
  const overDash = Math.min(100, over * 100);

  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300 ${
        active ? "opacity-100" : "opacity-0"
      }`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* Guida di fondo */}
      <rect
        x="0.5"
        y="0.5"
        width="99"
        height="99"
        fill="none"
        stroke="hsl(var(--border) / 0.4)"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
        pathLength={100}
      />
      {/* Tratto blu — parte dall'angolo top-left, avanza in senso orario */}
      <rect
        x="0.5"
        y="0.5"
        width="99"
        height="99"
        fill="none"
        stroke={baseColor}
        strokeWidth={baseWidth}
        vectorEffect="non-scaling-stroke"
        pathLength={100}
        strokeDasharray={`${base * 100} 100`}
        strokeDashoffset={0}
        style={{ transition: "stroke-dasharray 500ms linear, stroke 300ms" }}
      />
      {/* Tratto rosso di sforamento, sopra il blu */}
      {over > 0 && (
        <rect
          x="0.5"
          y="0.5"
          width="99"
          height="99"
          fill="none"
          stroke={overColor}
          strokeWidth={3}
          vectorEffect="non-scaling-stroke"
          pathLength={100}
          strokeDasharray={`${overDash} 100`}
          strokeDashoffset={0}
          style={{ transition: "stroke-dasharray 500ms linear" }}
        />
      )}
    </svg>
  );
};
