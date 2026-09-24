/**
 * I TESTI della landing, in un posto solo. Le sezioni e i dati strutturati
 * leggono da qui: la FAQ in pagina e quella nel JSON-LD sono lo stesso array,
 * quindi non possono divergere.
 *
 * Regole di scrittura (DESIGN.md e brief): italiano corretto e tecnico dove
 * serve, niente trattini lunghi, niente promesse che il prodotto non mantiene.
 * Ogni affermazione qui sotto è stata controllata sul codice dell'applicazione
 * (per esempio: il report porta il NOME dello studio in testata, non un logo
 * caricato; i bilanci entrano a mano o da CSV, non da un'integrazione diretta).
 */

export const VOCI_MENU = [
  { href: "#cosa-fa", testo: "Cosa fa" },
  { href: "#report", testo: "Il report" },
  { href: "#anteprima", testo: "Anteprima" },
  { href: "#metodo", testo: "Metodo" },
  { href: "#riservatezza", testo: "Riservatezza" },
] as const;

export const HERO = {
  occhiello: "Per gli studi commercialisti",
  titolo: "Vedi la crisi arrivare, cliente per cliente.",
  sottotitolo: "E consegna al cliente e alla banca il report che la documenta.",
  testo:
    "FinBeacon calcola gli indicatori di bilancio e il DSCR prospettico a sei mesi di ogni cliente dello studio, con le soglie del Codice della crisi. Un punteggio annuale può dire «migliorabile» mentre la cassa dice già altro: FinBeacon te lo mostra accanto al cliente, prima che arrivi nel bilancio.",
  rassicurazione: "Nessuna installazione. Un server dedicato al tuo studio, in Europa.",
} as const;

export const FUNZIONI = [
  {
    titolo: "Tutti i clienti, un giudizio ciascuno",
    testo:
      "Il portafoglio dello studio in una vista: punteggio, fascia di salute e allerte. Chi ha bisogno di te sale in cima.",
  },
  {
    titolo: "Ogni indicatore con soglia e consiglio",
    testo:
      "ROS, ROI, ROE, grado di indebitamento, DSCR: accanto a ogni valore la soglia, il giudizio in parole e cosa fare.",
  },
  {
    titolo: "Il DSCR prospettico a sei mesi",
    testo:
      "Dalla tesoreria prevista, il dato di continuità che l'art. 3 del Codice della crisi chiede di guardare. Si accende prima del bilancio.",
  },
  {
    titolo: "Le leve, provate prima di proporle",
    testo:
      "Il simulatore muove ricavi, costi e debito e mostra come cambiano punteggio e giudizi, prima di parlarne con il cliente.",
  },
  {
    titolo: "Il report per il cliente e per la banca",
    testo:
      "Un documento in PDF con il nome dello studio, gli indicatori e i giudizi. Nasce dall'analisi, quindi è sempre allineato ai numeri.",
  },
  {
    titolo: "Le scadenze del portafoglio",
    testo:
      "Bilanci da acquisire e verifiche da ripetere, cliente per cliente, senza tenere fogli a parte.",
  },
] as const;

export const REPORT = {
  occhiello: "Il documento",
  titolo: "Il report che consegni, generato dai numeri.",
  testo:
    "Ogni analisi diventa un documento da mettere sul tavolo: la sintesi, gli indicatori con soglia e giudizio, il DSCR prospettico, le aree di attenzione e le azioni suggerite. In PDF, con il nome dello studio in testata, sempre su carta chiara, come si stampa.",
  destinatari: [
    { chi: "Per il cliente", cosa: "capisce dove si trova e cosa fare, in parole sue." },
    { chi: "Per la banca", cosa: "numeri e soglie dichiarate, nessuna scatola nera." },
    { chi: "Per lo studio", cosa: "la stessa analisi, senza ricopiare niente a mano." },
  ],
} as const;

export const ANTEPRIMA = {
  occhiello: "Anteprima",
  titolo: "Muovi i numeri, guarda il giudizio.",
  testo:
    "Qui sotto lavora il motore di FinBeacon, lo stesso dell'applicazione, su un cliente di esempio. Sposta la liquidità, il reddito operativo o il debito: punteggio, giudizi e DSCR prospettico si ricalcolano come nel prodotto.",
} as const;

