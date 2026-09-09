/**
 * Static geometry of the didactic scene: one predefined left-hand curve.
 * All coordinates are SVG units inside VIEWBOX.
 */

export const VIEWBOX = { width: 1000, height: 620 };

/** Road half width (SVG units). */
export const ROAD_HALF_WIDTH = 58;

/** Centerline of the road / desired trajectory, as an SVG path. */
export const DESIRED_PATH_D =
  "M 830 600 L 830 400 C 830 210 720 140 520 140 L 120 140";

/** Discrete sampling of the desired path, used by renderers and engine. */
export interface PathPoint {
  x: number;
  y: number;
  /** Tangent direction in degrees, 0 = right. */
  heading: number;
  /** Cumulative length from start, SVG units. */
  s: number;
}

interface Segment {
  at: (t: number) => { x: number; y: number };
}

const line = (x0: number, y0: number, x1: number, y1: number): Segment => ({
  at: (t) => ({ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t }),
});

const cubic = (
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
): Segment => ({
  at: (t) => {
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const c = 3 * u * t * t;
    const d = t * t * t;
    return {
      x: a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
      y: a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
    };
  },
});

const SEGMENTS: Segment[] = [
  line(830, 600, 830, 400),
  cubic([830, 400], [830, 210], [720, 140], [520, 140]),
  line(520, 140, 120, 140),
];

const SAMPLES_PER_SEGMENT = 80;

function buildPath(): PathPoint[] {
  const raw: { x: number; y: number }[] = [];
  SEGMENTS.forEach((seg, i) => {
    const start = i === 0 ? 0 : 1;
    for (let k = start; k <= SAMPLES_PER_SEGMENT; k += 1) {
      raw.push(seg.at(k / SAMPLES_PER_SEGMENT));
    }
  });

  let s = 0;
  return raw.map((p, i) => {
    if (i > 0) {
      const prev = raw[i - 1];
      s += Math.hypot(p.x - prev.x, p.y - prev.y);
    }
    const a = raw[Math.max(0, i - 1)];
    const b = raw[Math.min(raw.length - 1, i + 1)];
    const heading = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    return { x: p.x, y: p.y, heading, s };
  });
}

export const DESIRED_POINTS: PathPoint[] = buildPath();
export const DESIRED_LENGTH =
  DESIRED_POINTS[DESIRED_POINTS.length - 1]?.s ?? 0;

/** Sample the desired trajectory at progress 0..1. */
export function samplePath(progress: number): PathPoint {
  const target = Math.min(1, Math.max(0, progress)) * DESIRED_LENGTH;
  let lo = 0;
  let hi = DESIRED_POINTS.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (DESIRED_POINTS[mid].s < target) lo = mid + 1;
    else hi = mid;
  }
  return DESIRED_POINTS[lo];
}

/** Offset copy of the centerline, used to draw the road edges. */
export function offsetPathD(offset: number): string {
  return DESIRED_POINTS.map((p, i) => {
    const rad = (p.heading * Math.PI) / 180;
    const x = p.x + Math.sin(rad) * offset;
    const y = p.y - Math.cos(rad) * offset;
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}
