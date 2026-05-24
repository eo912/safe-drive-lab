import { useEffect, useRef, useState } from "react";
import { Radio, Eye, Maximize2, Hourglass, Coffee, Send } from "lucide-react";
import type { ModuleBlock } from "@/lib/moduleBlocks";
import type { AulaStep } from "@/lib/aulaSync";
import type { PauseAtmosphere } from "@/lib/pauseAtmosphere";

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
  /** Slug del modulo (per costruire la URL embed dell'iframe). */
  modulo: string;
  block: ModuleBlock | null;
  step: AulaStep;
  /** Solo per live: stato pausa Aula. */
  paused?: boolean;
  /** Atmosfera pausa selezionata (passata all'iframe per coerenza preview). */
  pauseAtmosphere?: PauseAtmosphere | null;
  onOpenWindow?: () => void;
  onSend?: () => void;
  empty?: boolean;
};

/**
 * Mini-stage che mostra la slide reale dell'Aula in scala, riusando la stessa
 * pagina /aula/<slug> in modalità ?embed=mini (pointer-events disattivati,
 * nessun listener, posizione frozen via querystring).
 *
 * In modalità "live" mostra esattamente cosa vedono in Aula i discenti.
 * In "preview" mostra cosa l'istruttore sta preparando (in attesa di "Invia in Aula").
 *
 * Quando l'Aula è in pausa, il riquadro live mostra la schermata pausa.
 */
export const SlidePreview = ({
  variant,
  modulo,
  block,
  step,
  paused = false,
  onOpenWindow,
  onSend,
  empty = false,
}: Props) => {
  const isLive = variant === "live";
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);

  // Calcolo scala: l'iframe interno è renderizzato a 1280x720 (formato proiettore)
  // e scalato per riempire il box anteprima mantenendo il 16:9.
  const STAGE_W = 1280;
  const STAGE_H = 720;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const compute = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return;
      setScale(rect.width / STAGE_W);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const borderClass = empty
    ? "border-dashed border-border"
    : isLive
      ? "border-emerald-500/70"
      : "border-primary/60";

  const showStage = !empty && block && !paused;
  // Live = rendering "mini" (semplificato), Preview = rendering "preview" (minimo)
  const embedKind = isLive ? "mini" : "preview";
  const embedUrl = block
    ? `/aula/${modulo}?embed=${embedKind}&blocco=${block.id}&step=${step}${paused ? "&pausa=1" : ""}`
    : null;

  return (
    <div className="flex flex-col">
      {/* Header sezione */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isLive ? (
            <>
              <span
                className={`w-2 h-2 rounded-full ${
                  empty
                    ? "bg-muted-foreground/40"
                    : paused
                      ? "bg-amber-500 animate-pulse"
                      : "bg-emerald-500 animate-pulse"
                }`}
              />
              <h3
                className={`text-xs font-mono uppercase tracking-[0.25em] ${
                  empty
                    ? "text-muted-foreground"
                    : paused
                      ? "text-amber-500"
                      : "text-emerald-500"
                }`}
              >
                {paused ? "Pausa attiva" : "In Aula"}
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

        {!isLive && onSend && block && (
          <button
            type="button"
            onClick={onSend}
            className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
            title="Invia questa slide in Aula"
          >
            <Send className="w-3 h-3" />
            Invia
          </button>
        )}
      </div>

      {/* Box stage 16:9 */}
      <div
        ref={containerRef}
        className={`relative rounded-lg border-2 bg-card aspect-video overflow-hidden transition-colors ${borderClass}`}
      >
        {/* PAUSA: solo nel riquadro live */}
        {isLive && paused && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-950/40 via-background to-background">
            {/* Mini riproduzione della schermata pausa via iframe (atmosphere default) */}
            {block && (
              <iframe
                key={`pause-${block.id}`}
                src={`/aula/${modulo}?embed=mini&blocco=${block.id}&step=${step}&pausa=1`}
                title="Aula in pausa"
                aria-hidden="true"
                tabIndex={-1}
                className="border-0 origin-top-left"
                style={{
                  width: STAGE_W,
                  height: STAGE_H,
                  transform: `scale(${scale})`,
                  pointerEvents: "none",
                }}
              />
            )}
            <div className="absolute top-2 left-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-sm bg-amber-500/20 backdrop-blur text-[9px] font-mono uppercase tracking-wider text-amber-400">
              <Coffee className="w-2.5 h-2.5" />
              Pausa attiva
            </div>
          </div>
        )}

        {/* STAGE NORMALE */}
        {showStage && embedUrl && (
          <iframe
            key={`${variant}-${block.id}-${step}`}
            src={embedUrl}
            title={`${variant === "live" ? "Aula live" : "Anteprima"} ${block.title}`}
            aria-hidden="true"
            tabIndex={-1}
            className="border-0 origin-top-left"
            style={{
              width: STAGE_W,
              height: STAGE_H,
              transform: `scale(${scale})`,
              pointerEvents: "none",
            }}
          />
        )}

        {/* PLACEHOLDER VUOTO */}
        {(empty || !block) && !paused && (
          <div className="absolute inset-0 flex items-center justify-center text-center px-6">
            <div>
              <Hourglass className="w-5 h-5 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                {isLive ? "Aula in attesa" : "Nessuna slide selezionata"}
              </p>
              <p className="text-[11px] text-muted-foreground/70 mt-2">
                {isLive ? "Nessun contenuto inviato" : "Scegli una slide dalla scaletta"}
              </p>
            </div>
          </div>
        )}

        {/* AZIONI OVERLAY (sopra l'iframe) */}
        {isLive && onOpenWindow && !empty && (
          <button
            type="button"
            onClick={onOpenWindow}
            className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1.5 px-2 py-1 rounded-sm bg-background/80 backdrop-blur text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            <Maximize2 className="w-3 h-3" />
            Finestra
          </button>
        )}

        {isLive && !empty && !paused && (
          <div className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-background/70 backdrop-blur text-[9px] font-mono uppercase tracking-wider text-emerald-500">
            <Radio className="w-2.5 h-2.5" />
            live
          </div>
        )}
      </div>

      {/* Caption sotto */}
      {block && !empty && (
        <div className="mt-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          <span>Blocco {String(block.index).padStart(2, "0")}</span>
          <span>·</span>
          <span>{KindLabel[block.kind]}</span>
          <span>·</span>
          <span className="text-foreground/70 truncate">{block.title}</span>
        </div>
      )}
    </div>
  );
};
