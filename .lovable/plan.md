
## Obiettivo

Trasformare `/istruttore/:slug` da pannello unico a **regia didattica** con 4 aree distinte. Il **LIVE** diventa la cabina minimale durante il corso; configurazione, archivio e ritmo si spostano in aree separate, accessibili da un menu laterale discreto.

## Architettura proposta

### Routing
Manteniamo `/istruttore/:slug` come shell, con una "vista" interna selezionabile (no full re-route, così lo stato Aula publisher resta attivo passando tra aree):

```
/istruttore/:slug          → vista LIVE (default)
/istruttore/:slug?view=studio
/istruttore/:slug?view=archivio
/istruttore/:slug?view=sessione
```

Lo `useAulaPublisher` resta montato a livello di pagina: cambiare vista non interrompe il corso.

### Layout shell

```text
┌────────────────────────────────────────────────────────┐
│  Header: ← Moduli │ Titolo modulo │ AulaStatusBadge    │
├──┬─────────────────────────────────────────────────────┤
│  │                                                     │
│ N│                                                     │
│ a│              AREA ATTIVA                            │
│ v│         (LIVE / STUDIO / ARCHIVIO / SESSIONE)       │
│  │                                                     │
│  │                                                     │
└──┴─────────────────────────────────────────────────────┘
```

Sidebar discreta con shadcn `Sidebar` collapsible="icon", 4 voci con icone:
- 🔴 **LIVE** (Radio)
- 🎬 **STUDIO** (Layers)
- 📚 **ARCHIVIO** (Archive)
- ⏱ **SESSIONE** (Clock)

In LIVE la sidebar parte collapsed per massimizzare focus.

## Aree

### 1) LIVE — `src/components/istruttore/views/LiveView.tsx`
Solo l'essenziale durante il corso:
- `SlidePreview` LIVE dominante (esistente)
- `SlidePreview` ANTEPRIMA secondaria (esistente)
- Pulsanti: **Invia in Aula**, **Pausa/Riprendi**, **Apri Aula**
- Telecomando ←/→/Spazio (già esistente, resta globale)
- Mini timeline orizzontale compatta
- Note didattiche pre-scritte (collapsible)
- Apertura **Note istruttore** (drawer N)

Rimosso dal LIVE: gestione media scena, archivio, formato corso, slot tempo avanzati.

### 2) STUDIO — `src/components/istruttore/views/StudioView.tsx`
Costruzione corso (offline / pre-corso):
- Lista blocchi/scene con drag&drop (riusa `TimelineContent`, esteso)
- `SceneMediaPanel` per ogni scena (esistente)
- `ContentDrawer` integrato come pannello, non drawer
- Import modulo, revisione scene
- Editor tempi previsti per slide (`useSlideTimes`)

### 3) ARCHIVIO — `src/components/istruttore/views/ArchivioView.tsx`
Biblioteca materiali (consultabile anche durante LIVE):
- Riusa logica di `ArchiveDrawer` ma come pagina full
- Filtri per tipo: immagini, video, documenti, link, atmosfere pausa
- Pulsante "Allega a slide attiva" (usa `useLinkedContent`)

### 4) SESSIONE — `src/components/istruttore/views/SessioneView.tsx`
Ritmo e struttura lezione:
- `CourseFormatPanel` (esistente) full-page
- Configurazione pause + atmosfera (sole/pioggia/neve…)
- Anteprima atmosfera pausa
- Stato sincronizzazione Aula esteso (`AulaStatusBadge` + dettagli)
- Timer corso

Durante LIVE basta ⏸ Pausa nell'header LIVE + `AulaStatusBadge` (già nell'header globale).

## Modifiche file

**Nuovi:**
- `src/components/istruttore/IstruttoreSidebar.tsx` — sidebar 4 voci
- `src/components/istruttore/views/LiveView.tsx`
- `src/components/istruttore/views/StudioView.tsx`
- `src/components/istruttore/views/ArchivioView.tsx`
- `src/components/istruttore/views/SessioneView.tsx`

**Modificati:**
- `src/pages/IstruttoreModulo.tsx` — diventa shell con `SidebarProvider`, mantiene `useAulaPublisher` e il telecomando, instrada `?view=` alla vista corrispondente, passa props condivise (publish, previewState, liveState, blocks, …) ai sotto-componenti. Tutta la logica handlers (publish/pause/sendToAula/projectMedia…) resta qui e viene passata giù.

**Drawer esistenti:** `NotesDrawer` resta accessibile via shortcut `N` da qualsiasi vista. `ArchiveDrawer` e `ContentDrawer` vengono assorbiti rispettivamente nelle viste ARCHIVIO e STUDIO (i vecchi drawer restano disponibili come fallback rapido in LIVE solo se serve, ma di default rimossi).

## Strategia incrementale

1. Step 1: estrarre la logica della pagina in un hook `useRegiaController(slug)` che ritorna `{ blocks, previewState, liveState, publish, sendToAula, pauseAula, resumeAula, projectMedia, … }` per evitare di duplicare props.
2. Step 2: creare le 4 viste come componenti che ricevono il controller via props.
3. Step 3: creare la sidebar, integrare in `IstruttoreModulo.tsx` con `SidebarProvider`.
4. Step 4: cleanup degli elementi spostati dalla vista LIVE.

## Filosofia UX rispettata

- LIVE quasi invisibile: solo preview/live, pausa, status, telecomando.
- Cambio vista non interrompe lo stream Aula.
- Sidebar collapsible — durante il corso resta una stretta colonna icone, l'istruttore può ignorarla.
- Stessa estetica dark/gold esistente.

## Conferma richiesta

Procedo con questa struttura? Confermi anche:
- **Routing**: query param `?view=` (consigliato, mantiene stato) vs sub-route `/istruttore/:slug/studio`
- **Sidebar in LIVE**: parte collapsed (consigliato) o nascosta del tutto con pulsante hamburger
