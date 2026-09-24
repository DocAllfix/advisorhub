import Link from "next/link";

/**
 * Mattoni comuni. Un solo contenitore e una sola larghezza per tutta la pagina:
 * il ritmo lo danno i fondi e i respiri, non larghezze diverse.
 */

export function Contenitore({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={`mx-auto w-full max-w-[72rem] px-5 sm:px-8 ${className}`}>{children}</div>;
}

export function Occhiello({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <p id={id} className="etichetta flex items-center gap-3 text-testo-attenuato">
      <span className="h-px w-6 bg-testo-attenuato" aria-hidden />
      {children}
    </p>
  );
}

export function Titolo2({
  id,
  children,
  className = "",
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      id={id}
      className={`mt-5 text-[clamp(1.75rem,1.2rem+2vw,2.625rem)] leading-[1.1] font-semibold tracking-[-0.02em] text-balance ${className}`}
    >
      {children}
    </h2>
  );
}

export function Paragrafo({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-[1.0625rem] leading-[1.65] text-testo-attenuato ${className}`}>
      {children}
    </p>
  );
}

const PULSANTE =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-pulsante)] px-5 text-[0.9375rem] font-medium whitespace-nowrap transition-transform duration-150 ease-[var(--ease-uscita)] hover:-translate-y-px active:translate-y-0";

/** L'azione principale: una sola per schermata (DESIGN.md), nell'accento. */
export function PulsantePrimario({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={`${PULSANTE} bg-accento text-su-accento`}>
      {children}
    </Link>
  );
}

/** Azione secondaria. Se esterna, si apre in una nuova scheda e lo dice. */
export function PulsanteSecondario({
  href,
  esterno = false,
  children,
}: {
  href: string;
  esterno?: boolean;
  children: React.ReactNode;
}) {
  const classi = `${PULSANTE} border border-bordo bg-superficie text-testo`;
  if (esterno) {
    return (
      <a href={href} className={classi} target="_blank" rel="noopener">
        {children}
        <span className="sr-only"> (si apre in una nuova scheda)</span>
      </a>
    );
  }
  return (
    <Link href={href} className={classi}>
      {children}
    </Link>
  );
}
