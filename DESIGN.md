# Design

Seed pre-implementazione (nessun codice ancora). Da rigenerare con `/impeccable document` quando esisteranno token reali nel codice. Derivato da PRODUCT.md (autorevole, preciso, calmo; riferimenti Mercury/Ramp; registro product) e dalle ricerche ui-ux-pro-max, filtrate dalle leggi impeccable.

## Theme

**Tema scuro come base, chiaro disponibile dal selettore** (decisione del committente, luglio 2026). Scena: lo strumento resta aperto per ore accanto al gestionale, spesso in stanze con luce artificiale; un fondo profondo riduce l'affaticamento e fa risaltare i numeri, che sono il contenuto.

Il tema scuro è **scelto, non invertito**: passi propri sulla superficie scura (fondo ~oklch(0.17), card ~oklch(0.215), sidebar più profonda a ~oklch(0.14)), accento e semantica rialzati in chiarezza per reggere il contrasto, bordi in tinta piena (~oklch(0.32)) e non in bianco trasparente, che su tabelle dense sparisce.

Distanza dall'anti-riferimento crypto/neon: nessun glow, nessuna saturazione estrema, nessun nero puro; il colore resta confinato ai giudizi e all'accento.

**Il report di stampa resta sempre su fondo chiaro** (classe `.forza-chiaro`), anche con l'app in scuro: è un documento destinato alla carta, al cliente e alla banca.

## Color

Strategia: Restrained (registro product). Neutri tinti verso il brand, un accento, semantica riservata ai giudizi.

- Neutri: scala "inchiostro su carta" tinta fredda, OKLCH chroma 0.005-0.01, mai #fff/#000. Sfondo app ~oklch(0.98 0.005 240), testo ~oklch(0.22 0.01 240). Secondo neutro leggermente più freddo per sidebar/pannelli.
- Accento (azioni, selezione, focus): ottanio/teal-ink profondo ~oklch(0.50 0.09 210). Scelto per distanziarsi sia dall'indigo del prototipo, sia dal riflesso navy-oro "finance", sia dal viola SaaS cliché.
- Semantica giudizi (semafori KPI, unico uso del tricolore): ottimo/buono verde ~oklch(0.55 0.13 155), attenzione ambra ~oklch(0.70 0.13 75), critico rosso ~oklch(0.55 0.19 25). Mai su stati inattivi, sempre con etichetta testuale.
- Data viz: serie primarie dall'accento e dai neutri; il tricolore semantico non si usa per serie generiche.

## Typography

- Famiglia UI: IBM Plex Sans (pairing "Financial Trust" di ui-ux-pro-max: banking, trustworthy). Una sola famiglia per heading, label, body.
- Dati numerici: IBM Plex Mono (o Plex Sans con `font-variant-numeric: tabular-nums`) per tabelle, KPI, importi: allineamento in colonna obbligatorio.
- Scala fissa in rem, ratio ~1.2 (registro product, no fluid type). Body 16px, dati in tabella 13-14px, KPI display 28-32px semibold.
- Prosa max 65-75ch; tabelle possono correre più larghe.

## Components

- Vocabolario stati completo su ogni interattivo: default, hover, focus, active, disabled, loading, error.
- Loading: skeleton, non spinner centrali. Empty state che insegnano l'interfaccia.
- Tabelle dense con righe ~40px, numeri tabulari a destra, intestazioni sticky.
- Badge giudizio KPI: pallino colore + etichetta testuale ("Ottimo", "Critico"), bordo pieno 1px, mai side-stripe.
- Icone: Lucide, viewBox 24, mai emoji come icone.

## Layout

- App shell: sidebar navigazione (portafoglio clienti) + area contenuto; griglia prevedibile, breadcrumb, tab per sezioni cliente.
- Spaziatura ritmica su scala 4px; densità controllata: il dato respira ma lo studio lavora, niente hero sprecati.
- Card solo dove sono la vera affordance; mai card annidate, mai grid di card identiche come riempitivo.

## Motion

- 150-250 ms, ease-out esponenziale (quart/expo). Motion solo per stato: feedback, reveal, loading.
- Niente sequenze orchestrate al load, niente bounce. `prefers-reduced-motion` rispettato.

## Divieti (dalle leggi impeccable + anti-references PRODUCT.md)

Side-stripe borders; gradient text; glassmorphism di default; hero-metric template; card grid identiche; modal come primo riflesso; gradienti viola decorativi; neon/glow; estetica gestionale legacy.
