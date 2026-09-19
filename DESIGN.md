---
name: advisorhub
description: Analisi economico-finanziaria per studi professionali, con la calma di uno sportello privato.
colors:
  # Tema scuro: la base dell'applicazione.
  fondo-notte: "oklch(0.17 0.014 250)"
  superficie-notte: "oklch(0.215 0.014 250)"
  sidebar-notte: "oklch(0.14 0.014 250)"
  inchiostro-chiaro: "oklch(0.95 0.006 240)"
  inchiostro-attenuato-notte: "oklch(0.74 0.012 245)"
  bordo-notte: "oklch(0.32 0.016 250)"
  filetto-notte: "oklch(0.27 0.016 250)"
  ottanio-luce: "oklch(0.76 0.11 205)"
  verde-ottimo-notte: "oklch(0.76 0.14 155)"
  verde-buono-notte: "oklch(0.77 0.075 170)"
  ambra-attenzione-notte: "oklch(0.82 0.14 80)"
  rosso-critico-notte: "oklch(0.7 0.18 25)"
  # Tema chiaro: dal selettore, e sempre sul report di stampa.
  fondo-carta: "oklch(0.985 0.004 240)"
  superficie-carta: "oklch(0.997 0.002 240)"
  sidebar-carta: "oklch(0.965 0.006 245)"
  inchiostro-scuro: "oklch(0.22 0.012 250)"
  inchiostro-attenuato-carta: "oklch(0.45 0.012 245)"
  bordo-carta: "oklch(0.9 0.008 240)"
  filetto-carta: "oklch(0.93 0.008 240)"
  ottanio-profondo: "oklch(0.5 0.09 210)"
  verde-ottimo-carta: "oklch(0.55 0.13 155)"
  verde-buono-carta: "oklch(0.64 0.075 168)"
  ambra-attenzione-carta: "oklch(0.7 0.13 75)"
  rosso-critico-carta: "oklch(0.55 0.19 25)"
typography:
  display:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "3.75rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  headline:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  cifra:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  label:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.14em"
rounded:
  sm: "0.3rem"
  md: "0.4rem"
  lg: "0.5rem"
  xl: "0.7rem"
  full: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
components:
  button-primary:
    backgroundColor: "{colors.ottanio-luce}"
    textColor: "{colors.fondo-notte}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-outline:
    backgroundColor: "{colors.superficie-notte}"
    textColor: "{colors.inchiostro-chiaro}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  badge-giudizio-ottimo:
    backgroundColor: "oklch(0.27 0.05 155)"
    textColor: "oklch(0.86 0.12 155)"
    rounded: "{rounded.full}"
    padding: "2px 10px"
    typography: "{typography.label}"
  badge-giudizio-attenzione:
    backgroundColor: "oklch(0.29 0.05 75)"
    textColor: "oklch(0.88 0.12 85)"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-giudizio-critico:
    backgroundColor: "oklch(0.29 0.07 25)"
    textColor: "oklch(0.83 0.14 25)"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  card:
    backgroundColor: "{colors.superficie-notte}"
    textColor: "{colors.inchiostro-chiaro}"
    rounded: "{rounded.xl}"
    padding: "16px"
  ricerca-a-filo:
    backgroundColor: "transparent"
    textColor: "{colors.inchiostro-chiaro}"
    rounded: "0"
    height: "36px"
  riga-indicatore:
    textColor: "{colors.inchiostro-chiaro}"
    padding: "14px 0"
---

# Design System: advisorhub

## 1. Overview

**Creative North Star: «Lo sportello privato»**

Un colloquio in private banking: poco sul tavolo, tutto in ordine, nessuna fretta. Il commercialista apre advisorhub accanto al gestionale e lo tiene aperto per ore; quello che trova deve avere la calma di chi non ha bisogno di convincere. PRODUCT.md lo chiama «fiducia da private banking» e «calma operativa»: il sistema visivo è la traduzione di quelle due espressioni, non una decorazione sopra di esse.

