"use client";

import { useEffect } from "react";

/**
 * Fa comparire, una volta sola, gli elementi `.comparsa` quando entrano in
 * vista. Il loro stato nascosto esiste solo con `html.js` e con il movimento
 * consentito (globals.css): senza JavaScript, o con reduced-motion, sono già
 * visibili, e il contenuto non dipende mai da questo script.
 */
export function Comparse() {
  useEffect(() => {
    const elementi = document.querySelectorAll<HTMLElement>(".comparsa:not([data-visibile])");
    if (!("IntersectionObserver" in window)) {
      elementi.forEach((el) => el.setAttribute("data-visibile", ""));
      return;
    }
    const osservatore = new IntersectionObserver(
      (voci) => {
        for (const voce of voci) {
          if (!voce.isIntersecting) continue;
          voce.target.setAttribute("data-visibile", "");
          osservatore.unobserve(voce.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    elementi.forEach((el) => osservatore.observe(el));
    return () => osservatore.disconnect();
  }, []);
  return null;
}
