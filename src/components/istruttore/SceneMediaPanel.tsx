import { useMemo, useRef } from "react";
import {
  Layout,
  Maximize2,
  ExternalLink,
  Eye,
  EyeOff,
  Play,
  Send,
  Trash2,
  Move,
} from "lucide-react";
import {
  useSceneMedia,
  defaultPlacement,
  buildEmbedPayloads,
  type ScenePlacement,
  type SceneMediaMode,
  type SceneMediaVisibility,
} from "@/lib/sceneMedia";
import { useLinkedContent } from "@/lib/instructorStorage";
import type { Resource } from "@/lib/instructorTypes";

type Props = {
  modulo: string;
  blocco: string;
  step: string;
  /** Notifica al parent che gli embed in Aula vanno aggiornati. */
  onPublishEmbeds: (embeds: ReturnType<typeof buildEmbedPayloads>) => void;
  /** Per la modalità "overlay" usa lo stesso canale media single-shot. */
  onProjectOverlay: (r: Resource) => void;
};

const MODES: { value: SceneMediaMode; label: string; icon: typeof Layout }[] = [
  { value: "embedded", label: "Inline", icon: Layout },
  { value: "overlay", label: "Overlay", icon: Maximize2 },
  { value: "link", label: "Link", icon: ExternalLink },
];

/**
 * Pannello Regia per la gestione dei media all'interno della scena corrente.
 * Lavora sul pool `useLinkedContent(modulo, blocco)` (già esistente) e per
 * ognuno definisce un Placement (modalità, visibilità, posizione, autoplay).
 *
 * Regola UX: massimo 1 embed Aula visibile per volta (forzato qui a runtime).
 */
