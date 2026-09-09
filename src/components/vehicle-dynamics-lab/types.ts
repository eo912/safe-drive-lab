export type VehicleType = "utilitaria" | "suv" | "furgone";
export type SpeedKmh = 50 | 70 | 90;
export type Surface = "asciutto" | "bagnato";
export type Load = "scarico" | "carico";
export type Phenomenon = "sottosterzo" | "sovrasterzo";
export type Level = "LOW" | "MEDIUM" | "HIGH";

export interface SimulationConfig {
  vehicle: VehicleType;
  speed: SpeedKmh;
  surface: Surface;
  load: Load;
  esp: boolean;
  phenomenon: Phenomenon;
  compareEsp: boolean;
}

export const DEFAULT_CONFIG: SimulationConfig = {
  vehicle: "utilitaria",
  speed: 70,
  surface: "asciutto",
  load: "scarico",
  esp: true,
  phenomenon: "sottosterzo",
  compareEsp: false,
};

/** Pose of the vehicle in scene coordinates (SVG units). */
export interface VehiclePose {
  x: number;
  y: number;
  /** Direction of travel, degrees, 0 = pointing right. */
  heading: number;
  /** Body rotation relative to heading (slip angle), degrees. */
  bodySlip: number;
  /** Front wheel steering angle, degrees. */
  steer: number;
}

/** Relative wheel load indicators, 0..1 (no fake physical units). */
export interface WheelLoads {
  fl: number;
  fr: number;
  rl: number;
  rr: number;
}

export interface ScenarioState {
  pose: VehiclePose;
  wheelLoads: WheelLoads;
  /** 0..1 progress along the desired trajectory. */
  progress: number;
  grip: Level;
  gripDemand: Level;
}
