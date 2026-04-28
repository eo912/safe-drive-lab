import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  ListChecks,
  BookOpen,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  StickyNote,
  Radio,
  ListOrdered,
  Send,
  CheckCircle2,
  Coffee,
  Archive,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { modules } from "@/lib/modules";
import { blocksBySlug, type ModuleBlock } from "@/lib/moduleBlocks";
import { useAulaPublisher, type AulaStep } from "@/lib/aulaSync";
import { AulaTimer } from "@/components/istruttore/AulaTimer";
import { SlidePreview } from "@/components/istruttore/SlidePreview";
import { NotesDrawer } from "@/components/istruttore/NotesDrawer";
import { ArchiveDrawer } from "@/components/istruttore/ArchiveDrawer";
import { SlideContentsPanel } from "@/components/istruttore/SlideContentsPanel";
import { useLinkedContent } from "@/lib/instructorStorage";
import type { Resource } from "@/lib/instructorTypes";
import { buildLinearSequence, findPositionIndex } from "@/lib/courseSequence";

// "lineare" = tipo slide, telecomando + auto-publish in Aula.
// "regia"   = controllo manuale, preview separata da live (Invia in Aula).
type Mode = "lineare" | "regia";

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

  const { previewState, liveState, setPreview, publish } = useAulaPublisher(
    slug,
    blocks[0]?.id ?? "",
  );
  const [mode, setMode] = useState<Mode>("regia");
  const modeRef = useRef<Mode>(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const aulaWindowRef = useRef<Window | null>(null);

  // Sequenza lineare predefinita del corso (intro di ogni blocco + scenari/video).
  const sequence = useMemo(() => buildLinearSequence(blocks), [blocks]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Scorciatoie tastiera istruttore: N = note, A = archivio.
  // Telecomando (lineare + regia): ←/PageUp = indietro, →/PageDown/Space = avanti.
  // L'attuale gestione drawers e telecomando vive nello stesso listener per evitare conflitti.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const isEditing =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement | null)?.isContentEditable;
      if (isEditing) return;

      if (e.key === "n" || e.key === "N") {
        setNotesOpen((v) => !v);
        return;
      }
      if (e.key === "a" || e.key === "A") {
        setArchiveOpen((v) => !v);
        return;
      }
      if (import.meta.env.DEV && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        pauseRemoteRef.current?.();
        return;
      }

      if (
        e.key === "ArrowRight" ||
        e.key === "PageDown" ||
        e.key === " " ||
        e.key === "Spacebar"
      ) {
        e.preventDefault();
        stepRemoteRef.current?.(1);
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        stepRemoteRef.current?.(-1);
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Ref aggiornata sotto: contiene la callback "telecomando" stabile rispetto a stato.
  const stepRemoteRef = useRef<((dir: 1 | -1) => void) | null>(null);
  const pauseRemoteRef = useRef<(() => void) | null>(null);

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

  const previewId = previewState.blocco;
  const previewIndex = Math.max(
    0,
    blocks.findIndex((b) => b.id === previewId),
  );
  const active = blocks[previewIndex] ?? blocks[0];
  const nextBlock = blocks[previewIndex + 1];

  // Stato live (in Aula)
  const liveBlockId = liveState?.blocco ?? null;
  const liveStep = liveState?.step ?? null;

  // Stato preview vs live: stesso blocco+step → "in aula"
  const isLive =
    liveBlockId === previewState.blocco && liveStep === previewState.step;

  // Aggiornamento posizione: in modalità "lineare" pubblica subito in Aula
  // (preview e live coincidono); in "regia" aggiorna solo l'anteprima.
  const applyPosition = useCallback(
    (patch: { blocco: string; step: AulaStep }) => {
      if (modeRef.current === "lineare") {
        publish({ ...patch, paused: false });
      } else {
        setPreview(patch);
      }
    },
    [publish, setPreview],
  );

  const goToBlock = (id: string) => {
    applyPosition({ blocco: id, step: "intro" });
    setTimelineOpen(false);
  };
  const setStep = (step: AulaStep) =>
    applyPosition({ blocco: previewState.blocco, step });

  // Telecomando: muove la posizione corrente lungo la sequenza lineare.
  // In "regia" si parte dalla preview, in "lineare" si parte dal live (che coincide).
  useEffect(() => {
    stepRemoteRef.current = (dir: 1 | -1) => {
      if (sequence.length === 0) return;
      const cur = findPositionIndex(
        sequence,
        previewState.blocco,
        previewState.step,
      );
      const safe = cur === -1 ? 0 : cur;
      const next = Math.max(0, Math.min(sequence.length - 1, safe + dir));
      if (next === safe && cur !== -1) return;
      applyPosition(sequence[next]);
    };
  }, [sequence, previewState.blocco, previewState.step, applyPosition]);

  const sendToAula = () => {
    publish({
      blocco: previewState.blocco,
      step: previewState.step,
      paused: false,
    });
  };

  const aulaPaused = liveState?.paused === true;

  const pauseAula = (minutes = 5, atmosphere?: import("@/lib/pauseAtmosphere").PauseAtmosphere) => {
    publish({
      blocco: previewState.blocco,
      step: previewState.step,
      paused: true,
      pauseMinutes: minutes,
      ...(atmosphere ? { pauseAtmosphere: atmosphere } : {}),
    });
  };

  const resumeAula = () => {
    publish({
      blocco: liveState?.blocco ?? previewState.blocco,
      step: (liveState?.step ?? previewState.step) as AulaStep,
      paused: false,
    });
  };

  // ----- Media in Aula (controllato manualmente dall'istruttore) -----
  const liveMediaId = liveState?.media?.id ?? null;

  const projectMedia = (r: Resource) => {
    publish({
      blocco: previewState.blocco,
      step: previewState.step,
      media: r,
      paused: false,
    });
  };

  const hideMedia = () => {
    publish({
      blocco: liveState?.blocco ?? previewState.blocco,
      step: (liveState?.step ?? previewState.step) as AulaStep,
      media: null,
    });
  };

  // Linked content della slide attiva (per attach dall'archivio)
  const linkedAttach = useLinkedContent(slug, previewState.blocco).attach;
  const handleAttachFromArchive = (r: Resource) => {
    linkedAttach(r);
    setArchiveOpen(false);
  };

  const launchAula = () => {
    // Usa lo stato live se gia' pubblicato, altrimenti la preview corrente.
    // Cosi' la finestra Aula si apre direttamente sul punto giusto, ma
    // non viene "spinto" automaticamente nulla che l'istruttore non abbia inviato.
    const initial = liveState ?? previewState;
    const url = `/aula/${slug}?blocco=${initial.blocco}&step=${initial.step}`;
    const existing = aulaWindowRef.current;
    if (existing && !existing.closed) {
      existing.focus();
      return;
    }
    // Apertura come popup dedicato: niente toolbar, dimensione proiettore.
    // Se il browser ignora le feature, apre comunque una nuova finestra/tab.
    const features = [
      "popup=yes",
      "noopener=no", // serve per mantenere il riferimento e poter chiamare focus()
      `width=${Math.min(window.screen.availWidth, 1920)}`,
      `height=${Math.min(window.screen.availHeight, 1080)}`,
      "left=0",
      "top=0",
      "menubar=no",
      "toolbar=no",
      "location=no",
      "status=no",
    ].join(",");
    aulaWindowRef.current = window.open(url, "aula-safedrivelab", features);
  };

  // Contenuto Timeline (riusato in colonna desktop e in drawer mobile)
  const TimelineContent = (
    <nav className="p-2">
      {blocks.map((b, i) => {
        const isSelected = b.id === active.id;
        const isLiveBlock = b.id === liveBlockId;
        const isNext = mode === "regia" && b.id === nextBlock?.id;
        const isPast = i < previewIndex;
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => goToBlock(b.id)}
            className={`group w-full text-left px-3 py-2.5 rounded-md flex items-start gap-3 transition-all relative border ${
              isSelected && isLiveBlock
                ? "bg-emerald-500/10 border-emerald-500/50"
                : isSelected
                  ? "bg-primary/10 border-primary/40"
                  : isLiveBlock
                    ? "bg-emerald-500/5 border-emerald-500/30"
                    : "border-transparent hover:bg-secondary/60"
            }`}
          >
            <span
              className={`font-mono text-[11px] mt-0.5 shrink-0 ${
                isSelected
                  ? "text-primary"
                  : isLiveBlock
                    ? "text-emerald-500"
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
                  isSelected ? "text-foreground font-medium" : "text-foreground/80"
                }`}
              >
                {b.title}
              </span>
              <span className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">
                {KindLabel[b.kind]}
              </span>
            </span>
            {isLiveBlock && (
              <span className="absolute right-2 top-2 inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-emerald-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                live
              </span>
            )}
            {!isLiveBlock && isNext && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-primary">
                <ChevronRight className="w-3 h-3" />
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  // Note didattiche pre-scritte (consigli per condurre la slide)
  const TeachingNotes = (
    <div className="p-4">
      <h3 className="text-sm font-semibold mb-3 text-foreground/90">
        {active.title}
      </h3>
      <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-line">
        {active.notes}
      </p>
      <div className="mt-6 pt-4 border-t border-border/60">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
          Suggerimenti didattici · mai visibili in Aula
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* HEADER FISSO */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="h-14 px-3 md:px-6 flex items-center gap-2 md:gap-4">
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

          {/* Drawer triggers — solo sotto lg */}
          <Sheet open={timelineOpen} onOpenChange={setTimelineOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="lg:hidden inline-flex items-center gap-1.5 px-2.5 py-2 rounded-md border border-border text-xs font-medium hover:bg-secondary transition-colors shrink-0"
                aria-label="Apri scaletta"
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Scaletta</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[300px] sm:w-[360px]">
              <SheetHeader className="p-4 border-b border-border/60 text-left">
                <SheetTitle className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground font-normal">
                  Scaletta · {blocks.length} blocchi
                </SheetTitle>
              </SheetHeader>
              {TimelineContent}
            </SheetContent>
          </Sheet>

          {/* Note istruttore — drawer richiamabile (anche da tasto N) */}
          <button
            type="button"
            onClick={() => setNotesOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-md border border-border text-xs font-medium hover:bg-secondary transition-colors shrink-0"
            aria-label="Apri note istruttore"
            title="Note (N)"
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Note</span>
          </button>

          {/* Archivio — drawer richiamabile (anche da tasto A) */}
          <button
            type="button"
            onClick={() => setArchiveOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-md border border-border text-xs font-medium hover:bg-secondary transition-colors shrink-0"
            aria-label="Apri archivio"
            title="Archivio (A)"
          >
            <Archive className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Archivio</span>
          </button>

          {/* Telecomando on-screen — sempre visibile, funziona in entrambe le modalità */}
          <div className="hidden md:flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => stepRemoteRef.current?.(-1)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Posizione precedente (←)"
              title="Indietro (← / PageUp)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => stepRemoteRef.current?.(1)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Posizione successiva (→)"
              title="Avanti (→ / PageDown / Spazio)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mode switch — Lineare (slide + auto-publish) | Regia (preview + Invia in Aula) */}
          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-md border border-border">
            <span
              className={`text-xs font-mono uppercase tracking-wider transition-colors ${
                mode === "lineare" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Lineare
            </span>
            <Switch
              checked={mode === "regia"}
              onCheckedChange={(v) => setMode(v ? "regia" : "lineare")}
              aria-label="Modalità lineare o regia"
            />
            <span
              className={`text-xs font-mono uppercase tracking-wider transition-colors ${
                mode === "regia" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Regia
            </span>
          </div>

          <button
            type="button"
            onClick={launchAula}
            className="inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs md:text-sm font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Avvia Aula</span>
            <span className="sm:hidden">Aula</span>
          </button>
        </div>

        {/* Mode switch + telecomando — sotto lg */}
        <div className="lg:hidden flex items-center justify-center gap-4 px-4 pb-2">
          <div className="flex items-center gap-1 md:hidden">
            <button
              type="button"
              onClick={() => stepRemoteRef.current?.(-1)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border text-muted-foreground"
              aria-label="Indietro"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => stepRemoteRef.current?.(1)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border text-muted-foreground"
              aria-label="Avanti"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-[10px] font-mono uppercase tracking-wider ${
                mode === "lineare" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Lineare
            </span>
            <Switch
              checked={mode === "regia"}
              onCheckedChange={(v) => setMode(v ? "regia" : "lineare")}
            />
            <span
              className={`text-[10px] font-mono uppercase tracking-wider ${
                mode === "regia" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Regia
            </span>
          </div>
        </div>
      </header>

      {/* LAYOUT: 3 colonne su lg+, singola colonna sotto */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] xl:grid-cols-[280px_1fr_320px]">
        {/* SINISTRA — TIMELINE (solo desktop) */}
        <aside className="hidden lg:block lg:border-r border-border bg-card/40">
          <div className="p-4 border-b border-border/60">
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
              Timeline
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {blocks.length} blocchi
            </p>
          </div>
          {TimelineContent}
        </aside>

        {/* CENTRO — CONTENUTO (sempre visibile) */}
        <main className="p-4 sm:p-6 md:p-10 min-w-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
                Blocco {String(active.index).padStart(2, "0")}
              </span>
              <span className="text-muted-foreground text-xs">•</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                {KindLabel[active.kind]}
              </span>
              <span className="text-muted-foreground text-xs">•</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Step: <span className="text-foreground/80">{previewState.step}</span>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6">
              {active.title}
            </h2>

            <div className="flex flex-wrap gap-2 mb-6">
              {active.hasScenario && (
                <ActionButton
                  icon={Play}
                  label="Avvia scenario"
                  primary
                  active={previewState.step === "scenario"}
                  live={isLive && liveStep === "scenario"}
                  onClick={() => setStep("scenario")}
                />
              )}
              {active.hasOutcomes && (
                <ActionButton
                  icon={ListChecks}
                  label="Mostra esiti"
                  active={previewState.step === "esiti"}
                  live={isLive && liveStep === "esiti"}
                  onClick={() => setStep("esiti")}
                />
              )}
              {active.hasExplanation && (
                <ActionButton
                  icon={BookOpen}
                  label="Mostra spiegazione"
                  active={previewState.step === "spiegazione"}
                  live={isLive && liveStep === "spiegazione"}
                  onClick={() => setStep("spiegazione")}
                />
              )}
              {active.hasDeepDive && (
                <ActionButton
                  icon={ExternalLink}
                  label="Apri approfondimento"
                  active={previewState.step === "approfondimento"}
                  live={isLive && liveStep === "approfondimento"}
                  onClick={() => setStep("approfondimento")}
                />
              )}
            </div>

            {/* BANNER PAUSA AULA */}
            {aulaPaused && (
              <div className="mb-4 flex items-center justify-between gap-3 p-3 rounded-md border border-amber-500/40 bg-amber-500/5">
                <div className="flex items-center gap-2 min-w-0">
                  <Coffee className="w-4 h-4 text-amber-500 shrink-0" />
                  <p className="text-sm text-foreground/90 truncate">
                    Aula in pausa
                    {liveState?.pauseMinutes
                      ? ` · ${liveState.pauseMinutes} min`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resumeAula}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-amber-500/15 text-amber-500 text-xs font-mono uppercase tracking-wider hover:bg-amber-500/25 transition-colors shrink-0"
                >
                  <Play className="w-3 h-3" />
                  Riprendi
                </button>
              </div>
            )}

            {/* DUAL VIEW: In Aula (live) | Anteprima (preview) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              <SlidePreview
                variant="live"
                block={liveState ? blocks.find((b) => b.id === liveBlockId) ?? null : null}
                step={(liveStep ?? "intro") as AulaStep}
                onOpenWindow={launchAula}
                empty={!liveState}
              />
              <SlidePreview
                variant="preview"
                block={active}
                step={previewState.step}
              />
            </div>

            {/* INVIA IN AULA — solo in modalità Regia. In Lineare la sincronizzazione è automatica. */}
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-[11px] text-muted-foreground">
                {liveState ? (
                  <>
                    In Aula:{" "}
                    <span className="text-foreground/80 font-mono">
                      {blocks.find((b) => b.id === liveBlockId)?.title ?? "—"} · {liveStep}
                    </span>
                  </>
                ) : (
                  <span className="font-mono">Aula in attesa</span>
                )}
              </div>
              {mode === "regia" ? (
                <button
                  type="button"
                  onClick={sendToAula}
                  disabled={isLive}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold uppercase tracking-wider transition-colors ${
                    isLive
                      ? "bg-emerald-500/15 text-emerald-500 cursor-default"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {isLive ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      In Aula
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Invia in Aula
                    </>
                  )}
                </button>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-500/10 text-emerald-500 text-[11px] font-mono uppercase tracking-wider">
                  <Radio className="w-3 h-3" />
                  Sync automatica
                </span>
              )}
            </div>

            {mode === "regia" && nextBlock && (
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

            {/* CONTENUTI COLLEGATI alla slide attiva + controlli media */}
            <SlideContentsPanel
              modulo={slug}
              blocco={previewState.blocco}
              liveMediaId={liveMediaId}
              onProject={projectMedia}
              onHide={hideMedia}
              onOpenArchive={() => setArchiveOpen(true)}
            />
          </div>
        </main>

        {/* DESTRA — TIMER + SUGGERIMENTI DIDATTICI (solo desktop) */}
        <aside className="hidden lg:block lg:border-l border-border bg-card/40 overflow-y-auto">
          <div className="p-4 border-b border-border/60">
            <AulaTimer compact onRequestAulaPause={pauseAula} aulaPaused={aulaPaused} />
          </div>
          <div className="p-4 border-b border-border/60 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
              Suggerimenti didattici
            </p>
          </div>
          {TeachingNotes}
        </aside>
      </div>

      {/* DRAWERS richiamabili — note istruttore (N) e archivio (A) */}
      <NotesDrawer
        open={notesOpen}
        onOpenChange={setNotesOpen}
        modulo={slug}
        blocco={previewState.blocco}
        blockTitle={active.title}
      />
      <ArchiveDrawer
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        onAttachToSlide={handleAttachFromArchive}
      />
    </div>
  );
};

const ActionButton = ({
  icon: Icon,
  label,
  primary = false,
  active = false,
  live = false,
  onClick,
}: {
  icon: typeof Play;
  label: string;
  primary?: boolean;
  active?: boolean;
  live?: boolean;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs md:text-sm font-medium transition-colors relative ${
      live
        ? "bg-emerald-500/15 text-emerald-500 ring-2 ring-emerald-500/40"
        : active
          ? "bg-primary text-primary-foreground ring-2 ring-primary/40"
          : primary
            ? "bg-primary/90 text-primary-foreground hover:bg-primary"
            : "border border-border text-foreground/80 hover:bg-secondary hover:text-foreground"
    }`}
  >
    <Icon className="w-3.5 h-3.5" />
    {label}
    {live && (
      <span className="ml-1 inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        live
      </span>
    )}
  </button>
);

export default IstruttoreModulo;
