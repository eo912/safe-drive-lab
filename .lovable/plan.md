# Piano — Test finale di apprendimento (ISAMED) dopo il Modulo 8

## Obiettivo
Nuova schermata di chiusura del corso: test di 10 domande a scelta multipla (A/B/C) gestito dal vivo dal docente con il mouse. Nessuna interazione dei partecipanti, nessun punteggio a schermo, nessuna persistenza dei risultati.

## Dove si inserisce
- Nuovo modulo "verifica-finale" nella sequenza, dopo il Modulo 8:
  - nuova pagina `src/pages/AulaModulo9.tsx`, route `/aula/modulo-9-verifica-finale` in `App.tsx`;
  - voce in `src/lib/modules.ts` (titolo "Verifica Finale", slug `modulo-9-verifica-finale`);
  - blocchi registrati in `src/lib/moduleBlocks.ts` e voce in `src/lib/studioCatalog.ts`, così appare in indice Aula, Regia e Studio come gli altri moduli;
  - in `AulaModulo8.tsx` l'ultima schermata cambia da "Torna all'indice moduli" a "Modulo successivo →" verso `/aula/modulo-9-verifica-finale`; il "Torna all'indice moduli" si sposta sull'ultima schermata del nuovo modulo.

## Struttura: due schermate da 5 domande
A 1280×800 dieci domande complete (domanda + 3 opzioni + spiegazione) non ci stanno in modo leggibile su una pagina sola. Quindi:
- **Schermata 1** — domande 1–5
- **Schermata 2** — domande 6–10 + "Torna all'indice moduli"

Due blocchi registrati (`verifica-1`, `verifica-2`), stesso comportamento degli altri moduli: scroll interno controllato, navigazione tastiera/air mouse già esistente, nessuno scroll verticale oltre il viewport.

## Componente riusabile
Nuovo `src/components/moduloQuiz/QuizQuestion.tsx` (standalone come `HotspotScene`):
- props: `question` (testo), `options` (3 etichette), `correctIndex`, `explanation`;
- stato locale per opzione: nessuno / corretta (verde) / sbagliata (rosso), gestito con colori semantici e stato chiaro anche da lontano (bordo + riempimento + icona ✓/✗ testuale o simbolo, non solo tinta);
- ogni click su un'opzione aggiorna solo quell'opzione: verde se è la corretta, rosso se sbagliata; si possono cliccare più opzioni in sequenza sulla stessa domanda;
- alla prima risposta cliccata compare sotto la domanda la spiegazione (1–2 righe) con la risposta corretta indicata; resta visibile e si aggiorna solo lo stato colore ai click successivi;
- nessun conteggio, punteggio o percentuale a schermo.

## Dati
Le 10 domande (testo, opzioni, risposta corretta, spiegazione) vanno in un file dati `src/lib/quizFinale.ts`, separato dalla UI, così i testi si correggono senza toccare i componenti.

## Regia / Aula
- Il test vive nella vista Aula: il docente clicca con il mouse direttamente sulla finestra proiettata.
- Stato dei click **locale alla pagina Aula** (non sincronizzato via Realtime, non inviato in Regia): la Regia vede la scaletta e può mandare in live i due blocchi come per gli altri moduli.
- In Regia, per i due blocchi del test: note istruttore (es. "leggere la domanda a voce, far rispondere l'aula, cliccare l'opzione indicata") e tempo previsto, come gli altri blocchi.

## Stile
- Design system esistente: tema scuro, accenti ambra, scala tipografica attuale, watermark Guida Sicura VDA, `ModuloNextNav` finale.
- Opzioni grandi e leggibili da distanza (proiettore): lettera A/B/C ben visibile, area click ampia, stati verde/rosso con buon contrasto sulla taratura proiettore esistente.

## Verifica
- Typecheck + build verdi.
- Playwright a 1280×800: entrambe le schermate senza scroll verticale; click su opzione corretta → verde, su sbagliata → rosso, spiegazione visibile; click multipli sulla stessa domanda aggiornano solo l'opzione cliccata.
