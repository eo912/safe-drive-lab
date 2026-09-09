import { DESIRED_PATH_D, ROAD_HALF_WIDTH, offsetPathD } from "./scene";

interface TrajectoryRendererProps {
  /** Real trajectory (Milestone B+). When absent only the desired one is drawn. */
  realPathD?: string;
}

/**
 * Draws the predefined left-hand curve (road surface + edges),
 * the always-visible dashed "desired" trajectory and, later,
 * the "real" trajectory.
 */
export function TrajectoryRenderer({ realPathD }: TrajectoryRendererProps) {
  return (
    <g>
      {/* Road surface */}
      <path
        d={DESIRED_PATH_D}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth={ROAD_HALF_WIDTH * 2}
        strokeLinecap="butt"
        opacity={0.55}
      />
      {/* Road edges */}
      <path
        d={offsetPathD(ROAD_HALF_WIDTH)}
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth={2}
      />
      <path
        d={offsetPathD(-ROAD_HALF_WIDTH)}
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth={2}
      />

      {/* Desired trajectory — always visible, dashed */}
      <path
        d={DESIRED_PATH_D}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={3}
        strokeDasharray="14 12"
        strokeLinecap="round"
        opacity={0.9}
      />

      {/* Real trajectory — populated in Milestone B */}
      {realPathD ? (
        <path
          d={realPathD}
          fill="none"
          stroke="hsl(var(--destructive))"
          strokeWidth={3}
          strokeLinecap="round"
        />
      ) : null}
    </g>
  );
}
