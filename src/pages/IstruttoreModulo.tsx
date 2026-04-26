import { useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  ListChecks,
  BookOpen,
  ExternalLink,
  ChevronRight,
  StickyNote,
  Maximize2,
  Radio,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { modules } from "@/lib/modules";
import { blocksBySlug, type ModuleBlock } from "@/lib/moduleBlocks";
import { useAulaPublisher, type AulaStep } from "@/lib/aulaSync";
import { useRef, useState } from "react";

type Mode = "guidata" | "libera";

const KindLabel: Record<ModuleBlock["kind"], string> = {
  intro: "Intro",
  dati: "Dati",
  scenario: "Scenario",
  riflessione: "Riflessione",
  video: "Video",
  chiusura: "Chiusura",
  cta: "CTA",
};

const IstruttoreModulo = () => {
  const { slug = "" } = useParams();
  const navigate = useNavigate();

  const module = useMemo(() => modules.find((m) => m.slug === slug), [slug]);
  const blocks = blocksBySlug[slug] ?? [];

  const { state, publish } = useAulaPublisher(slug, blocks[0]?.id ?? "");
  const [mode, setMode] = useState<Mode>("guidata");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!module || blocks.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Modulo non disponibile.</p>
          <Link to="/istruttore" className="text-primary text-sm hover:underline">
            ← Torna ai moduli
          </Link>
        </div>
      </div>
    );
  }

  const activeId = state.blocco;
  const activeIndex = Math.max(
    0,
    blocks.findIndex((b) => b.id === activeId),
  );
  const active = blocks[activeIndex] ?? blocks[0];
  const nextBlock = blocks[activeIndex + 1];

  const goToBlock = (id: string) => publish({ blocco: id, step: "intro" });
  const setStep = (step: AulaStep) => publish({ step });

  const launchAula = () => {
    const url = `/aula/${slug}?blocco=${state.blocco}&step=${state.step}`;
    window.open(url, "aula-safedrivelab", "noopener");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* HEADER FISSO */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="h-14 px-4 md:px-6 flex items-center gap-4">
          <Link
            to="/istruttore"
            className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Moduli</span>
          </Link>

          <div className="h-6 w-px bg-border shrink-0" />

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-mono tracking-[0.25em] uppercase text-primary leading-none mb-0.5 flex items-center gap-2">
              <span>Modulo {String(modules.indexOf(module) + 1).padStart(2, "0")}</span>
              <span className="inline-flex items-center gap-1 text-muted-foreground/80 normal-case tracking-normal font-sans text-[10px]">
                <Radio className="w-2.5 h-2.5" />
                live
              </span>
            </p>
            <h1 className="text-sm font-semibold truncate">{module.title}</h1>
          </div>

          {/* Mode switch */}
          <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-md border border-border">
            <span
              className={`text-xs font-mono uppercase tracking-wider transition-colors ${
                mode === "guidata" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Guidata
            </span>
            <Switch
              checked={mode === "libera"}
              onCheckedChange={(v) => setMode(v ? "libera" : "guidata")}
              aria-label="Modalità guidata o libera"
            />
            <span
              className={`text-xs font-mono uppercase tracking-wider transition-colors ${
                mode === "libera" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Libera
            </span>
          </div>

          <button
            type="button"
            onClick={launchAula}
            className="inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs md:text-sm font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Avvia Aula</span>
          </button>
        </div>

        {/* Mobile mode switch */}
        <div className="md:hidden flex items-center justify-center gap-3 px-4 pb-2">
          <span
            className={`text-[10px] font-mono uppercase tracking-wider ${
              mode === "guidata" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Guidata
          </span>
          <Switch
            checked={mode === "libera"}
            onCheckedChange={(v) => setMode(v ? "libera" : "guidata")}
          />
          <span
            className={`text-[10px] font-mono uppercase tracking-wider ${
              mode === "libera" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Libera
          </span>
        </div>
      </header>

      {/* LAYOUT 3 COLONNE */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] xl:grid-cols-[280px_1fr_320px]">
        {/* SINISTRA — TIMELINE */}
        <aside className="border-b lg:border-b-0 lg:border-r border-border bg-card/40">
          <div className="p-4 border-b border-border/60">
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
              Timeline
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {blocks.length} blocchi
            </p>
          </div>
          <nav className="p-2">
            {blocks.map((b, i) => {
              const isActive = b.id === active.id;
              const isNext = mode === "guidata" && b.id === nextBlock?.id;
              const isPast = i < activeIndex;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => goToBlock(b.id)}
                  className={`group w-full text-left px-3 py-2.5 rounded-md flex items-start gap-3 transition-all relative ${
                    isActive
                      ? "bg-primary/10 border border-primary/40"
                      : "border border-transparent hover:bg-secondary/60"
                  }`}
                >
                  <span
                    className={`font-mono text-[11px] mt-0.5 shrink-0 ${
                      isActive
                        ? "text-primary"
                        : isPast
                          ? "text-muted-foreground/50"
                          : "text-muted-foreground"
                    }`}
                  >
                    {String(b.index).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-sm leading-tight truncate ${
                        isActive ? "text-foreground font-medium" : "text-foreground/80"
                      }`}
                    >
                      {b.title}
                    </span>
                    <span className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">
                      {KindLabel[b.kind]}
                    </span>
                  </span>
                  {isNext && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-primary">
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* CENTRO — CONTENUTO */}
        <main className="p-6 md:p-10 min-w-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
                Blocco {String(active.index).padStart(2, "0")}
              </span>
              <span className="text-muted-foreground text-xs">•</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                {KindLabel[active.kind]}
              </span>
              <span className="text-muted-foreground text-xs">•</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Step: <span className="text-foreground/80">{state.step}</span>
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mb-6">{active.title}</h2>

            {/* Azioni — ognuna pubblica uno step verso l'Aula */}
            <div className="flex flex-wrap gap-2 mb-8">
              {active.hasScenario && (
                <ActionButton
                  icon={Play}
                  label="Avvia scenario"
                  primary
                  active={state.step === "scenario"}
                  onClick={() => setStep("scenario")}
                />
              )}
              {active.hasOutcomes && (
                <ActionButton
                  icon={ListChecks}
                  label="Mostra esiti"
                  active={state.step === "esiti"}
                  onClick={() => setStep("esiti")}
                />
              )}
              {active.hasExplanation && (
                <ActionButton
                  icon={BookOpen}
                  label="Mostra spiegazione"
                  active={state.step === "spiegazione"}
                  onClick={() => setStep("spiegazione")}
                />
              )}
              {active.hasDeepDive && (
                <ActionButton
                  icon={ExternalLink}
                  label="Apri approfondimento"
                  active={state.step === "approfondimento"}
                  onClick={() => setStep("approfondimento")}
                />
              )}
            </div>

            {/* Area visiva principale */}
            <div className="relative rounded-lg border border-border bg-card aspect-video flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary))_0%,transparent_50%)]" />
              <div className="relative text-center px-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
                  Anteprima blocco
                </p>
                <p className="text-lg text-foreground/80 mb-4">{active.title}</p>
                <button
                  type="button"
                  onClick={launchAula}
                  className="inline-flex items-center gap-2 text-xs text-primary hover:underline font-mono uppercase tracking-wider"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  Apri in aula
                </button>
              </div>
            </div>

            {/* Suggerimento modalità guidata */}
            {mode === "guidata" && nextBlock && (
              <div className="mt-6 flex items-center justify-between gap-4 p-4 rounded-md border border-primary/30 bg-primary/5">
                <div className="min-w-0">
                  <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary mb-1">
                    Prossimo passo
                  </p>
                  <p className="text-sm text-foreground/90 truncate">
                    {nextBlock.title}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => goToBlock(nextBlock.id)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10 text-primary text-xs font-medium uppercase tracking-wider hover:bg-primary/20 transition-colors shrink-0"
                >
                  Avanti
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </main>

        {/* DESTRA — NOTE ISTRUTTORE */}
        <aside className="border-t lg:border-t-0 lg:border-l border-border bg-card/40">
          <div className="p-4 border-b border-border/60 flex items-center gap-2">
            <StickyNote className="w-3.5 h-3.5 text-primary" />
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
              Note istruttore
            </p>
          </div>
          <div className="p-4">
            <h3 className="text-sm font-semibold mb-3 text-foreground/90">
              {active.title}
            </h3>
            <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-line">
              {active.notes}
            </p>
            <div className="mt-6 pt-4 border-t border-border/60">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
                Visibili solo all'istruttore.
                <br />
                Nascoste in modalità aula.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const ActionButton = ({
  icon: Icon,
  label,
  primary = false,
  active = false,
  onClick,
}: {
  icon: typeof Play;
  label: string;
  primary?: boolean;
  active?: boolean;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
      active
        ? "bg-primary text-primary-foreground ring-2 ring-primary/40"
        : primary
          ? "bg-primary/90 text-primary-foreground hover:bg-primary"
          : "border border-border text-foreground/80 hover:bg-secondary hover:text-foreground"
    }`}
  >
    <Icon className="w-3.5 h-3.5" />
    {label}
  </button>
);

export default IstruttoreModulo;
