import { calcolaGiudizi } from "./giudizi";
import { calcolaIndicatori } from "./indicatori";
import {
  calcolaAnalisiEstesa,
  calcolaAreeAttenzione,
  calcolaAzionePrioritaria,
  calcolaPuntiForza,
  calcolaScore,
  calcolaSintesi,
} from "./sintesi";
import type { Analisi, DatiBilancio, DatiPrevisionali6M } from "./types";

/**
 * Analisi completa di un esercizio: indicatori, giudizi, score, sintesi e testi.
 * `previsionale` (facoltativo) abilita il DSCR prospettico 6M ex CNDCEC.
 */
export function analizza(dati: DatiBilancio, previsionale?: DatiPrevisionali6M): Analisi {
  const indicatori = calcolaIndicatori(dati, previsionale);
  const giudizi = calcolaGiudizi(indicatori, dati);
  const score = calcolaScore(giudizi);
  return {
    indicatori,
    giudizi,
    score,
    sintesi: calcolaSintesi(score),
    azionePrioritaria: calcolaAzionePrioritaria(score),
    puntiForza: calcolaPuntiForza(indicatori, giudizi),
    areeAttenzione: calcolaAreeAttenzione(indicatori),
    analisiEstesa: calcolaAnalisiEstesa(indicatori, dati),
  };
}
