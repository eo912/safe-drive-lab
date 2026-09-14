# Arricchimento hotspot pneumatici

## Modifiche
- Estendere gli hotspot con un'etichetta immagine opzionale gestita dallo Studio, mantenendo piena compatibilità con le immagini statiche esistenti.
- Mostrare il nuovo spazio immagine sopra al testo, con segnaposto coerente quando non è ancora stato caricato un contenuto.
- Ampliare i testi di Aquaplaning, Gomme estive e Gomme invernali e associare a ciascuno una label Studio dedicata.
- Lasciare Pressione e Battistrada invariati.

## Verifica
- Controllare typecheck e build.
- Verificare a 1280×800 i tre pannelli, assicurando assenza di overflow e sovrapposizioni.

## Dettagli tecnici
- `imageLabel` avrà priorità su `image`/`imageAlt`; il percorso statico continuerà a funzionare per gli hotspot esistenti.
- Nessuna modifica alla navigazione, agli hotspot restanti o agli altri moduli.
