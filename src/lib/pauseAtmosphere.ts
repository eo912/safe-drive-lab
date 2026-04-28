// Atmosfere predefinite per la schermata di pausa Aula.
// Nessuna integrazione meteo reale: l'istruttore sceglie manualmente.

import bgSun from "@/assets/pause/bg-sun.jpg";
import bgRain from "@/assets/pause/bg-rain.jpg";
import bgSnow from "@/assets/pause/bg-snow.jpg";
import bgSpring from "@/assets/pause/bg-spring.jpg";
import bgSummer from "@/assets/pause/bg-summer.jpg";
import bgAutumn from "@/assets/pause/bg-autumn.jpg";
import bgWinter from "@/assets/pause/bg-winter.jpg";

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
  // Tinta ambiente: sovrapposta al bg per coerenza colore con la tazza.
  overlay: string;
  // Caratteristiche particellari opzionali (pioggia/neve)
  particles?: "rain" | "snow";
}[] = [
  {
    id: "sun",
    label: "Sole",
    bg: bgSun,
    overlay:
      "linear-gradient(180deg, hsl(35 60% 8% / 0.55) 0%, hsl(30 50% 6% / 0.7) 100%)",
  },
  {
    id: "rain",
    label: "Pioggia",
    bg: bgRain,
    overlay:
      "linear-gradient(180deg, hsl(215 30% 8% / 0.55) 0%, hsl(220 35% 6% / 0.75) 100%)",
    particles: "rain",
  },
  {
    id: "snow",
    label: "Neve",
    bg: bgSnow,
    overlay:
      "linear-gradient(180deg, hsl(210 20% 10% / 0.5) 0%, hsl(215 25% 7% / 0.7) 100%)",
    particles: "snow",
  },
  {
    id: "spring",
    label: "Primavera",
    bg: bgSpring,
    overlay:
      "linear-gradient(180deg, hsl(140 25% 8% / 0.55) 0%, hsl(150 30% 6% / 0.72) 100%)",
  },
  {
    id: "summer",
    label: "Estate",
    bg: bgSummer,
    overlay:
      "linear-gradient(180deg, hsl(190 30% 8% / 0.5) 0%, hsl(200 35% 6% / 0.7) 100%)",
  },
  {
    id: "autumn",
    label: "Autunno",
    bg: bgAutumn,
    overlay:
      "linear-gradient(180deg, hsl(20 45% 7% / 0.55) 0%, hsl(15 50% 5% / 0.75) 100%)",
  },
  {
    id: "winter",
    label: "Inverno",
    bg: bgWinter,
    overlay:
      "linear-gradient(180deg, hsl(220 25% 8% / 0.55) 0%, hsl(225 30% 5% / 0.78) 100%)",
    particles: "snow",
  },
];

export const getAtmosphere = (id?: PauseAtmosphere | null) =>
  PAUSE_ATMOSPHERES.find((a) => a.id === (id ?? "sun")) ?? PAUSE_ATMOSPHERES[0];
