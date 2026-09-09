import { VehicleDynamicsLab } from "@/components/vehicle-dynamics-lab/VehicleDynamicsLab";

export default function VehicleDynamicsLabPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <header className="mb-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
          Safe Drive Lab
        </p>
        <h1 className="mt-1 text-2xl font-semibold md:text-3xl">
          Vehicle Dynamics Lab
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Simulatore didattico — Milestone A: scena statica.
        </p>
      </header>
      <VehicleDynamicsLab />
    </main>
  );
}