La scena che decide il tema: **un professionista fra i 30 e i 65 anni, in studio, sotto luce artificiale, con lo strumento aperto tutto il giorno accanto ad altre finestre.** Per questo il tema di base è scuro (decisione del committente, luglio 2026): un fondo profondo stanca meno e fa risaltare i numeri, che sono il contenuto. Il tema scuro è **scelto, non invertito**: ha passi propri, con la sidebar più profonda del fondo e le superfici appena sopra, e un accento rialzato in chiarezza perché regga il contrasto. Il chiaro resta dal selettore ed è **sempre** quello del report di stampa, perché il report va su carta, al cliente e alla banca.

La densità è controllata: il dato respira ma lo studio lavora. Spaziatura su scala di 4px, nessun hero sprecato, e il ritmo verticale di una sezione scende da una variabile locale (il modello è `--card-spacing` dentro la card) invece di essere riscritto a mano in ogni schermata. Il movimento esiste solo per dire che uno stato è cambiato: 150-250 ms, uscita esponenziale, mai rimbalzi, mai sequenze orchestrate al caricamento, e sempre spento sotto `prefers-reduced-motion`.

Il sistema rifiuta per nome quattro famiglie: i gestionali legacy anni 2000, le dashboard SaaS cliché, l'estetica crypto e trading, e il prototipo HTML di partenza, che resta un riferimento funzionale e non estetico.

**Key Characteristics:**

- Il numero è il protagonista: mono tabellare, incolonnato, mai decorato.
- Colore confinato all'accento e ai giudizi; tutto il resto è inchiostro tinto.
- Profondità per livelli tonali, non per ombre.
- Allineamento come forma di onestà: le colonne reggono anche quando le etichette cambiano lunghezza.
- Ogni schermata si può mostrare a un cliente così com'è.

## 2. Colors: La palette dell'inchiostro e dell'ottanio

Strategia Restrained: neutri freddi appena tinti verso il blu-inchiostro, un solo accento, e un tricolore semantico riservato ai giudizi.

### Primary

- **Ottanio luce** (`ottanio-luce`, tema scuro) e **Ottanio profondo** (`ottanio-profondo`, tema chiaro): azioni primarie, voce di navigazione attiva, anello di focus, serie principale dei grafici. Un teal-inchiostro scelto per stare lontano da tre riflessi insieme: l'indigo del prototipo, il navy-oro della finanza, il viola dei SaaS.

### Neutral

