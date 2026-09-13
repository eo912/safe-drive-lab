# Modalità offline limitata (Regia + Aula)

Obiettivo: dopo almeno un utilizzo con internet, l'app pubblicata deve funzionare in aula senza connessione, limitatamente a Regia e Aula. Studio, Gestione file e link video esterni restano funzioni "solo online".

## Situazione attuale

- Regia e Aula parlano già su un canale locale del browser (`BroadcastChannel` + `localStorage`) in `src/lib/aulaSync.ts`; in parallelo inviano gli stessi comandi su un canale realtime remoto. Sullo stesso Surface, quindi, la sincronizzazione di base funziona già senza rete: il rischio reale è che le chiamate remote falliscano rumorosamente o rallentino, non che i comandi non arrivino.
- I testi dei moduli sono già dentro il codice dell'app (pagine `AulaModulo1..8`), quindi non richiedono rete.
- Le immagini invece dipendono dalla rete due volte: la tabella delle associazioni segnaposto→file viene letta al caricamento, e ogni file del bucket privato viene servito tramite un indirizzo firmato generato al momento (validità 7 giorni).
- Non esiste oggi alcuna cache applicativa: niente service worker, niente copia locale delle associazioni.

## Architettura proposta

### 1. Rilevamento stato connessione
Un piccolo modulo condiviso espone "online/offline" combinando `navigator.onLine` con l'esito reale delle ultime chiamate al backend (una chiamata fallita = offline finché una successiva non riesce). Regia e Aula lo usano per decidere cosa nascondere e come comportarsi.

### 2. Sincronizzazione Regia↔Aula
Il canale locale del browser diventa il canale **autoritativo** quando le due finestre sono sullo stesso browser; il canale remoto resta attivo in parallelo, ma diventa best-effort:
- ogni invio remoto è già racchiuso in un tentativo tollerante agli errori: va esteso in modo che un fallimento non produca errori in console né ritardi (nessun await bloccante, nessun retry insistente);
- la sottoscrizione remota non viene creata affatto finché lo stato è offline, ed è creata/ricreata al ritorno della rete;
- alla riconnessione la Regia ripubblica lo stato corrente sul canale remoto, così un eventuale secondo dispositivo si riallinea;
- il messaggio più recente vince, indipendentemente dal canale di provenienza (logica già presente, va solo resa uniforme fra i due canali).

Risultato: in aula senza rete, Regia e Aula continuano a sincronizzarsi istantaneamente; l'uso futuro su due dispositivi in rete resta intatto.

### 3. Contenuti disponibili offline

Tre livelli, tutti popolati durante l'uso online preventivo:

1. **Guscio dell'app** (codice, font, immagini incluse nel pacchetto): service worker generato in fase di build, con strategia "prima la rete, poi la copia locale" per le pagine e "prima la copia locale" per i file versionati. Va registrato solo nell'app pubblicata, mai in anteprima o in sviluppo.
2. **Associazioni segnaposto→file**: ogni lettura riuscita viene salvata in una copia locale nel browser; all'avvio si parte dalla copia locale e la si aggiorna quando la rete risponde. Così l'Aula non resta mai vuota in attesa della rete.
3. **File immagine del bucket**: gli indirizzi firmati risolti vengono memorizzati localmente insieme alla loro scadenza, e le immagini effettivamente scaricate finiscono nella cache del service worker. Serve inoltre una funzione "prepara la sessione offline" nella Regia che, con internet, rigenera tutti gli indirizzi e scarica in anticipo le immagini dei moduli scelti, senza dover aprire ogni schermata a mano.

### 4. Funzioni disattivate offline
Quando lo stato è offline: lo Studio e la Gestione file mostrano un avviso e non si aprono; i riquadri dei link video esterni e il player video sono nascosti; l'upload è disabilitato. Nessuna di queste schermate deve andare in errore.

## Comportamento durante la sessione

- **Connessione che cade a metà**: nessuna interruzione visibile. Regia e Aula continuano sul canale locale, le immagini arrivano dalla cache, i controlli online spariscono e in Regia compare un indicatore discreto "offline".
- **Connessione che ritorna**: sottoscrizione remota ricreata, associazioni riallineate, indirizzi firmati scaduti rigenerati, funzioni online riattivate. Nessun ricaricamento della pagina.

## Rischi e limiti da accettare

- **Indirizzi firmati con scadenza**: valgono 7 giorni. Se l'ultima sessione online è più vecchia, le immagini non sono più recuperabili offline anche se il file è in cache, perché l'indirizzo cambia. Mitigazione: la funzione "prepara la sessione offline" va eseguita poco prima del corso; in alternativa si può valutare in seguito una conservazione delle immagini come dati locali indipendente dall'indirizzo.
- **Indirizzo firmato variabile = cache che non combacia**: la cache deve ignorare la parte variabile dell'indirizzo, altrimenti ogni nuova firma è una miss.
- **Spazio disponibile**: la cache del browser è soggetta a limiti e a pulizia automatica; con molti moduli pieni di foto il volume va tenuto sotto controllo (solo i moduli preparati, non l'intero archivio).
- **Service worker e contenuti aggiornati**: un guscio memorizzato può servire una versione vecchia dell'app; per questo le pagine usano sempre "prima la rete". Va previsto anche un modo di ripulire la cache in caso di problemi.
- **Solo app pubblicata**: in anteprima/sviluppo il service worker non si registra, quindi l'offline non è verificabile lì. Il collaudo va fatto sull'indirizzo pubblicato mettendo il computer in modalità aereo.
- **Video esterni**: non saranno mai disponibili offline, per scelta.

## File coinvolti

- `src/lib/aulaSync.ts` — priorità al canale locale, invii remoti tolleranti, sottoscrizione condizionata alla rete, ripubblicazione alla riconnessione.
- Nuovo `src/lib/connectivity.ts` — stato online/offline condiviso.
- Nuovo modulo di registrazione del service worker con le protezioni per anteprima/sviluppo, più configurazione di build (`vite.config.ts`) per generare il worker.
- `src/lib/placeholderImages.ts` — copia locale delle associazioni e degli indirizzi firmati, precaricamento, nessun errore quando la rete manca.
- `src/pages/IstruttoreModulo.tsx` — indicatore stato connessione, comando "prepara la sessione offline", disattivazione delle funzioni online.
- `src/pages/StorageAdmin.tsx`, pannelli Studio (`BlockImagesPanel`, `SceneMediaPanel`, `BlockRefLink`, `VideoLinkPlayer`) — blocco/nascondimento offline.

## Fasi di lavoro

1. Stato connessione condiviso + sincronizzazione locale prioritaria (risolve subito il problema più critico).
2. Copia locale delle associazioni e degli indirizzi firmati.
3. Service worker con cache del guscio e delle immagini.
4. Comando "prepara la sessione offline" e disattivazione delle funzioni online.
5. Collaudo sull'app pubblicata in modalità aereo: Regia + Aula, navigazione completa di un modulo, caduta e ritorno della connessione.
