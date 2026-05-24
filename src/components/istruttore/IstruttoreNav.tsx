import { Radio, Layers, Archive, Clock } from "lucide-react";

export type RegiaView = "live" | "studio" | "archivio" | "sessione";

const ITEMS: {
  id: RegiaView;
  label: string;
  icon: typeof Radio;
  hint: string;
}[] = [
  { id: "live", label: "Live", icon: Radio, hint: "Cabina di regia" },
  { id: "studio", label: "Studio", icon: Layers, hint: "Costruzione corso" },
  { id: "archivio", label: "Archivio", icon: Archive, hint: "Materiali" },
  { id: "sessione", label: "Sessione", icon: Clock, hint: "Ritmo & pause" },
];

type Props = {
  view: RegiaView;
  onChange: (v: RegiaView) => void;
};

/**
 * Rail laterale discreto per cambiare area della Regia.
 * Pensato per restare quasi invisibile durante il LIVE.
 */
export const IstruttoreNav = ({ view, onChange }: Props) => {
  return (
    <nav
      aria-label="Aree regia"
      className="hidden md:flex flex-col items-center gap-1 py-3 px-1.5 border-r border-border bg-card/40 w-14"
    >
      {ITEMS.map((it) => {
        const Icon = it.icon;
        const active = view === it.id;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onChange(it.id)}
            title={`${it.label} · ${it.hint}`}
            aria-label={it.label}
            aria-pressed={active}
            className={`group w-10 h-10 rounded-md flex flex-col items-center justify-center transition-colors ${
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-[8px] font-mono uppercase tracking-wider mt-0.5">
              {it.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

/** Variante compatta in orizzontale per mobile (sotto md). */
export const IstruttoreNavMobile = ({ view, onChange }: Props) => {
  return (
    <nav
      aria-label="Aree regia"
      className="md:hidden flex items-center gap-1 px-2 py-1.5 border-b border-border bg-card/40 overflow-x-auto"
    >
      {ITEMS.map((it) => {
        const Icon = it.icon;
        const active = view === it.id;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onChange(it.id)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-mono uppercase tracking-wider shrink-0 transition-colors ${
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-3 h-3" />
            {it.label}
          </button>
        );
      })}
    </nav>
  );
};