export const METODO = {
  occhiello: "Metodo",
  titolo: "Numeri che reggono davanti a chiunque.",
  testo:
    "Un giudizio vale quanto la sua soglia. Per questo le soglie si vedono, e il calcolo è uno solo.",
  punti: [
    {
      titolo: "Soglie dichiarate, prese dalla norma",
      testo:
        "Il DSCR prospettico a sei mesi si giudica sulla soglia che il CNDCEC indica per l'art. 3 del Codice della crisi. Ogni soglia è scritta accanto al numero, non nascosta.",
    },
    {
      titolo: "Un solo motore di calcolo",
      testo:
        "Portafoglio, analisi, simulatore e report leggono lo stesso motore: un indicatore vale lo stesso ovunque lo guardi.",
    },
    {
      titolo: "Dal dato al consiglio",
      testo:
        "Ogni giudizio porta con sé la lettura e l'azione suggerita, scritte come le diresti al cliente.",
    },
    {
      titolo: "Formule standard, nessuna scatola nera",
      testo:
        "ROS, ROI, ROE, grado di indebitamento e DSCR sono le formule dell'analisi di bilancio che già conosci.",
    },
    {
      titolo: "Verificato su bilanci veri",
      testo:
        "Il motore è controllato su bilanci reali: punteggi e giudizi coincidono con quelli dei report prodotti prima di FinBeacon. Il controllo è automatico, e si ripete a ogni modifica.",
    },
  ],
} as const;

export const RISERVATEZZA = {
  occhiello: "Riservatezza",
  titolo: "I dati dei tuoi clienti restano dei tuoi clienti.",
  punti: [
    {
      titolo: "Un server per ogni studio",
      testo:
        "Ogni studio ha la propria installazione e il proprio database: i dati di uno studio non stanno mai accanto a quelli di un altro.",
    },
    {
      titolo: "In Unione europea",
      testo: "Server e copie di sicurezza in data center europei.",
    },
    {
      titolo: "Copie cifrate, e provate",
      testo:
        "Una copia cifrata ogni giorno, e ogni mese una prova di ripristino automatica: una copia che non si prova non è una copia.",
    },
    {
      titolo: "Nessun numero nei registri tecnici",
      testo:
        "Il monitoraggio tecnico vede errori e prestazioni, mai i dati di bilancio dei clienti.",
    },
  ],
} as const;

export const DOMANDE = [
  {
    domanda: "Devo installare qualcosa?",
    risposta:
      "No. FinBeacon si usa dal browser. Per ogni studio prepariamo un'installazione dedicata, raggiungibile a un indirizzo proprio.",
  },
  {
    domanda: "Come entrano i bilanci?",
    risposta:
      "Per ogni esercizio servono dieci grandezze di bilancio: si inseriscono a mano oppure si importano da un file CSV.",
  },
  {
    domanda: "Si collega al mio gestionale?",
    risposta:
      "Oggi non c'è un collegamento diretto: i bilanci entrano a mano o con un file CSV. È il modo più semplice per cominciare senza toccare i programmi che usi già.",
  },
  {
    domanda: "Quali norme segue?",
    risposta:
      "L'allerta sul DSCR prospettico a sei mesi segue l'art. 3 del Codice della crisi d'impresa e dell'insolvenza e la soglia indicata dal CNDCEC. Le soglie di ogni indicatore sono scritte accanto al valore.",
  },
  {
    domanda: "Chi vede i dati dei miei clienti?",
    risposta:
      "Solo le persone dello studio a cui dai accesso. Ogni studio ha la propria installazione e il proprio database.",
  },
  {
    domanda: "Com'è fatto il report?",
    risposta:
      "È un PDF con il nome dello studio in testata: sintesi, indicatori con soglia e giudizio, DSCR prospettico, aree di attenzione e azioni suggerite. Si genera dall'analisi con un clic.",
  },
  {
    domanda: "Cosa succede in una demo?",
    risposta:
      "Ti mostriamo FinBeacon su un portafoglio di esempio e rispondiamo alle tue domande. Se vuoi, proviamo insieme un bilancio che porti tu.",
  },
] as const;

export const CHIUSURA = {
  occhiello: "Richiedi una demo",
  titolo: "Guardalo sui numeri del tuo studio.",
  testo:
    "Scrivici due righe: ti ricontattiamo per fissare una demo. Se preferisci scegliere subito un orario, prenota una chiamata.",
} as const;
