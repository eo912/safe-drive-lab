# Piano — Overlay "telefono che squilla" per il Modulo 2

Nuova funzionalità didattica nel nodo "Notifica" della catena dell'incidente: il docente, dalla regia (tastiera/telecomando), fa prima squillare un telefono (solo audio), poi, quando vuole, fa comparire il telefono al centro dello schermo. Ripetibile sulla seconda chiamata già esistente. Nessuna modifica alla logica narrativa attuale (Mamma/Moglie random, callback, popup "28 metri").

## Componenti

1. **`src/components/modulo2/PhoneCallOverlay.tsx`** — componente standalone e riutilizzabile:
   - Prop: `callerName: string` (es. "Mamma" / "Moglie"), `visible: boolean`, opzionale `onAnswer` / `onDecline` per futuri usi.
   - Rendering: telefono centrato (non fullscreen), cornice nera stile telefono fisico, dentro schermata di chiamata Android: sfondo a gradiente scuro, nome chiamante grande, pulsanti verde (rispondi) e rosso (rifiuta). Nome come testo dinamico, mai immagine.
   - Dietro il telefono: backdrop con blur + scurimento dello slide sottostante.
   - Animazione: comparsa con scale/fade + leggera vibrazione/oscillazione della cornice mentre "squilla".
   - Riutilizzabile in altri moduli passando solo le prop, come già fatto con `HotspotScene`.

2. **Audio suoneria** — piccolo file mp3 di suoneria telefonica in `src/assets/` (generato o royalty-free), riprodotto in loop finché non interviene il docente. Fallback: se il file non è presente, sintetizzatore WebAudio con tono bzzz/ring. Gestito da un piccolo helper `useRingtone()` (play/stop), così audio e visivo restano indipendenti.

3. **Stato nella scena** — in `CatenaIncidenteScene.tsx`, fase nuova `ringing` (solo audio) e flag `phoneVisible` (overlay visibile). Sequenza per chiamata a toggle: `idle → ringing → visible → idle`. La stessa sequenza si riarma quando la logica esistente attiva la "seconda chiamata".

## Trigger da regia

Un solo tasto, scelto per non collidere con quelli esistenti (frecce, Spazio, PageUp/Down, B, P, N, A, C, F):

- **Invio / OK** (tasto centrale del D-pad): gestisce l'intera sequenza a toggle.
- Logica a tre stati:
  1. **idle → ringing** (prima pressione): parte SOLO l'audio della suoneria, lato Aula Live.
  2. **ringing → visible** (seconda pressione): compare l'overlay del telefono con blur/scurimento, lato Aula Live.
  3. **visible → idle** (terza pressione, o pressione mentre è visibile): chiude overlay e suoneria, torna a idle.
- La stessa sequenza si riattiva automaticamente quando la logica esistente del Modulo 2 genera il secondo callback random.
- Lato Regia non c'è alcun effetto visivo/sonoro: la pressione di OK pubblica solo lo stato remoto.

## Sincronizzazione Aula ↔ Regia

Fondamentale: l'overlay del telefono, l'audio della suoneria e il blur/scurimento dello sfondo devono comparire SOLO nella finestra Aula Live (la TV), esattamente come oggi blackout e pausa. La Regia resta pulita e invariata: mostra solo i controlli/trigger per pilotare l'effetto, non l'effetto stesso.

Lo stato `ringing`/`phoneVisible` viaggia sul canale realtime già esistente (`safedrivelab-aula-live` in `aulaSync.ts`): la regia pubblica il comando, la finestra Aula lo riceve e applica suoneria + overlay + blur. Funziona così anche tra due dispositivi diversi.

- Lato Regia (`IstruttoreModulo.tsx`): la pressione di OK aggiorna lo stato locale di controllo e lo pubblica via `publish()`; nessun rendering di `PhoneCallOverlay` e nessun blur sullo stage/anteprima.
- Lato Aula (`AulaModulo2.tsx` / `CatenaIncidenteScene.tsx`): il componente ascolta lo stato condiviso e, quando `ringing`/`phoneVisible` è attivo, riproduce la suoneria e renderizza l'overlay con blur/scurimento dello slide sottostante.

## Struttura dati

- Nessun nuovo blocco o modulo: è un layer dentro il blocco esistente "catena dell'incidente".
- Il nome chiamante resta quello random già calcolato ("Mamma"/"Moglie"), passato all'overlay come prop — coerente con la schermata del nodo.

## Verifica

- Build/typecheck verdi.
- Test Playwright a 1280×800: OK una volta → solo suono in Aula; OK due volte → telefono centrato con blur; OK terza volta → chiusura; ripetizione sulla seconda chiamata; sincronizzazione tra due contesti browser (regia → aula), con Regia sempre pulita.

## Note / decisioni confermate

- Tasto unico: **Invio / OK** (centrale del D-pad). Non è già occupato in `IstruttoreModulo.tsx`.
- Sequenza toggle: idle → ringing → visible → idle.
- I pulsanti verde/rosso del telefono sono decorativi in questa fase (la scelta resta sulle due opzioni testuali già esistenti); in futuro si possono collegare a `onAnswer`/`onDecline`.
- File audio: propongo una suoneria breve mp3 inclusa nel progetto (nessun servizio esterno); il mute è gestito manualmente dalla TV/hardware.
