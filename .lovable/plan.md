# Gestione file: utility interna di amministrazione

Una pagina riservata per gestire in blocco i file dell'archivio immagini: selezione multipla, cancellazione di gruppo, spostamento fra cartelle, navigazione per categoria.

## Dove vive e chi la vede

- Nuova pagina all'indirizzo `/studio/file`, non collegata da nessun menu pubblico.
- Accesso con lo stesso meccanismo nascosto già in uso per la modifica delle immagini: indirizzo con `?edit=sdl2026` oppure la combinazione Ctrl+Alt+Shift+E. Senza quella modalità attiva la pagina mostra solo "Pagina non trovata".
- Nessun link dalla home, dall'indice Aula o dalle schermate dei moduli: i partecipanti non possono arrivarci.
- Dalla Regia (sezione Studio) aggiungo un piccolo collegamento "Gestione file", visibile solo in modalità modifica.

## Cosa si vede nella pagina

- Colonna a sinistra: elenco delle cartelle esistenti (fotografiche, grafiche, brand, schemi, video, ecc.), scoperte automaticamente dall'archivio, con il numero di file di ciascuna.
- Area principale: griglia di miniature con nome file, dimensione e data. Ogni riquadro ha una casella di selezione; in alto "Seleziona tutto", "Deseleziona", contatore "N selezionati" e una casella di ricerca per nome.
- Barra azioni che compare solo con almeno un file selezionato:
  - "Sposta in…" con elenco delle cartelle esistenti più la possibilità di digitarne una nuova.
  - "Elimina selezionati" con una sola finestra di conferma che riepiloga quanti e quali file (e avvisa se qualcuno è in uso in una schermata).
- Dopo ogni operazione: messaggio di esito con numero di file trattati e eventuali errori, e aggiornamento immediato della griglia.

## Protezione dai file in uso

Prima di eliminare o spostare, la pagina confronta i file selezionati con le associazioni già salvate (quali immagini sono assegnate alle schermate dei moduli). I file in uso sono segnalati con un contrassegno e nella conferma è scritto in quali schermate compaiono. Lo spostamento aggiorna automaticamente l'associazione al nuovo percorso, così le schermate non restano vuote; l'eliminazione di un file in uso richiede una spunta esplicita.

## Dettagli tecnici

Nuovi file:

- `src/pages/StorageAdmin.tsx` — pagina, stato di selezione, cartella attiva, ricerca, dialoghi di conferma.
- `src/components/storage-admin/FolderList.tsx`, `FileGrid.tsx`, `BulkActionsBar.tsx`, `MoveDialog.tsx`, `DeleteDialog.tsx`.
- `src/lib/storageAdmin.ts` — livello dati, unico punto che parla con lo storage.
- Route `/studio/file` in `App.tsx`, protetta da `isEditMode()`.

Livello dati (`storageAdmin.ts`), bucket privato `course-images`:

- `listFolders()` / `listFiles(folder)` — riuso della paginazione a blocchi da 1000 già presente in `placeholderImages.ts` (estraendo l'helper condiviso invece di duplicarlo), con `metadata` (size, mimetype, updated_at) conservata.
- Miniature: `createSignedUrls(paths, ttl)` in lotti da 100, come già fa `resolveSignedMany`.
- Cancellazione in blocco: `supabase.storage.from(BUCKET).remove(paths)` — una sola chiamata, a lotti da 100 percorsi per sicurezza; l'API accetta un array, nessun ciclo di conferme.
- Spostamento: lo storage non ha un `move` multiplo, quindi `move(from, to)` per file eseguito in parallelo controllato (batch da 10) con raccolta degli esiti: `{ ok: string[]; failed: {path, message}[] }`. Collisioni di nome nella cartella di destinazione: rilevate prima e risolte con suffisso `-2`, oppure saltate su scelta dell'utente.
- Dopo spostamento: aggiornamento di `placeholder_images` (`image_url` vecchio percorso → nuovo, anche nella variante con prefisso `video::`) e `refreshPlaceholders()` per allineare subito Aula e Regia. La cache degli URL firmati viene invalidata per i percorsi toccati.

Porta aperta ai metadati (non implementato ora):

- Tutte le letture passano da un unico tipo `StorageFile { path; folder; name; size; mimeType; updatedAt; meta?: FileMeta }`, dove `meta` resta `undefined` finché non esisterà una tabella.
- `listFiles` è già scritta per fare un secondo accesso opzionale a una futura tabella `file_assets` (chiave: `path`, più `tags text[]`, `categoria`, `descrizione`) e unire i dati per percorso.
- La ricerca è una funzione a parte `filterFiles(files, query)` che oggi guarda solo il nome: domani basta estenderla ai tag senza toccare la griglia.
- Ogni operazione di spostamento/cancellazione passa da `storageAdmin.ts`, così quando arriveranno i metadati sarà un solo punto da aggiornare per mantenerli allineati.

## Fuori perimetro

Nessuna modifica alle schermate dei moduli, alla Regia esistente o alla scala tipografica. La tabella dei tag e la ricerca per tag non vengono create ora.
