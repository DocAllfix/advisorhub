# Font del report

IBM Plex Sans, IBM Plex Mono e IBM Plex Serif, distribuiti da IBM con
**SIL Open Font License 1.1**, che ne consente uso, modifica e ridistribuzione
anche in prodotti commerciali.

Sorgente: https://github.com/IBM/plex

I file `.ttf` sono versionati di proposito: `@react-pdf/renderer` li legge dal
disco per incorporarli nel PDF. Senza, il report ripiegherebbe su Helvetica,
perdendo l'identità tipografica e l'incolonnamento dei numeri tabulari.
