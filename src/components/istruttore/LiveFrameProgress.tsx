/**
 * Indicatore di avanzamento perimetrale della preview LIVE.
 *
 * Logica:
 *  - Un unico tratto continuo blu parte dall'angolo superiore sinistro e
 *    percorre il perimetro in senso orario.
 *  - A 0% non c'è alcun tratto; a 100% la cornice è completa.
 *  - Oltre il 100%: la cornice blu resta piena e cresce un secondo tratto
 *    rosso esterno (sforamento), senza loop né reset.
 *
 * L'SVG usa viewBox 100x100 con preserveAspectRatio="none" e
 * vectorEffect="non-scaling-stroke" per mantenere uno spessore costante a
 * prescindere dal rapporto del contenitore. pathLength=100 normalizza il
 * perimetro così che `strokeDasharray = progress*100` corrisponda alla
 * frazione percorsa.
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
  const over = Math.max(0, Math.min(1, p - 1));

  const blueColor = "hsl(var(--primary))";
  const overColor = "hsl(0 85% 58%)";

  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300 ${
        active ? "opacity-100" : "opacity-0"
      }`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* Guida di fondo (sottile, sempre visibile quando attivo) */}
      <rect
        x="0"
        y="0"
        width="100"
        height="100"
        fill="none"
        stroke="hsl(var(--border) / 0.35)"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        pathLength={100}
      />

      {/* Tratto blu continuo — top-left → clockwise */}
      {base > 0 && (
        <rect
          x="0"
          y="0"
          width="100"
          height="100"
          fill="none"
          stroke={blueColor}
          strokeWidth={3}
          strokeLinecap="butt"
          vectorEffect="non-scaling-stroke"
          pathLength={100}
          strokeDasharray={`${base * 100} 100`}
          strokeDashoffset={0}
          style={{ transition: "stroke-dasharray 600ms linear" }}
        />
      )}

      {/* Glow rosso di sforamento — secondo livello esterno, cresce da 0 a 100% */}
      {over > 0 && (
        <>
          {/* alone soft */}
          <rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill="none"
            stroke={overColor}
            strokeWidth={8}
            strokeOpacity={0.25}
            vectorEffect="non-scaling-stroke"
            pathLength={100}
            strokeDasharray={`${over * 100} 100`}
            strokeDashoffset={0}
            style={{ transition: "stroke-dasharray 600ms linear" }}
          />
          {/* tratto pieno */}
          <rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill="none"
            stroke={overColor}
            strokeWidth={3}
            vectorEffect="non-scaling-stroke"
            pathLength={100}
            strokeDasharray={`${over * 100} 100`}
            strokeDashoffset={0}
            style={{ transition: "stroke-dasharray 600ms linear" }}
          />
        </>
      )}
    </svg>
  );
};
