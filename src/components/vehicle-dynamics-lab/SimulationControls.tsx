import type {
  Load,
  Phenomenon,
  SimulationConfig,
  SpeedKmh,
  Surface,
  VehicleType,
} from "./types";

interface SimulationControlsProps {
  config: SimulationConfig;
  onChange: (next: SimulationConfig) => void;
}

function Group<T extends string | number | boolean>({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onSelect: (v: T) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onSelect(opt.value)}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SimulationControls({
  config,
  onChange,
}: SimulationControlsProps) {
  const set = <K extends keyof SimulationConfig>(
    key: K,
    value: SimulationConfig[K],
  ) => onChange({ ...config, [key]: value });

  return (
    <div className="space-y-5">
      <Group<VehicleType>
        label="Veicolo"
        value={config.vehicle}
        onSelect={(v) => set("vehicle", v)}
        options={[
          { value: "utilitaria", label: "Utilitaria" },
          { value: "suv", label: "SUV" },
          { value: "furgone", label: "Furgone" },
        ]}
      />
      <Group<SpeedKmh>
        label="Velocità"
        value={config.speed}
        onSelect={(v) => set("speed", v)}
        options={[
          { value: 50, label: "50 km/h" },
          { value: 70, label: "70 km/h" },
          { value: 90, label: "90 km/h" },
        ]}
      />
      <Group<Surface>
        label="Fondo"
        value={config.surface}
        onSelect={(v) => set("surface", v)}
        options={[
          { value: "asciutto", label: "Asciutto" },
          { value: "bagnato", label: "Bagnato" },
        ]}
      />
      <Group<Load>
        label="Carico"
        value={config.load}
        onSelect={(v) => set("load", v)}
        options={[
          { value: "scarico", label: "Scarico" },
          { value: "carico", label: "Carico" },
        ]}
      />
      <Group<boolean>
        label="ESP"
        value={config.esp}
        onSelect={(v) => set("esp", v)}
        options={[
          { value: true, label: "ON" },
          { value: false, label: "OFF" },
        ]}
      />
      <Group<Phenomenon>
        label="Fenomeno"
        value={config.phenomenon}
        onSelect={(v) => set("phenomenon", v)}
        options={[
          { value: "sottosterzo", label: "Sottosterzo" },
          { value: "sovrasterzo", label: "Sovrasterzo" },
        ]}
      />

      <button
        type="button"
        disabled
        className="w-full cursor-not-allowed rounded-md border border-dashed border-border px-3 py-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground"
      >
        Confronta ESP · in arrivo
      </button>
    </div>
  );
}
