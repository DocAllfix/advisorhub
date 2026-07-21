/**
 * Valore che entra con una breve dissolvenza a ogni cambio: nel simulatore
 * comunica che il ricalcolo è avvenuto. La `key` sul valore forza il rientro
 * dell'animazione; `motion-safe` la disattiva con prefers-reduced-motion.
 */
export function NumeroAnimato({ testo }: { testo: string }) {
  return (
    <span
      key={testo}
      className="inline-block motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200"
    >
      {testo}
    </span>
  );
}
