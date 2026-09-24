"use client";

import { useId, useState } from "react";

/**
 * Il giro guidato del prodotto (modello: la sezione funzioni di Mercury). A
 * sinistra le funzioni, una aperta alla volta; accanto, il pezzo di prodotto che
 * le corrisponde. Da telefono il pezzo compare sotto la voce aperta.
 *
 * Fisarmonica e non schede ARIA: un pulsante con `aria-expanded` è accessibile e
 * più semplice da tenere giusto. I pannelli arrivano già resi dal server (numeri
 * del motore): qui c'è solo quale mostrare.
 *
 * Tutte le descrizioni restano nell'HTML (le chiuse con `hidden`): chi legge la
 * pagina senza eseguire JavaScript, motori compresi, le trova tutte.
 */
export function GiroProdotto({
  voci,
  pannelli,
}: {
  voci: readonly { titolo: string; testo: string }[];
  pannelli: readonly React.ReactNode[];
}) {
  const [attivo, setAttivo] = useState(0);
  const base = useId();

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
      <ol className="border-t border-bordo">
        {voci.map((v, i) => {
          const aperta = i === attivo;
          const idTesto = `${base}-testo-${i}`;
          return (
            <li key={v.titolo} className="border-b border-filetto">
              <button
                type="button"
                aria-expanded={aperta}
                aria-controls={idTesto}
                onClick={() => setAttivo(i)}
                className="group grid w-full cursor-pointer grid-cols-[2.5rem_minmax(0,1fr)] items-baseline gap-x-4 py-5 text-left"
              >
                <span
                  className={`cifre text-sm ${aperta ? "text-accento" : "text-testo-attenuato"}`}
                  aria-hidden
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={`text-[1.0625rem] leading-snug font-semibold ${aperta ? "" : "text-testo-attenuato group-hover:text-testo"}`}
                >
                  {v.titolo}
                </span>
              </button>
              <div id={idTesto} hidden={!aperta} className="pb-6 pl-[3.5rem]">
                <p className="max-w-[34rem] text-[0.9375rem] leading-[1.6] text-testo-attenuato">
                  {v.testo}
                </p>
                {/* Da telefono il pezzo di prodotto sta sotto la voce aperta. */}
                <div className="mt-6 lg:hidden" aria-hidden>
                  <div key={`m-${attivo}`} className="pannello-giro">
                    {pannelli[i]}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Da schermo largo il pezzo di prodotto sta accanto, e resta fermo mentre si legge. */}
      <div className="hidden lg:block" aria-hidden>
        <div className="sticky top-28">
          <div key={attivo} className="pannello-giro">
            {pannelli[attivo]}
          </div>
        </div>
      </div>
    </div>
  );
}
