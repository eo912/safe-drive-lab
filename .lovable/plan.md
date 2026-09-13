# Piano — Leggere immagini e video dal bucket esterno "safe-drive-labs-assets"

## Obiettivo
I file del corso (foto, grafiche, video, loghi) vengono letti dal bucket pubblico
`safe-drive-labs-assets` del progetto Supabase di Edy. Tutto il resto — associazioni
segnaposto, tabelle, autenticazione, sincronizzazione aula/regia — resta dov'è oggi.

## Come funziona dopo la modifica

- Gli indirizzi dei file diventano **permanenti e pubblici**: niente più scadenza a 7 giorni.
  Il pulsante "Prepara offline" resta, ma solo per scaricare in anticipo i file nella cache.
- La pagina **Gestione file** elenca i file del bucket di Edy, con le stesse cartelle e
  la stessa ricerca di oggi.
- Le associazioni già salvate (quale file su quale schermata) restano valide, **a patto che
  i file abbiano lo stesso percorso** nel bucket nuovo. Per questo serve la migrazione qui sotto.

## Cosa serve da te

1. **Chiave pubblica (anon/publishable) del progetto di Edy** — serve per leggere ed elencare
   i file. Va salvata come impostazione del progetto.
2. Conferma che il bucket `safe-drive-labs-assets` sia **pubblico in lettura** e che l'elenco
   dei file sia consentito anche a chi non è loggato (serve una regola di lettura per il
   ruolo anonimo; se manca, la libreria risulta vuota anche se il bucket è pubblico).
3. Decisione sui caricamenti: vedi "Caricare e cancellare file" sotto.

## I file già presenti (81)

Consiglio: **copiarli tutti nel bucket di Edy mantenendo identici i percorsi**
(`brand/…`, `foto/…`, `grafiche/…`, `schemi/…`, `foto-da-valutare/…`, `modulo-2/…`, `video/…`),
con uno script una tantum come quello già usato in passato, senza sovrascrivere nulla di
esistente. Così nessuna schermata perde la sua immagine e non restano due librerie da
mantenere. I file su Lovable Cloud restano lì come copia di sicurezza, inutilizzati.

Alternativa (sconsigliata): lasciare i vecchi dove sono e cercarli prima nel bucket esterno,
poi in quello interno. Funziona, ma la libreria mostra due elenchi mescolati, gli indirizzi
hanno comportamenti diversi (permanenti vs a scadenza) e la confusione cresce nel tempo.

## Caricare e cancellare file

Un bucket pubblico è pubblico **in lettura**; scrivere richiede una credenziale riservata, che
non può stare nel sito (sarebbe visibile a chiunque). Due opzioni:

- **A (consigliata):** i caricamenti e le cancellazioni passano da una piccola funzione lato
  server su Lovable Cloud, che usa la chiave riservata già salvata
  (`EXTERNAL_SUPABASE_SERVICE_ROLE_KEY`). Gestione file continua a funzionare come oggi.
- **B:** Gestione file diventa di sola consultazione e Edy carica i file direttamente dal suo
  pannello Supabase. Meno lavoro, meno comodo.

## Rischi

- **Doppio progetto:** se il progetto di Edy viene messo in pausa, rinominato o il bucket reso
  privato, tutte le immagini del corso spariscono dalle schermate. Dipendenza da un account
  che non controlliamo.
- **Percorsi disallineati:** se un file viene spostato o rinominato nel bucket di Edy, la
  schermata collegata resta vuota. Mitigazione: dopo la migrazione, un controllo che segnala
  in Gestione file le associazioni che puntano a file inesistenti.
- **Cache offline:** gli indirizzi salvati oggi (firmati, vecchio bucket) vanno svuotati al
  primo avvio dopo il cambio, altrimenti restano in uso finché non scadono.

## Dettagli tecnici

- Nuovo client di sola lettura in `src/lib/assetsClient.ts` creato con
  `VITE_EXTERNAL_SUPABASE_URL` + `VITE_EXTERNAL_SUPABASE_ANON_KEY` (chiave publishable,
  può stare nel codice/env del frontend). Client separato, `auth: { persistSession: false }`,
  per non interferire con la sessione di Lovable Cloud.
- `src/lib/placeholderImages.ts`: `BUCKET = "safe-drive-labs-assets"`; `resolveSigned` e
  `resolveSignedMany` sostituiti da `publicUrl(path)` = `getPublicUrl` (sincrono, nessuna
  scadenza). `listLibrary`/`listFolderFiles` usano il nuovo client. `SIGNED_TTL`, `signedStore`
  e `loadCachedSigned`/`saveCachedSigned` restano solo come cache di compatibilità e vengono
  invalidati una volta (bump di versione della chiave in `offlineCache.ts`).
- `prepareOfflineSession` resta: itera i percorsi e fa `fetch` degli URL pubblici per
  popolare la cache del service worker.
- `src/lib/storageAdmin.ts`: elenco/anteprime dal client esterno; `upload`, `remove`, `move`
  instradati su una edge function `assets-admin` (opzione A) che usa
  `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY`; nessuna chiave riservata nel frontend.
- `placeholder_images`, `media_assets` e il client `@/integrations/supabase/client` restano
  invariati su Lovable Cloud.
- Script di migrazione una tantum via `code--exec` (non committato): copia i file da
  `course-images` a `safe-drive-labs-assets` mantenendo i percorsi, salta quelli già presenti,
  riepilogo finale per cartella.

## Ordine di esecuzione

1. Salvataggio URL + chiave pubblica del progetto esterno.
2. Verifica di lettura ed elenco del bucket esterno con quella chiave (se fallisce, ci si ferma).
3. Migrazione degli 81 file.
4. Passaggio del codice al nuovo bucket con URL pubblici.
5. Gestione file (lettura, poi scrittura secondo l'opzione scelta).
6. Controllo di tutte le schermate dei moduli 1a–8: nessuna immagine mancante.
