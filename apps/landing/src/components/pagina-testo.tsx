import { Contenitore } from "@/components/base";
import { Intestazione } from "@/components/sezioni/apertura";
import { Piede } from "@/components/sezioni/chiusura";

/** Impaginazione delle pagine di solo testo (privacy, note legali). */
export function PaginaTesto({
  titolo,
  aggiornamento,
  children,
}: {
  titolo: string;
  aggiornamento: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Intestazione />
      <main id="contenuto">
        <Contenitore className="py-16 md:py-24">
          <article className="max-w-[46rem]">
            <h1 className="text-[clamp(2rem,1.4rem+2.2vw,3rem)] leading-[1.08] font-semibold tracking-[-0.025em]">
              {titolo}
            </h1>
            <p className="mt-4 text-sm text-testo-attenuato">
              Ultimo aggiornamento: {aggiornamento}
            </p>
            <div className="testo-legale mt-10">{children}</div>
          </article>
        </Contenitore>
      </main>
      <Piede />
    </>
  );
}
