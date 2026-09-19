export { analizza } from "./analizza";
export { calcolaIndicatori } from "./indicatori";
export {
  calcolaGiudizi,
  giudicaDscr,
  giudicaDscrProspettico,
  giudicaGi,
  giudicaRoe,
  giudicaRoi,
  giudicaRoiIndustriale,
  giudicaRos,
  giudicaTurnover,
  SOGLIE_GIUDIZIO,
  type ChiaveSoglia,
} from "./giudizi";
export {
  calcolaAnalisiEstesa,
  calcolaAreeAttenzione,
  calcolaAzionePrioritaria,
  calcolaPuntiForza,
  calcolaScore,
  calcolaSintesi,
  FASCE_SALUTE,
  fasciaSalute,
  type FasciaSalute,
} from "./sintesi";
export {
  sintetizzaPortafoglio,
  type SintesiPortafoglio,
  type StatoPortafoglio,
} from "./portafoglio";
export { formatEuro, formatNumero, parseNumeroIt } from "./numeri";
export {
  INTESTAZIONI_EXPORT,
  mappaBilancioDaCsv,
  rigaExport,
  serializzaCsv,
  type BilancioDaCsv,
} from "./csv";
export type {
  Analisi,
  DatiBilancio,
  DatiPrevisionali6M,
  Giudizio,
  Indicatori,
  Sintesi,
  Tono,
  VoceElenco,
} from "./types";
