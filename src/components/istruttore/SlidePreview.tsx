import { Radio, Eye, Maximize2, Hourglass } from "lucide-react";
import type { ModuleBlock } from "@/lib/moduleBlocks";
import type { AulaStep } from "@/lib/aulaSync";

const KindLabel: Record<ModuleBlock["kind"], string> = {
  intro: "Intro",
  dati: "Dati",
  scenario: "Scenario",
  riflessione: "Riflessione",
  video: "Video",
  chiusura: "Chiusura",
  cta: "CTA",
};

type Variant = "live" | "preview";

type Props = {
  variant: Variant;
  block: ModuleBlock | null;
  step: AulaStep;
  onOpenWindow?: () => void;
  empty?: boolean;
};

/**
 * Slide riusabile per mostrare uno stato (live o preview) nella regia istruttore.
 * - variant="live": bordo verde, etichetta "In Aula"
 * - variant="preview": bordo giallo, etichetta "Anteprima"
 */
export const SlidePreview = ({
  variant,
  block,
  step,
  onOpenWindow,
  empty = false,
}: Props) => {
  const isLive = variant === "live";

  const borderClass = empty
    ? "border-dashed border-border"
    : isLive
      ? "border-emerald-500/70"
      : "border-primary/60";

  return (
    <div className="flex flex-col">
      {/* Titolo sezione esterno */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isLive ? (
            <>
              <span
                className={`w-2 h-2 rounded-full ${
                  empty ? "bg-muted-foreground/40" : "bg-emerald-500 animate-pulse"
                }`}
              />
              <h3
                className={`text-xs font-mono uppercase tracking-[0.25em] ${
                  empty ? "text-muted-foreground" : "text-emerald-500"
                }`}
              >
                In Aula
              </h3>
            </>
          ) : (
            <>
              <Eye className="w-3 h-3 text-primary" />
              <h3 className="text-xs font-mono uppercase tracking-[0.25em] text-primary">
                Anteprima
              </h3>
            </>
          )}
        </div>
      </div>

      {/* Box slide */}
      <div
        className={`relative rounded-lg border-2 bg-card aspect-video flex items-center justify-center overflow-hidden transition-colors ${borderClass}`}
      >
        {empty || !block ? (
          <div className="text-center px-6">
            <Hourglass className="w-5 h-5 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Aula in attesa
            </p>
            <p className="text-[11px] text-muted-foreground/70 mt-2">
              Nessun contenuto inviato
            </p>
          </div>
        ) : (
          <>
            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary))_0%,transparent_50%)]" />
            <div className="relative text-center px-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
                {KindLabel[block.kind]} · step {step}
              </p>
              <p className="text-base sm:text-lg text-foreground/90 mb-1">
                {block.title}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground/70">
                Blocco {String(block.index).padStart(2, "0")}
              </p>
            </div>
          </>
        )}

        {/* Azione finestra: solo per live */}
        {isLive && onOpenWindow && !empty && (
          <button
            type="button"
            onClick={onOpenWindow}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-sm bg-background/80 backdrop-blur text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            <Maximize2 className="w-3 h-3" />
            Finestra
          </button>
        )}

        {/* Indicatore radio live */}
        {isLive && !empty && (
          <div className="absolute top-3 right-3 inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-emerald-500">
            <Radio className="w-2.5 h-2.5" />
            live
          </div>
        )}
      </div>
    </div>
  );
};
