"use client";

import { useActionState, useEffect, useRef } from "react";

import { inviaRichiesta } from "@/app/azioni";
import {
  eMotivo,
  FASCE_CLIENTI,
  MOTIVI,
  type CampoModulo,
  type EsitoRichiesta,
} from "@/lib/modulo";

/**
 * Il modulo di richiesta. Funziona anche senza JavaScript (Server Action con
 * invio classico); con JavaScript mostra gli esiti sul posto.
 *
 * Il motivo si può preselezionare con `?motivo=appuntamento` (lo usa anche la
 * futura demo pubblica dell'app). Si legge nel browser: leggerlo dal server
 * renderebbe dinamica una pagina che deve restare statica.
 */
export function ModuloDemo({ emailRipiego }: { emailRipiego: string | null }) {
  const [esito, azione, inCorso] = useActionState<EsitoRichiesta | null, FormData>(
    inviaRichiesta,
    null,
  );
  const riepilogo = useRef<HTMLDivElement>(null);
  const campoMotivo = useRef<HTMLSelectElement>(null);
  const campoAvvio = useRef<HTMLInputElement>(null);

  // Scrittura diretta nel DOM, non stato: sono valori che il browser conosce e
  // React no (l'indirizzo della pagina, l'ora in cui il modulo è comparso).
  // Si ripete a ogni esito, perché il modulo si ricrea.
  useEffect(() => {
    const dallaPagina = new URLSearchParams(window.location.search).get("motivo");
    if (campoMotivo.current && !esito && eMotivo(dallaPagina))
      campoMotivo.current.value = dallaPagina;
    if (campoAvvio.current) campoAvvio.current.value = String(Date.now());
  }, [esito]);

  useEffect(() => {
    if (esito && esito.stato !== "non-valida") riepilogo.current?.focus();
  }, [esito]);

  if (esito?.stato === "inviata") {
    return (
      <div
        ref={riepilogo}
        tabIndex={-1}
        role="status"
        className="rounded-[0.8rem] border border-bordo bg-superficie p-8 outline-none"
      >
        <p className="text-xl font-semibold">Richiesta ricevuta.</p>
        <p className="mt-3 text-[0.9375rem] leading-[1.65] text-testo-attenuato">
          Ti scriviamo all&apos;indirizzo che hai indicato per fissare la demo.
        </p>
      </div>
    );
  }

  const errori: Partial<Record<CampoModulo, string>> =
    esito?.stato === "non-valida" ? esito.errori : {};
  const valori = esito?.stato === "non-valida" || esito?.stato === "errore" ? esito.valori : {};

  return (
    // `key`: a ogni esito il modulo si ricrea con i valori rimandati dal server.
    <form
      key={JSON.stringify(valori)}
      action={azione}
      noValidate
      className="rounded-[0.8rem] border border-bordo bg-superficie p-6 sm:p-8"
    >
      {esito?.stato === "errore" && (
        <div
          ref={riepilogo}
          tabIndex={-1}
          role="alert"
          className="mb-6 rounded-[0.5rem] border border-critico/40 bg-critico-fondo px-4 py-3 text-[0.9375rem] text-critico-testo outline-none"
        >
          L&apos;invio non è riuscito, e la richiesta non ci è arrivata.{" "}
          {emailRipiego ? (
            <>
              Scrivici direttamente a{" "}
              <a
                href={`mailto:${emailRipiego}`}
                className="font-semibold underline underline-offset-2"
              >
                {emailRipiego}
              </a>
              , oppure riprova fra poco.
            </>
          ) : (
            "Riprova fra poco."
          )}
        </div>
      )}
      {esito?.stato === "inattivo" && (
        <div
          ref={riepilogo}
          tabIndex={-1}
          role="status"
          className="mb-6 rounded-[0.5rem] border border-bordo bg-tonale px-4 py-3 text-[0.9375rem] outline-none"
        >
          In questa versione di prova l&apos;invio è disattivato: nessuna richiesta è stata spedita.
        </div>
      )}

      {/* Trappola per i programmi: invisibile e fuori dal percorso della tastiera. */}
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden>
        <label>
          Sito web
          <input type="text" name="sito" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <input ref={campoAvvio} type="hidden" name="t" defaultValue="" />

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo
          nome="nome"
          etichetta="Nome e cognome"
          errore={errori.nome}
          valore={valori.nome}
          autoComplete="name"
          obbligatorio
        />
        <Campo
          nome="studio"
          etichetta="Studio"
          errore={errori.studio}
          valore={valori.studio}
          autoComplete="organization"
          obbligatorio
        />
        <Campo
          nome="email"
          etichetta="Email"
          tipo="email"
          errore={errori.email}
          valore={valori.email}
          autoComplete="email"
          obbligatorio
        />
        <Campo
          nome="telefono"
          etichetta="Telefono"
          tipo="tel"
          errore={errori.telefono}
          valore={valori.telefono}
          autoComplete="tel"
        />

        <div>
          <label htmlFor="clienti" className="text-sm font-semibold">
            Clienti seguiti <span className="font-normal text-testo-attenuato">(facoltativo)</span>
          </label>
          <select id="clienti" name="clienti" defaultValue={valori.clienti ?? ""} className={CAMPO}>
            <option value="">Preferisco non dirlo</option>
            {FASCE_CLIENTI.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="motivo" className="text-sm font-semibold">
            Cosa ti interessa
          </label>
          <select
            ref={campoMotivo}
            id="motivo"
            name="motivo"
            defaultValue={valori.motivo ?? "demo"}
            className={CAMPO}
          >
            {Object.entries(MOTIVI).map(([valore, testo]) => (
              <option key={valore} value={valore}>
                {testo}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="messaggio" className="text-sm font-semibold">
            Messaggio <span className="font-normal text-testo-attenuato">(facoltativo)</span>
          </label>
          <textarea
            id="messaggio"
            name="messaggio"
            rows={4}
            maxLength={2000}
            defaultValue={valori.messaggio ?? ""}
            aria-invalid={Boolean(errori.messaggio)}
            aria-describedby={errori.messaggio ? "messaggio-errore" : undefined}
            className={`${CAMPO} h-auto py-2.5`}
          />
          {errori.messaggio && <Errore id="messaggio-errore">{errori.messaggio}</Errore>}
        </div>
      </div>

      <p className="mt-6 text-[0.8125rem] leading-[1.55] text-testo-attenuato">
        Usiamo questi dati solo per risponderti e organizzare la demo. Dettagli nell&apos;
        <a href="/privacy" className="underline underline-offset-2 hover:text-testo">
          informativa sulla privacy
        </a>
        .
      </p>

      <button
        type="submit"
        disabled={inCorso}
        className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-[var(--radius-pulsante)] bg-accento px-5 text-[0.9375rem] font-medium text-su-accento transition-transform duration-150 ease-[var(--ease-uscita)] enabled:hover:-translate-y-px disabled:cursor-progress sm:w-auto"
      >
        {inCorso ? "Invio in corso…" : "Invia la richiesta"}
      </button>
    </form>
  );
}

const CAMPO =
  "mt-2 block h-11 w-full rounded-[var(--radius-pulsante)] border border-bordo bg-fondo px-3 text-[0.9375rem] text-testo aria-[invalid=true]:border-critico";

function Campo({
  nome,
  etichetta,
  tipo = "text",
  errore,
  valore,
  autoComplete,
  obbligatorio = false,
}: {
  nome: CampoModulo;
  etichetta: string;
  tipo?: string;
  errore?: string;
  valore?: string;
  autoComplete?: string;
  obbligatorio?: boolean;
}) {
  const idErrore = `${nome}-errore`;
  return (
    <div>
      <label htmlFor={nome} className="text-sm font-semibold">
        {etichetta}
        {!obbligatorio && <span className="font-normal text-testo-attenuato"> (facoltativo)</span>}
      </label>
      <input
        id={nome}
        name={nome}
        type={tipo}
        autoComplete={autoComplete}
        required={obbligatorio}
        defaultValue={valore ?? ""}
        aria-invalid={Boolean(errore)}
        aria-describedby={errore ? idErrore : undefined}
        className={CAMPO}
      />
      {errore && <Errore id={idErrore}>{errore}</Errore>}
    </div>
  );
}

function Errore({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-1.5 text-[0.8125rem] text-critico-testo">
      {children}
    </p>
  );
}
