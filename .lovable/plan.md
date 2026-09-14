# Controllo immagini e testi nei moduli — esito dell'analisi

Solo analisi: non ho toccato nulla. Ho scaricato e misurato tutte le immagini realmente assegnate oggi alle slide e ho riletto i testi di tutte le schermate Aula.

## 1. Immagini con contorno bianco

Il contorno bianco NON viene dalla cornice: nel tema scuro le cornici sono grigio scuro. Viene dalle immagini stesse, generate con sfondo bianco e mai ritagliate.

| Modulo | Slide | Immagine | Cosa ho misurato | Origine |
|---|---|---|---|---|
| 3 | Posizione di guida | `modulo-3-posizione-guida-base.png` | il 76% del perimetro è bianco puro: 178 px di bianco in alto e 250 px a sinistra. Il conducente occupa poco più di metà del riquadro | immagine sorgente da ritagliare |
| 3 | Dettaglio "Specchi" | `modulo-3-hotspot-specchi.png` | 100% del perimetro bianco, l'immagine è già molto stretta (614x169) | immagine sorgente da ritagliare |
| 3 | Visuale frontale | `modulo-3-visuale-frontale.png` | sfondo chiaro per il 37% del bordo, senza bianco pieno | accettabile, nessun intervento |
| 4 | Pneumatico / impronta | `modulo-4-impronta-pneumatico.png` | nessun bianco: ha uno sfondo grigio medio pieno che sul proiettore scuro si vede come un rettangolo chiaro attorno alla ruota | sfondo da scurire o da rendere trasparente |

Interventi proposti caso per caso:
- Posizione di guida e Specchi: rigenerare l'immagine ritagliata sul soggetto, con sfondo trasparente al posto del bianco.
- Pneumatico: stessa cosa, sfondo trasparente, così la ruota galleggia sul fondo scuro invece di stare dentro un riquadro grigio.

## 2. Cornici che non rispettano le proporzioni

Le scene con punti cliccabili fissano solo l'altezza (`h-[44vh]`, `h-[28vh]`) e prendono tutta la larghezza disponibile: il riquadro diventa quindi molto più largo dell'immagine e l'immagine viene tagliata sopra e sotto. I pallini restano invece posizionati in percentuale sul riquadro, non sul contenuto visibile: più il taglio è forte, più il pallino si sposta rispetto al punto che dovrebbe indicare.

| Modulo | Slide | Rapporto immagine | Rapporto riquadro | Punti a rischio |
|---|---|---|---|---|
| 4 | Pneumatici | 1,80:1 | circa 3,8:1 | "battistrada" (altissimo) e "aquaplaning" (bassissimo): rischio alto di puntare fuori |
| 3 | Visione | 2,44:1 | circa 3,8:1 | "specchietto", molto vicino al bordo alto |
| 3 | Posizione di guida | 1,80:1 | circa 2,4:1 | "specchi" e "poggiatesta", rischio medio |

Intervento proposto: dare al riquadro un rapporto fisso uguale a quello dell'immagine (es. 16:9) invece della sola altezza, così l'immagine non viene più tagliata e i pallini tornano a coincidere. Da rifare la taratura dei punti una volta corretta la cornice.

## 3. Due problemi collaterali trovati

- Il dettaglio "Specchi" del Modulo 3 punta ancora a un indirizzo esterno che oggi risponde "accesso negato": si vede solo perché scatta il ripiego sull'immagine dell'archivio. Va tolto e sostituito con il file dell'archivio.
- Tre foto in uso pesano 14-19 MB l'una (`ENV_007`, `ENV_008`, `ENV_004`): in aula rallentano il caricamento. Da ridurre a versioni leggere.

## 4. Testi troppo densi (da accorciare)

| Modulo | Blocco | Testo | Lunghezza | Proposta |
|---|---|---|---|---|
| 5 | Peso e trasferimenti | "Ogni volta che acceleri, freni o affronti una curva..." | 360 caratteri | tagliare di circa metà, spostando la parte sulle ruote interne in una seconda scheda |
| 2 | Il fattore umano | "Cintura, airbag, poggiatesta ti proteggono..." | 316 caratteri | ridurre a circa 200 |
| 3 | Posizione di guida | "Un'auto moderna può avere i migliori sistemi..." | 313 caratteri | ridurre a circa 200 |
| 2 | Sicurezza e rischio | "Anche con un'auto perfetta..." | 305 caratteri | ridurre a circa 200 |
| 5 | Sottosterzo / sovrasterzo | due testi da 281 e 203 caratteri affiancati | | ridurre il primo |
| 3 | Distrazione | due schede affiancate da 235 e 224 caratteri | | ridurre una delle due |
| 4 | Sistemi elettronici | tre schede ABS/ESP/ASR più un quarto riquadro "L'errore comune" | | togliere o accorciare il quarto riquadro |
| 7 | Riepilogo professionale | elenco di 6 voci | | accorpare a 5 |
| 4 | Prima di partire | checklist di 6 voci | | accorpare a 5 |
| 2 | Sicurezza e rischio | griglia di 6 decisioni | | impatto minore, si può lasciare |

## 5. Testi troppo piccoli (da ingrandire)

Il corpo del testo nelle schermate è quasi ovunque della misura giusta. L'unica eccezione reale è la verifica finale del Modulo 9:

- domanda, tre risposte e spiegazione sono scritte in misura molto ridotta, e la spiegazione viene addirittura troncata a due righe;
- la causa è che ci sono 5 domande per schermata.

Proposta: portare la verifica a 3 domande per schermata (quattro schermate invece di due) e usare così una misura di testo leggibile a distanza. In alternativa, tenere 5 domande ma togliere la spiegazione scritta, lasciandola alla voce del docente.

Tutte le altre scritte piccole trovate sono etichette, numeri di sezione e diciture di fonte: non sono testo da leggere a distanza e le lascerei come sono.

## Dettagli tecnici

- Immagini: misurato il perimetro di ogni file assegnato in `placeholder_images` (20 file scaricati dal bucket `safe-drive-labs-assets`); soglia bianco >235 su tutti i canali.
- Cornici: `HotspotScene.tsx:51-55` fissa solo l'altezza (`h-[44vh]` / `h-[28vh]` con `compact`); `EditableImageSlot.tsx:18-51` applica `object-cover`. La correzione proposta è un `aspect-[16/9]` sul contenitore, poi ritaratura delle coordinate degli hotspot.
- Link rotto: `AulaModulo3.tsx:102` (URL Envato, HTTP 403); fallback in `HotspotScene.tsx:105-122`.
- Testi: riferimenti in `AulaModulo5.tsx:293,380,395`, `AulaModulo2.tsx:410,455,69-76`, `AulaModulo3.tsx:363,469,483`, `AulaModulo4.tsx:105-112,456-501`, `AulaModulo7.tsx:457-464`, `QuizQuestion.tsx:36,90,107`, `AulaModulo9.tsx:268-317`.

## Come procedere

Nessuna modifica in questo passaggio. Dimmi quali voci vuoi affrontare e in che ordine: le tre immagini da rigenerare, le cornici con i punti cliccabili, i testi lunghi, la verifica finale del Modulo 9.
