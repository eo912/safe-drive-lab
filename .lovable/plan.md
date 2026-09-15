# Uniformare la resa delle immagini nei segnaposto

## Modifiche
- Rendere tutte le immagini caricate tramite `EditableImageSlot` con ritaglio proporzionale `cover`, centrato e senza deformazioni.
- Conservare le dimensioni fisse già definite per ogni contesto: hotspot compatti, immagini nelle slide e cartina del programma.
- Mantenere invariati segnaposto testuali, caricamento dalla Regia, video e loghi.
- Rimuovere dagli utilizzi Aula le varianti `contain` che lascerebbero bordi vuoti.

## Verifica
- Controllare tutti gli utilizzi diretti e indiretti nei Moduli 1–8 e nelle scene interattive del Modulo 2.
- Verificare a 1280×800 i blocchi rappresentativi e quelli più densi, senza overflow o sovrapposizioni.
- Eseguire typecheck e build.

## Dettagli tecnici
- La modifica resta concentrata nel componente condiviso e nei relativi tipi, senza cambiare persistenza o catalogo Studio.
- I contenitori manterranno le altezze già tarate nelle singole slide; l'immagine userà sempre `object-cover object-center` con bordi arrotondati coerenti.
