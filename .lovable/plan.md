# Piano — Scena “auto che frena davanti” nel Modulo 2

Nuova scena didattica dentro **La catena dell’incidente**, controllata dal docente e visibile esclusivamente in Aula Live. La Regia resta pulita: mostra soltanto i comandi e l’esito suggerito. Nessun video, nessun audio e nessuna interazione dei partecipanti.

## Flusso della scena

1. Stato iniziale `idle`: la slide della catena resta invariata.
2. Il docente usa **Avvia scena** dalla Regia:
   - breve bagliore a tutto schermo;
   - stacco secco sull’immagine vista dal parabrezza;
   - piccolo zoom impulsivo e scossa molto breve;
   - accensione pulsante dei due fanali posteriori rossi.
3. La scena resta sospesa sull’auto che frena, senza countdown e senza decidere automaticamente l’esito.
4. In Regia compaiono due scelte:
   - **Si è fermato in tempo**;
   - **Non ci è riuscito**.
5. Una delle due viene indicata come **esito suggerito** in base al rischio accumulato, ma il docente può confermare l’altra.
6. L’esito scelto chiude narrativamente la scena in Aula. Un comando **Chiudi / Riarma** riporta tutto a `idle` e consente una nuova esecuzione.

## Componente riutilizzabile

Creare un componente standalone, ad esempio `SuddenHazardOverlay`, indipendente dalla catena e configurato tramite proprietà:

- `variant`: inizialmente `car-braking`, predisposto per future varianti come `car-cut-in`;
- `phase`: `idle | flash | hazard | resolved`;
- `background`: immagine statica fornita e gestibile tramite il sistema di contenuti esistente;
- `brakeLights`: coordinate percentuali dei due fanali, diverse per ogni immagine/variante;
- `outcome`: `safe | crash | null`;
- testi finali della variante.

La variante contiene immagine, coordinate e testi; il motore visivo resta unico. In futuro una nuova situazione richiederà una nuova configurazione, non un nuovo overlay completo.

## Effetti visivi

- **Flash:** livello bianco caldo/giallo molto breve sopra tutta l’Aula, con salita quasi istantanea e dissolvenza rapida.
- **Stacco:** al termine del flash appare direttamente l’immagine, senza dissolvenza lenta.
- **Zoom:** impulso contenuto dell’immagine, circa `1 → 1.025/1.04 → 1`, per simulare l’avvicinamento improvviso senza deformare la scena.
- **Shake:** traslazioni di pochi pixel per circa 200–300 ms, poi immagine perfettamente stabile.
- **Fanali:** due punti rossi posizionati in percentuale sull’immagine, con alone e pulsazione luminosa; dimensione adattiva ma coordinate stabili a ogni formato.
- **Accessibilità:** con riduzione movimento attiva restano flash attenuato, stacco e fanali, ma zoom e scossa vengono eliminati.

L’immagine riceve solo una sfocatura leggera e controllata; l’auto e i fanali devono restare leggibili sul proiettore.

## Aggancio alla catena del rischio

La logica attuale mantiene internamente una probabilità nascosta, parte da `0,20`, non scende sotto `0,10` e viene modificata dalle scelte prudenziali o rischiose. Oggi questa informazione vive nella scena Aula e l’esito viene estratto automaticamente durante l’avanzamento.

Per la nuova scena introdurre un piccolo **snapshot di rischio** non visibile ai partecipanti:

- probabilità corrente;
- numero di scelte rischiose;
- nodo corrente;
- identificatore della sessione/esecuzione.

Quando il docente avvia la scena, lo snapshot genera una sola proposta `safe` o `crash`, pesata sulla probabilità corrente. La proposta viene congelata per quell’esecuzione, così non cambia mentre il docente discute con l’aula. Non viene mostrata in Aula e non chiude la scena da sola.

La Regia riceve lo snapshot tramite il feedback Aula → Regia già usato per lo stato di connessione e mostra discretamente quale pulsante è suggerito. Il docente conferma quel risultato oppure sceglie manualmente l’altro. Questa integrazione sarà isolata in un adattatore, così la futura ricalibrazione della probabilità della catena potrà cambiare la formula senza riscrivere l’overlay.

## Regia e sincronizzazione

Estendere lo stato condiviso Aula con un payload dedicato alla scena, separato da quello del telefono:

- variante;
- fase;
- esito scelto;
- timestamp/ID dell’esecuzione;
- blocco proprietario (`catena-incidente`).

La Regia pubblica soltanto comandi; l’Aula interpreta lo stato e renderizza gli effetti. Anteprima, Studio e mini-stage non montano l’overlay e non mostrano flash, zoom, shake o esito.

Nel pannello LIVE del solo blocco `catena-incidente` aggiungere un controllo compatto:

- **Avvia scena** quando è inattiva;
- i due pulsanti di esito quando la scena è in attesa;
- indicazione “suggerito” su uno dei due, senza percentuali;
- **Chiudi / Riarma** dopo l’esito.

Assunzione per questa fase di progettazione: i controlli visibili in Regia sono la fonte primaria. La scorciatoia fisica dedicata verrà assegnata in implementazione dopo aver scelto un tasto libero del telecomando; **Invio/OK resta riservato al telefono** e non viene sovraccaricato.

## Inserimento narrativo

La scena si aggancia al nodo **Imprevisto** della catena, coerentemente con l’evento “l’auto davanti frena di colpo”. Non sostituisce le scelte già presenti e non modifica ora la formula probabilistica generale: legge il rischio accumulato e introduce una chiusura guidata dal docente.

Per evitare conflitti:

- cambiando blocco, riavviando la catena o iniziando una nuova sessione, lo stato scena torna a `idle`;
- blackout e pausa continuano ad avere priorità visiva;
- un’esecuzione vecchia viene ignorata usando timestamp/ID;
- telefono e scena di frenata hanno stati distinti e non possono aprirsi contemporaneamente.

## Verifica prevista

- Aula Live a 1280×800: flash, stacco, zoom/scossa, fanali e due chiusure senza overflow.
- Regia: nessun effetto visivo; solo controlli e suggerimento.
- Studio/anteprima: nessun flash o overlay accidentale.
- Due browser/dispositivi: avvio, scelta esito, chiusura e reset sincronizzati.
- Verifica delle priorità con pausa, blackout e telefono.
- Test che una probabilità bassa/alta influenzi il suggerimento, mantenendo sempre possibile l’override manuale.
- Controllo `prefers-reduced-motion` e resa su proiettore.

## Fuori perimetro

- Nessun video e nessun audio.
- Nessuna scelta, pulsante o conto alla rovescia in Aula.
- Nessuna ricalibrazione della formula probabilistica generale in questo intervento.
- Nessuna variante aggiuntiva oltre a `car-braking`.
- L’immagine definitiva sarà collegata quando verrà fornita.
