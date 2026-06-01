// Atmosfere predefinite per la schermata di pausa Aula.
// Ogni atmosfera è una singola fotografia ambientale coerente (POV da un tavolino
// con tazzina in primo piano e strada tranquilla sullo sfondo). Nessuna sovrapposizione
// grafica: la scena è la fotografia.

import sceneSun from "@/assets/pause/scene-sun.jpg";
import sceneRain from "@/assets/pause/scene-rain.jpg";
import sceneSnow from "@/assets/pause/scene-snow.jpg";
import sceneAutumn from "@/assets/pause/scene-autumn.jpg";

export type PauseAtmosphere =
  | "sun"
  | "rain"
  | "snow"
  | "spring"
  | "summer"
  | "autumn"
  | "winter";

export const PAUSE_ATMOSPHERES: {
  id: PauseAtmosphere;
  label: string;
  bg: string;
  // Overlay tonale minimo: la fotografia deve restare protagonista.
  overlay: string;
  particles?: "rain" | "snow";
}[] = [
  {
    id: "sun",
    label: "Sole",
    bg: sceneSun,
    overlay:
      "linear-gradient(180deg, hsl(0 0% 0% / 0.05) 0%, hsl(0 0% 0% / 0.25) 100%)",
  },
  {
    id: "rain",
    label: "Pioggia",
    bg: sceneRain,
    overlay:
      "linear-gradient(180deg, hsl(215 20% 5% / 0.1) 0%, hsl(220 25% 4% / 0.3) 100%)",
  },
  {
    id: "snow",
    label: "Neve",
    bg: sceneSnow,
    overlay:
      "linear-gradient(180deg, hsl(210 15% 8% / 0.08) 0%, hsl(215 20% 5% / 0.28) 100%)",
  },
  {
    id: "spring",
    label: "Primavera",
    bg: sceneSun,
    overlay:
      "linear-gradient(180deg, hsl(0 0% 0% / 0.05) 0%, hsl(0 0% 0% / 0.25) 100%)",
  },
  {
    id: "summer",
    label: "Estate",
    bg: sceneSun,
    overlay:
      "linear-gradient(180deg, hsl(0 0% 0% / 0.05) 0%, hsl(0 0% 0% / 0.25) 100%)",
  },
  {
    id: "autumn",
    label: "Autunno",
    bg: sceneAutumn,
    overlay:
      "linear-gradient(180deg, hsl(20 30% 4% / 0.08) 0%, hsl(15 35% 3% / 0.3) 100%)",
  },
  {
    id: "winter",
    label: "Inverno",
    bg: sceneSnow,
    overlay:
      "linear-gradient(180deg, hsl(220 20% 6% / 0.1) 0%, hsl(225 25% 4% / 0.32) 100%)",
  },
];

export const getAtmosphere = (id?: PauseAtmosphere | null) =>
  PAUSE_ATMOSPHERES.find((a) => a.id === (id ?? "sun")) ?? PAUSE_ATMOSPHERES[0];
