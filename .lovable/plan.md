# Pulizia cartelle doppie nell'archivio

Ho confrontato i file delle cartelle vecchie con quelli delle cartelle numerate (nome + dimensione): l'archivio contiene oggi 222 file, di cui 81 nelle vecchie cartelle.

## Cosa ho trovato

| Cartella vecchia | File | Già presenti nella nuova | Da spostare | Destinazione |
|---|---|---|---|---|
| foto/ | 20 | 20 | 0 | 01_FOTO |
| brand/ | 9 | 5 | 4 | 02_BRAND |
| grafiche/ | 28 | 28 | 0 | 03_GRAFICHE |
| schemi/ | 5 | 5 | 0 | 04_SCHEMI_ISTAT |
| foto-da-valutare/ | 17 | 17 | 0 | 05_FOTO_DA_VALUTARE |
| modulo-2/ | 2 | 2 (stesso contenuto, nome diverso) | 0 | 05_FOTO_DA_VALUTARE |
| **Totale** | **81** | **77** | **4** | |

I 4 file unici sono tutti loghi: `1789134252864-progetto-senza-titolo.png`, `1789134338098-chatgpt-image-15-gen-2026-23-37-17.png`, `pxp-drivexperience.jpg`, `safedrivelab.png`.

Le due immagini in `modulo-2/` sono la stessa foto del 1° gennaio e la foto del tunnel, già presenti in `05_FOTO_DA_VALUTARE` con il nome originale: nessuna schermata le usa, quindi la cartella sparisce senza sostituzioni.

## Cosa farò

1. Sposto i 4 loghi in `02_BRAND`, con nomi puliti e leggibili:
   - `pxp-drivexperience.jpg` -> `02_BRAND/pxp-drivexperience.jpg`
   - `safedrivelab.png` -> `02_BRAND/safedrivelab.png`
   - `1789134252864-progetto-senza-titolo.png` -> `02_BRAND/logo-copertina-modulo-1a.png`
   - `1789134338098-chatgpt-image-15-gen-2026-23-37-17.png` -> `02_BRAND/logo-guida-sicura-vda-watermark.png`
2. Aggiorno i collegamenti delle schermate: oggi 10 schermate usano le vecchie cartelle (4 loghi, 4 foto, 2 foto da valutare). Ognuna verrà ripuntata al file nella cartella numerata corrispondente, con lo stesso contenuto.
3. Ricontrollo una per una le 10 associazioni: ogni indirizzo deve rispondere correttamente prima di procedere.
4. Solo a verifica superata cancello i 77 file doppi e le cartelle vecchie ora vuote (`foto/`, `brand/`, `grafiche/`, `schemi/`, `foto-da-valutare/`, `modulo-2/`).
5. Controllo finale a schermo di alcune schermate coinvolte (Modulo 1a copertina, Modulo 2, Modulo 3, Modulo 4, Modulo 8) per confermare che le immagini si vedano.

Risultato: 4 file spostati, 77 eliminati, archivio ridotto a 145 file in 7 cartelle numerate.

## Dettagli tecnici

- Confronto duplicati fatto su nome + dimensione esatta in byte; per `modulo-2/` l'abbinamento è per dimensione (nome cambiato all'upload).
- Spostamenti tramite l'azione `move` della funzione `assets-admin`, cancellazioni tramite `remove`.
- Aggiornamento di `placeholder_images.image_url` (10 righe interessate); `media_assets` è vuota, non richiede interventi.
- Ordine: sposta -> aggiorna database -> verifica -> cancella. Nessuna cancellazione prima della verifica.
