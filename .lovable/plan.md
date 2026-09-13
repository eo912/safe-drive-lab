# Gestione file → Media Library catalogata

Estensione della pagina esistente `/studio/file` (Gestione file). Nessun rifacimento del layout: si aggiungono catalogazione, ricerca estesa e caricamento, mantenendo cartelle, selezione multipla, sposta ed elimina come sono oggi.

## 1. Tabella dei metadati

Nuova tabella `media_assets`, una riga per file, chiave sul percorso nel bucket:

| campo | tipo | note |
| --- | --- | --- |
| `storage_path` | text, chiave primaria | es. `foto/curva-notte.jpg` |
| `nome` | text | etichetta leggibile, default dal nome file |
| `tipo` | text | `foto` / `video` / `documento` |
| `categoria` | text, opzionale | libera, con suggerimenti dalle cartelle esistenti |
| `modulo` | text, opzionale | es. `modulo-3`, oppure vuoto |
| `tag` | text[] , default `{}` | array di stringhe |
| `stato` | text, default `da-valutare` | `approvato` / `da-valutare` / `scartato` |
| `descrizione` | text, opzionale | |
| `created_at` / `updated_at` | timestamptz | |

Indici: su `modulo`, su `stato`, GIN su `tag` per la ricerca. Accesso uguale a `placeholder_images` (lettura e scrittura consentite anche senza login, coerente con l'utility interna nascosta).

Importante: la tabella è **descrittiva**, non autoritativa. La verità su quali file esistono resta lo storage; i metadati si agganciano per percorso. Un file senza riga in tabella resta visibile e usabile come oggi.

Al momento dello spostamento di un file, il percorso in `media_assets` va aggiornato insieme a quello in `placeholder_images` (la logica di `moveFiles` esiste già e va estesa); alla cancellazione, la riga va rimossa.

## 2. Metadati nella griglia

- Ogni scheda della griglia mostra, sotto nome e dimensione, due indicatori compatti: pallino di stato (approvato / da valutare) e fino a due tag. Se non ci sono metadati, la scheda resta com'è oggi.
- Click sul file: oggi seleziona. Nuovo comportamento: la selezione multipla passa alla casella di spunta in alto a sinistra (già presente graficamente), mentre il click sulla scheda apre un **pannello laterale destro** con i campi del file: nome, tipo, categoria, modulo, tag, stato, descrizione, più anteprima grande e percorso.
- Il pannello salva con un pulsante esplicito e mostra conferma. Chiusura con X o Esc.
- Azione in blocco aggiuntiva nella barra inferiore: "Assegna metadati…" per applicare categoria / modulo / stato / tag a tutti i file selezionati in una volta (i campi lasciati vuoti non vengono toccati).

## 3. Ricerca estesa

La casella in alto cerca in: nome file, nome leggibile, categoria, tag, descrizione e modulo. Accanto, due filtri a tendina rapidi: stato e modulo. Il conteggio "X di Y file" resta.

## 4. Caricamento diretto dalla pagina

- Area drag&drop nella parte alta dell'elenco (e pulsante "Carica file") che accetta immagini e video, più file insieme.
- Prima della conferma, un riquadro elenca i file scelti e permette di impostare cartella di destinazione, categoria, modulo, stato e tag comuni a tutto il lotto.
- Dopo il caricamento si crea la riga in `media_assets` per ciascun file e la griglia si aggiorna.
- Limite pratico: circa 60 MB per file; per i video lunghi resta il link esterno gestito nello Studio.

## 5. Assegnazione a un blocco dalla stessa pagina

Fattibile senza stravolgere l'architettura: esiste già `placeholder_images` e la funzione che descrive i segnaposto (`describePlaceholderId` su `studioCatalog`). Nel pannello laterale del file si aggiunge la sezione "Usato in": elenco dei segnaposto che già usano quel file (dato disponibile oggi) più un selettore a due livelli modulo → schermata → segnaposto per assegnarlo subito. Il salvataggio riusa lo stesso scrittore usato dallo Studio, così Aula e Regia si aggiornano come sempre.

Resta fuori: l'anteprima live della slide, che continua a vivere nello Studio del modulo.

## 6. Bucket pubblico in lettura

Se il bucket diventa pubblico in lettura, gli indirizzi delle immagini diventano stabili e senza scadenza. Vantaggi: griglia più veloce (niente firma a lotti), copia offline più semplice, nessuna miniatura che "scade" dopo un'ora. Il piano prevede un unico punto centrale per costruire l'indirizzo di un file, che userà l'indirizzo pubblico quando disponibile e continuerà a firmare come oggi in caso contrario — così il passaggio non rompe nulla e resta reversibile.

## Rischi

- **Disallineamento metadati/file**: file spostati o cancellati fuori dall'app lasciano righe orfane. Mitigazione: le righe senza file corrispondente vengono semplicemente ignorate nella griglia, e un'azione manuale "pulisci metadati orfani" può rimuoverle.
- **Click che cambia significato**: chi usa già la pagina si aspetta che il click selezioni. Mitigazione: la casella di spunta resta in evidenza e l'azione "Seleziona tutto" non cambia.
- **Caricamenti pesanti**: più video insieme possono essere lenti; si mostra progresso per file e si evita di bloccare la pagina.
- **Nessuna autenticazione**: la pagina resta protetta solo dalla modalità modifica nascosta, come oggi.

## Dettagli tecnici

- Migrazione: `CREATE TABLE public.media_assets` con GRANT per `anon`, `authenticated`, `service_role`, RLS attiva con policy permissive come `placeholder_images`; indici btree su `modulo`/`stato` e GIN su `tag`; trigger su `updated_at`.
- `src/lib/storageAdmin.ts`: valorizzare `FileMeta` leggendo `media_assets` in `listFiles` (una query, join per percorso); estendere `filterFiles` a categoria/tag/descrizione/modulo; nuove funzioni `saveMeta`, `saveMetaBulk`, `uploadFiles`; `moveFiles` e `deleteFiles` aggiornano/eliminano anche le righe dei metadati.
- Nuovi componenti in `src/components/storage-admin/`: `MetaPanel.tsx` (pannello laterale), `UploadDropzone.tsx`, `BulkMetaDialog.tsx`, `FilterBar.tsx`.
- Modificati: `FileGrid.tsx` (badge stato/tag, casella di spunta separata dal click), `BulkActionsBar.tsx` (voce metadati), `StorageAdmin.tsx` (stato pannello, filtri, upload).
- Indirizzi file: unica funzione `fileUrl(path)` in `storageAdmin.ts` / `placeholderImages.ts` che sceglie fra pubblico e firmato.
