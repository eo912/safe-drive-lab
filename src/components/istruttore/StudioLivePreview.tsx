import { useEffect, useRef, useState } from "react";
import { Maximize2, X, Monitor } from "lucide-react";
import type { AulaStep } from "@/lib/aulaSync";
import { usePlaceholderVersion } from "@/lib/placeholderImages";

const STAGE_W = 1280;
const STAGE_H = 720;

type Props = {
  /** Slug del modulo (es. modulo-3-il-conducente). */
  modulo: string;
  /** Id del blocco selezionato nella scaletta. */
  blocco: string;
  step: AulaStep;
  title?: string;
};

/**
 * Anteprima live dello Studio: renderizza la schermata reale dell'Aula
 * (stessa pagina /aula/<slug> in embed) in scala 16:9, con possibilità
 * di espanderla quasi a schermo intero.
 */
export const StudioLivePreview = ({ modulo, blocco, step, title }: Props) => {
  const [expanded, setExpanded] = useState(false);
  // Ogni modifica alle immagini cambia la versione: l'iframe si ricarica
  // e l'anteprima mostra subito la foto/icona appena scelta.
  const version = usePlaceholderVersion();
  const src = `/aula/${modulo}?embed=mini&blocco=${blocco}&step=${step}&v=${version}`;

  return (
    <div className="rounded-md border border-border p-4 bg-card/40">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground inline-flex items-center gap-2">
          <Monitor className="w-3.5 h-3.5" />
          Anteprima reale della schermata
        </p>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="inline-flex items-center gap-2 rounded-md border border-primary/60 bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/20"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          Espandi
        </button>
      </div>

      <ScaledStage src={src} title={title ?? blocco} />

      {expanded && (
        <div
          className="fixed inset-0 z-[220] bg-background/95 p-4 sm:p-8 flex flex-col"
          onClick={() => setExpanded(false)}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-xs uppercase tracking-widest text-primary">
              {title ?? blocco}
            </p>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="Chiudi anteprima"
            >
              <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
          <div
            className="flex-1 min-h-0 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-[1600px]">
              <ScaledStage src={src} title={title ?? blocco} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ScaledStage = ({ src, title }: { src: string; title: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const compute = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setScale(w / STAGE_W);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="relative rounded-lg border-2 border-border bg-card aspect-video overflow-hidden"
    >
      <iframe
        key={src}
        src={src}
        title={`Anteprima ${title}`}
        tabIndex={-1}
        className="border-0 origin-top-left"
        style={{
          width: STAGE_W,
          height: STAGE_H,
          transform: `scale(${scale})`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
