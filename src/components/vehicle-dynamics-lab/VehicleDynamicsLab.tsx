import { useMemo, useState } from "react";
import { SimulationControls } from "./SimulationControls";
import { TrajectoryRenderer } from "./TrajectoryRenderer";
import { VehicleRenderer } from "./VehicleRenderer";
import { computeState } from "./ScenarioEngine";
import { VIEWBOX } from "./scene";
import { DEFAULT_CONFIG, type SimulationConfig } from "./types";

/**
 * VEHICLE DYNAMICS LAB — Milestone A.
 * Static, readable scene: predefined left-hand curve, desired trajectory,
 * simplified top-down vehicle. No animation, no under/oversteer logic yet.
 */
export function VehicleDynamicsLab() {
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const state = useMemo(() => computeState(config), [config]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="rounded-xl border border-border bg-card/40 p-3">
        <svg
          viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
          className="h-full w-full"
          role="img"
          aria-label="Curva a sinistra con traiettoria desiderata e veicolo semplificato"
        >
          <TrajectoryRenderer />
          <VehicleRenderer
            pose={state.pose}
            vehicle={config.vehicle}
            wheelLoads={state.wheelLoads}
          />
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-4 px-1 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="inline-block h-0 w-6 border-t-2 border-dashed border-primary" />
            Traiettoria desiderata
          </span>
          <span>Curva a sinistra · scena statica</span>
        </div>
      </div>

      <aside className="rounded-xl border border-border bg-card/40 p-4">
        <SimulationControls config={config} onChange={setConfig} />
      </aside>
    </div>
  );
}

export default VehicleDynamicsLab;
