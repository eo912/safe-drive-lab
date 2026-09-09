import type { VehiclePose, VehicleType, WheelLoads } from "./types";

interface VehicleRendererProps {
  pose: VehiclePose;
  vehicle: VehicleType;
  wheelLoads?: WheelLoads;
}

interface Dimensions {
  length: number;
  width: number;
  /** Half wheelbase, from center. */
  axle: number;
}

const DIMENSIONS: Record<VehicleType, Dimensions> = {
  utilitaria: { length: 74, width: 38, axle: 24 },
  suv: { length: 84, width: 42, axle: 27 },
  furgone: { length: 96, width: 44, axle: 32 },
};

const WHEEL_L = 16;
const WHEEL_W = 7;

function Wheel({
  x,
  y,
  steer = 0,
  load,
}: {
  x: number;
  y: number;
  steer?: number;
  load?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${steer})`}>
      {load !== undefined ? (
        <circle
          r={WHEEL_L * 0.9}
          fill="hsl(var(--primary))"
          opacity={0.12 + load * 0.28}
        />
      ) : null}
      <rect
        x={-WHEEL_L / 2}
        y={-WHEEL_W / 2}
        width={WHEEL_L}
        height={WHEEL_W}
        rx={2}
        fill="hsl(var(--foreground))"
      />
    </g>
  );
}

/**
 * Simplified top-down vehicle placeholder: body, two axles, four wheels
 * and an always-identifiable direction of travel arrow.
 */
export function VehicleRenderer({
  pose,
  vehicle,
  wheelLoads,
}: VehicleRendererProps) {
  const dim = DIMENSIONS[vehicle];
  const halfW = dim.width / 2;

  return (
    <g transform={`translate(${pose.x} ${pose.y}) rotate(${pose.heading})`}>
      {/* Direction of travel */}
      <g opacity={0.9}>
        <line
          x1={dim.length / 2}
          y1={0}
          x2={dim.length / 2 + 46}
          y2={0}
          stroke="hsl(var(--primary))"
          strokeWidth={3}
        />
        <polygon
          points={`${dim.length / 2 + 46},0 ${dim.length / 2 + 34},-7 ${
            dim.length / 2 + 34
          },7`}
          fill="hsl(var(--primary))"
        />
      </g>

      <g transform={`rotate(${pose.bodySlip})`}>
        {/* Axles */}
        <line
          x1={dim.axle}
          y1={-halfW}
          x2={dim.axle}
          y2={halfW}
          stroke="hsl(var(--foreground))"
          strokeWidth={3}
          opacity={0.7}
        />
        <line
          x1={-dim.axle}
          y1={-halfW}
          x2={-dim.axle}
          y2={halfW}
          stroke="hsl(var(--foreground))"
          strokeWidth={3}
          opacity={0.7}
        />

        {/* Body */}
        <rect
          x={-dim.length / 2}
          y={-halfW}
          width={dim.length}
          height={dim.width}
          rx={7}
          fill="hsl(var(--card))"
          stroke="hsl(var(--foreground))"
          strokeWidth={2.5}
        />
        {/* Front marker (windscreen side) */}
        <line
          x1={dim.length / 2 - 16}
          y1={-halfW + 4}
          x2={dim.length / 2 - 16}
          y2={halfW - 4}
          stroke="hsl(var(--foreground))"
          strokeWidth={2}
          opacity={0.5}
        />

        {/* Wheels */}
        <Wheel
          x={dim.axle}
          y={-halfW}
          steer={pose.steer}
          load={wheelLoads?.fl}
        />
        <Wheel
          x={dim.axle}
          y={halfW}
          steer={pose.steer}
          load={wheelLoads?.fr}
        />
        <Wheel x={-dim.axle} y={-halfW} load={wheelLoads?.rl} />
        <Wheel x={-dim.axle} y={halfW} load={wheelLoads?.rr} />
      </g>
    </g>
  );
}
