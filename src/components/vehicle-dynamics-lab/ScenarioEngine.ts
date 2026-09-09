/**
 * ScenarioEngine — placeholder (Milestone A).
 *
 * In Milestone B+ this will produce the animated divergence between the
 * desired and the real trajectory (sottosterzo / sovrasterzo, ESP on/off).
 * For now it only returns the static pose on the desired trajectory,
 * with neutral relative indicators. No numeric "pseudo-scientific" values.
 */
import { samplePath } from "./scene";
import type { ScenarioState, SimulationConfig } from "./types";

/** Progress at which the car sits in the static scene (curve entry). */
export const STATIC_PROGRESS = 0.22;

export function computeState(
  _config: SimulationConfig,
  progress: number = STATIC_PROGRESS,
): ScenarioState {
  const point = samplePath(progress);

  return {
    pose: {
      x: point.x,
      y: point.y,
      heading: point.heading,
      bodySlip: 0,
      steer: 0,
    },
    wheelLoads: { fl: 0.5, fr: 0.5, rl: 0.5, rr: 0.5 },
    progress,
    grip: "MEDIUM",
    gripDemand: "LOW",
  };
}