- **Fondo notte / Fondo carta**: il piano di lavoro. Mai nero, mai bianco puri.
- **Superficie notte / Superficie carta**: card, popover, pannelli; un gradino sopra il fondo.
- **Sidebar notte / Sidebar carta**: la colonna di navigazione, un gradino sotto il fondo. Tre livelli danno struttura senza bordi pesanti.
- **Inchiostro chiaro / Inchiostro scuro**: il testo principale.
- **Inchiostro attenuato**: testo secondario, etichette, metadati. È al limite del contrasto AA: non sopporta altra attenuazione sopra di sé (vedi la Regola dell'Attenuazione Decorativa).
- **Bordo** e **Filetto**: il bordo chiude un contenitore, il filetto separa righe editoriali ed è più tenue. Sul fondo scuro sono in tinta piena e mai in bianco trasparente, che su una tabella densa scompare.

### Tertiary: il tricolore dei giudizi

- **Verde ottimo**, **Verde buono** (un gradino sotto, meno saturo), **Ambra attenzione**, **Rosso critico**. Ciascuno in tre varianti: base per la grafica, foreground per il testo, subtle per il fondo del badge.

### Named Rules

**La Regola dell'Unica Voce.** L'ottanio copre al massimo il 10% di una schermata. La sua rarità è ciò che lo fa leggere come azione.

**La Regola del Semaforo Parlante.** Il tricolore si usa solo per i giudizi, e il colore non è mai l'unico canale: ogni pallino ha accanto la sua etichetta scritta. Nei grafici di serie generiche il tricolore è vietato.

## 3. Typography

**Display e cifre:** IBM Plex Mono (con `ui-monospace`)
**Testo e interfaccia:** IBM Plex Sans (con `system-ui`)

**Character:** Una sola famiglia in due voci. Il Sans è la voce del consulente, piana e precisa; il Mono è la voce del prospetto, dove ogni cifra occupa la stessa larghezza e le colonne si allineano da sole.

### Hierarchy

- **Display** (600, 3.75rem, interlinea 1, tracking -0.02em, mono tabellare): il punteggio di sintesi dentro l'anello, un solo numero per schermata.
- **Headline** (600, 1.5rem, tracking stretto): il titolo della pagina e il giudizio di sintesi.
- **Title** (600, 0.875rem): il nome di un indicatore, di un cliente in elenco.
- **Body** (400, 0.875rem, interlinea 1.5): consigli, descrizioni, celle di tabella. La prosa si ferma a 72ch; le tabelle possono correre più larghe.
- **Cifra** (600, 1.5rem, mono tabellare): valori degli indicatori e punteggi in elenco. In tabella scende a 1rem, perché lì il numero è uno di sessanta e non deve dettare l'altezza della riga.
- **Label** (500, 11px, tracking 0.14em, maiuscolo): intestazioni di colonna e micro-etichette di sezione.

### Named Rules

**La Regola della Colonna Tabellare.** Ogni numero che si confronta con un altro è in mono tabellare e allineato a destra nella sua traccia. Nessuna eccezione per i numeri «piccoli».

**La Regola della Scala Fissa.** Scala in rem con rapporto intorno a 1,2, senza tipografia fluida: il registro è product, non landing.

## 4. Elevation

Il sistema è **piatto**. La profondità si esprime con tre livelli tonali (sidebar sotto il fondo, fondo, superficie sopra il fondo) e con il bordo in tinta piena, non con le ombre. In tutta l'applicazione le ombre compaiono in quattro punti, e sono tutti elementi che galleggiano davvero sopra la pagina: menu a tendina, popover, il riquadro della guida.

### Shadow Vocabulary

- **Sospensione** (`shadow-md`, e `0 8px 30px` in tinta del fondo per il popover della guida): solo per ciò che si apre sopra il contenuto e se ne va. Mai su card a riposo.

### Named Rules

**La Regola del Piano Unico.** Una card a riposo non ha ombra. Se una superficie sembra aver bisogno di un'ombra per staccarsi, il problema è il passo tonale, non l'ombra.

## 5. Components

### Riga indicatore (componente firma)

La forma che il prodotto ripete più di ogni altra: un titolo, un valore, una barra di posizione, un giudizio.

- **Struttura:** griglia a **tracce fisse**, non flex elastico: titolo in `minmax(0,1fr)`, valore 7rem allineato a destra, barra 5rem, giudizio 11rem.
- **Perché fisse:** ogni riga è una griglia a sé, e una traccia elastica si dimensiona sul contenuto della singola riga. Con un flex, «Ottimo» e «Sostiene sviluppo» misurano diverso e valore e barra slittano di riga in riga.
- **Giudizio:** allineato a sinistra nella sua traccia, così i pallini formano una colonna verticale che si scorre con l'occhio.
- **Consiglio:** sotto, in chiaro, senza prefisso: le frasi sono già all'imperativo.
- **Sotto 768px:** la barra sparisce e il giudizio va a capo sotto il titolo.

### Badge di giudizio

- **Forma:** pillola (`rounded-full`), bordo pieno 1px in tinta, pallino da 6px più etichetta testuale.
- **Colore:** fondo subtle e testo foreground della tinta del giudizio.
- **Mai** usato per stati che non siano un giudizio sul dato.

### Pulsanti

- **Forma:** angoli appena arrotondati (0.4rem), altezza 36px su desktop, 44px al tocco.
- **Primario:** ottanio pieno, testo sul fondo. Uno per schermata.
- **Outline e ghost:** per le azioni secondarie e le viste (Attivi, In allerta, Archiviati).
- **Focus:** anello da 2px nell'accento, sempre visibile da tastiera.

### Card e contenitori

- **Angoli:** 0.7rem. **Fondo:** superficie. **Bordo:** anello da 1px in inchiostro al 10%, che non sposta il layout.
- **Padding:** governato da una sola variabile locale (`--card-spacing`, 16px o 12px nella variante stretta).
- **Uso:** solo dove sono l'affordance giusta. Il pannello del DSCR prospettico a 6 mesi è incorniciato di proposito: è il dato di continuità aziendale dell'art. 3 CCII, non un indicatore fra gli altri.

### Campi

- **Ricerca a filo:** nessuna scatola, solo un filetto inferiore che diventa ottanio al focus. Un campo, non una scatola dentro una scatola.
- **Moduli:** bordo in tinta piena, focus con anello nell'accento, errore con messaggio testuale sotto il campo.

### Tabelle ed elenchi

- **Righe:** obiettivo ~40px; oggi il portafoglio misura 49px.
- **Intestazioni:** micro-etichette, sticky durante lo scorrimento.
- **Priorità di colonna:** la colonna che porta il giudizio viene sempre subito dopo il nome, e a ritirarsi quando manca spazio sono le accessorie (dimensione, ATECO, data).
- **Sotto 768px:** la tabella diventa elenco a due righe, nome e punteggio sopra, metadati e giudizio sotto, con il punteggio in una traccia fissa. Non schede.

### Navigazione

- **Sidebar:** voce attiva su fondo accento tenue con testo in ottanio; comprimibile. Sotto 768px diventa un pannello aperto dal menu.

### Numeri in movimento

- **Punteggio di sintesi:** conta cifra per cifra quando cambia in simulazione (NumberFlow). Solo su interi puri: i valori degli indicatori sono stringhe già formattate («n.d.», «∞», «1,05 anni») e non passano da qui.
- **Elenchi che si riordinano o si filtrano:** transizione automatica sulle righe (AutoAnimate).
- **Vincolo di sicurezza:** nessuna libreria che inietti `<script>` inline; la Content-Security-Policy usa un nonce per richiesta. Gli stili inline sono ammessi.

## 6. Do's and Don'ts

### Do:

- **Do** usare tracce di griglia **fisse** per ogni riga che si confronta con altre, misurate sull'etichetta più lunga che può comparirci (11rem per i giudizi degli indicatori, 9rem per le fasce di salute).
- **Do** prendere soglie, fasce e fondi scala dal motore (`FASCE_SALUTE`, `SOGLIE_GIUDIZIO`, `SCALE`): la dashboard e il report disegnano lo stesso indicatore sulla stessa scala.
- **Do** verificare ogni componente nuovo in **entrambi** i temi e a 375px, 768px e 1440px prima di considerarlo finito.
- **Do** tenere il report di stampa sempre su fondo chiaro, anche con l'app in scuro.
- **Do** usare skeleton e non spinner centrali; stati vuoti che dicono cosa fare dopo.
- **Do** rispettare `prefers-reduced-motion` anche per le animazioni WAAPI, che la regola CSS globale non raggiunge.

### Don't:

- **Don't** richiamare i gestionali legacy anni 2000: griglie grigie, form infiniti, ribbon, densità caotica.
- **Don't** usare gli stilemi delle dashboard SaaS cliché: gradienti viola decorativi, glassmorphism di default, card grid tutte uguali, hero-metric gonfiati, gradient text.
- **Don't** scivolare nell'estetica crypto e trading: dark mode aggressivo, neon, glow, urgenza speculativa. Nessun nero puro.
- **Don't** usare bordi laterali colorati più spessi di 1px come segnale su card, righe o avvisi.
- **Don't** aprire un modale come prima risposta: prima l'inline, poi il pannello laterale.
- **Don't** mettere un badge a larghezza intrinseca in una riga flex accanto a elementi che devono incolonnarsi. È il difetto che faceva slittare sei indicatori su sette.
- **Don't** usare trattini lunghi nei testi dell'interfaccia: virgole, due punti, parentesi.

### Named Rules

**La Regola dell'Attenuazione Decorativa.** L'opacità si applica solo a elementi decorativi e `aria-hidden`, mai al testo. L'inchiostro attenuato è già al limite dell'AA: un `opacity-45` sopra di lui lo portava a 2,08:1 in chiaro e 2,57:1 in scuro. Test: se un elemento attenuato contiene parole, è sbagliato.

**La Regola del Giudizio in Vista.** A qualsiasi larghezza, il giudizio di un cliente è visibile senza scorrere in orizzontale. Se una colonna deve uscire dallo schermo, esce un'accessoria.