export const SceneMediaPanel = ({
  modulo,
  blocco,
  step,
  onPublishEmbeds,
  onProjectOverlay,
}: Props) => {
  const { items: pool } = useLinkedContent(modulo, blocco);
  const {
    items: placements,
    upsertForResource,
    update,
    removeForResource,
    findForResource,
  } = useSceneMedia(modulo, blocco, step);

  const dragRef = useRef<{
    pid: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    rect: DOMRect;
  } | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);

  const embedAulaCount = useMemo(
    () =>
      placements.filter(
        (p) => p.mode === "embedded" && p.visibility === "aula",
      ).length,
    [placements],
  );

  const setMode = (resourceId: string, mode: SceneMediaMode) => {
    upsertForResource(resourceId, { mode });
  };

  const setVisibility = (
    placement: ScenePlacement,
    visibility: SceneMediaVisibility,
  ) => {
    // Regola: massimo 1 embed in Aula. Se l'utente ne attiva un secondo,
    // sposta gli altri embed Aula → Regia.
    if (
      visibility === "aula" &&
      placement.mode === "embedded" &&
      embedAulaCount >= 1 &&
      placement.visibility !== "aula"
    ) {
      placements
        .filter(
          (p) =>
            p.id !== placement.id &&
            p.mode === "embedded" &&
            p.visibility === "aula",
        )
        .forEach((p) => update(p.id, { visibility: "regia" }));
    }
    update(placement.id, { visibility });
  };

  const ensurePlacement = (resourceId: string): ScenePlacement => {
    const existing = findForResource(resourceId);
    if (existing) return existing;
    return upsertForResource(resourceId, defaultPlacement(resourceId));
  };

  const publishCurrent = () => {
    onPublishEmbeds(buildEmbedPayloads(placements, pool));
  };

  // ---- drag (Regia → modifica posizione embed) ----
  const onPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    p: ScenePlacement,
  ) => {
    if (p.mode !== "embedded") return;
    const stage = stageRef.current;
    if (!stage) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      pid: p.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: p.x,
      origY: p.y,
      rect: stage.getBoundingClientRect(),
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = ((e.clientX - d.startX) / d.rect.width) * 100;
    const dy = ((e.clientY - d.startY) / d.rect.height) * 100;
    update(d.pid, { x: d.origX + dx, y: d.origY + dy });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const handleResize = (
    p: ScenePlacement,
    dim: "w" | "h",
    delta: number,
  ) => {
    update(p.id, { [dim]: (p[dim] as number) + delta } as Partial<ScenePlacement>);
  };

  if (!pool.length) return null;

  return (
    <section
      aria-label="Regia media scena"
      className="mt-6 border border-border/60 rounded-lg bg-card/30"
    >
      <header className="flex items-center justify-between gap-2 p-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Layout className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
            Regia media · {pool.length}
          </h3>
        </div>
        <button
          type="button"
          onClick={publishCurrent}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm bg-primary text-primary-foreground text-[10px] font-mono uppercase tracking-wider hover:bg-primary/90 transition-colors"
          title="Aggiorna gli embed nella scena Aula"
        >
          <Send className="w-3 h-3" />
          Sincronizza Aula
        </button>
      </header>

      {/* Stage proporzionale 16/9 per il drag */}
      <div className="p-3 border-b border-border/60">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
          Layout scena (trascina i riquadri)
        </p>
        <div
          ref={stageRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="relative w-full bg-background/60 border border-border/40 rounded-md overflow-hidden"
          style={{ aspectRatio: "16 / 9" }}
        >
          {placements
            .filter((p) => p.mode === "embedded")
            .map((p) => {
              const r = pool.find((x) => x.id === p.resourceId);
              if (!r) return null;
              const isAula = p.visibility === "aula";
              return (
                <div
                  key={p.id}
                  onPointerDown={(e) => onPointerDown(e, p)}
                  className={`absolute rounded-sm border text-[9px] font-mono uppercase tracking-wider flex items-center justify-center cursor-move select-none transition-colors ${
                    isAula
                      ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-500"
                      : "border-border bg-card/80 text-muted-foreground"
                  }`}
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    width: `${p.w}%`,
                    height: `${p.h}%`,
                  }}
                  title={r.title}
                >
                  <Move className="w-3 h-3 mr-1" />
                  <span className="truncate px-1">{r.title}</span>
                </div>
              );
            })}
          {placements.filter((p) => p.mode === "embedded").length === 0 && (
            <p className="absolute inset-0 flex items-center justify-center text-[11px] text-muted-foreground">
              Nessun media inline. Imposta un media su «Inline» per piazzarlo.
            </p>
          )}
        </div>
      </div>

      {/* Lista risorse: per ognuna, modalità + controlli */}
      <ul className="p-2 space-y-1.5">
        {pool.map((r) => {
          const p = findForResource(r.id);
          return (
            <li
              key={r.id}
              className="border border-border/60 rounded-md p-2.5 bg-card/40"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-sm text-foreground/90 truncate">
                  {r.title}
                </p>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground shrink-0">
                  {r.kind}
                </span>
              </div>

              {/* Modalità */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {MODES.map((m) => {
                  const Icon = m.icon;
                  const active = (p?.mode ?? "embedded") === m.value;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => {
                        ensurePlacement(r.id);
                        setMode(r.id, m.value);
                      }}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-sm border text-[10px] font-mono uppercase tracking-wider transition-colors ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {m.label}
                    </button>
                  );
                })}
              </div>

              {/* Controlli per modalità */}
              {p?.mode === "embedded" && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibility(p, p.visibility === "aula" ? "regia" : "aula")
                    }
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-sm border text-[10px] font-mono uppercase tracking-wider transition-colors ${
                      p.visibility === "aula"
                        ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-500"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p.visibility === "aula" ? (
                      <>
                        <Eye className="w-3 h-3" />
                        Aula
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" />
                        Solo regia
                      </>
                    )}
                  </button>

                  {/* Resize quick */}
                  <div className="inline-flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleResize(p, "w", -5)}
                      className="px-1.5 py-1 rounded-sm border border-border text-[10px] text-muted-foreground hover:text-foreground"
                      title="Più stretto"
                    >
                      W−
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResize(p, "w", 5)}
                      className="px-1.5 py-1 rounded-sm border border-border text-[10px] text-muted-foreground hover:text-foreground"
                      title="Più largo"
                    >
                      W+
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResize(p, "h", -5)}
                      className="px-1.5 py-1 rounded-sm border border-border text-[10px] text-muted-foreground hover:text-foreground"
                      title="Più basso"
                    >
                      H−
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResize(p, "h", 5)}
                      className="px-1.5 py-1 rounded-sm border border-border text-[10px] text-muted-foreground hover:text-foreground"
                      title="Più alto"
                    >
                      H+
                    </button>
                  </div>

                  {r.kind === "video" && (
                    <label className="inline-flex items-center gap-1 px-2 py-1 rounded-sm border border-border text-[10px] font-mono uppercase tracking-wider text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={p.autoplay}
                        onChange={(e) =>
                          update(p.id, { autoplay: e.target.checked })
                        }
                        className="w-3 h-3"
                      />
                      <Play className="w-3 h-3" />
                      Autoplay
                    </label>
                  )}
                </div>
              )}

              {p?.mode === "overlay" && (
                <button
                  type="button"
                  onClick={() => onProjectOverlay(r)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-sm bg-primary text-primary-foreground text-[10px] font-mono uppercase tracking-wider hover:bg-primary/90"
                >
                  <Maximize2 className="w-3 h-3" />
                  Apri overlay in Aula
                </button>
              )}

              {p?.mode === "link" && (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-sm border border-border text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="w-3 h-3" />
                  Apri link esterno
                </a>
              )}

              {p && (
                <button
                  type="button"
                  onClick={() => removeForResource(r.id)}
                  className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] text-muted-foreground hover:text-destructive transition-colors float-right"
                  title="Rimuovi configurazione regia"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};
