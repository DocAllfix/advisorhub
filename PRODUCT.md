# Product

## Register

product

## Users

Commercialisti e studi professionali italiani (dottori commercialisti, esperti contabili, revisori). Utente tipico: professionista 30-65 anni, esperto di bilanci ma non di software, che lavora su desktop in studio, spesso con più pratiche aperte contemporaneamente. Il cliente finale (imprenditore PMI) oggi non accede alla piattaforma: riceve i report prodotti dal professionista. Un portale cliente in sola lettura è un'espansione futura pianificata, non parte dell'MVP.

## Product Purpose

SaaS premium per il monitoraggio continuo della salute economico-finanziaria del portafoglio clienti dello studio. Evoluzione di un prototipo di dashboard KPI (ROS, Turnover, ROI, ROI-I, ROE, GI/PFN-EBITDA, DSCR con soglie CCII) verso una piattaforma multi-cliente: anagrafica clienti, storicizzazione dei bilanci, indici di allerta crisi, scoring sintetico, report brandizzati da consegnare a clienti e banche. Successo = lo studio abbandona Excel e i tool legacy perché qui analizza più in fretta, con più autorevolezza percepita dal cliente finale.

## Brand Personality

Autorevole, preciso, calmo. La voce del consulente fidato: numeri solidi presentati senza rumore, fiducia da private banking. Il tono dell'interfaccia è professionale ma umano, in italiano corretto e tecnico dove serve (terminologia di bilancio corretta, mai gergo anglosassone gratuito).

## Anti-references

- Gestionali legacy anni 2000 (TeamSystem/Zucchetti vecchia scuola): griglie grigie, form infiniti, ribbon, densità caotica.
- Dashboard SaaS cliché: gradienti viola decorativi, glassmorphism di default, card grid tutte uguali, hero-metric gonfiati, gradient text.
- Estetica crypto/trading: dark mode aggressivo, neon, glow, urgenza speculativa.
- Il prototipo HTML di partenza è un riferimento funzionale, non estetico: il prodotto finale deve distanziarsene visivamente.

## Design Principles

1. **Il numero è il protagonista.** Ogni schermata serve a far leggere, capire e difendere un numero davanti a un cliente o a una banca. Tipografia dei dati curata come in un prospetto finanziario.
2. **Autorevolezza silenziosa.** La qualità si mostra nella precisione (allineamenti, tabelle, formattazione it-IT impeccabile), non nella decorazione. Riferimenti di craft: Mercury, Ramp.
3. **Dal dato al consiglio.** Ogni indicatore porta con sé soglia, giudizio e azione suggerita: il software parla come parlerebbe il commercialista al cliente.
4. **Presentabilità immediata.** Ogni vista deve poter essere mostrata a un cliente o esportata in un report senza vergogna: lo schermo è anche materiale di consulenza.
5. **Calma operativa.** Niente motion decorativa, niente urgenza artificiale: stati chiari, transizioni 150-250 ms, densità controllata.

## Accessibility & Inclusion

WCAG 2.1 AA: contrasto minimo 4.5:1 sul testo, focus visibili, navigazione completa da tastiera, `prefers-reduced-motion` rispettato. Il colore non è mai l'unico canale dei giudizi (semafori sempre accompagnati da etichetta testuale). Formattazione numeri e valute it-IT.
