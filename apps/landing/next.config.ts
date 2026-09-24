import type { NextConfig } from "next";

const sviluppo = process.env.NODE_ENV !== "production";
const produzione = process.env.VERCEL_ENV === "production";

/**
 * Content-Security-Policy STATICA, senza nonce. È la scelta opposta a quella di
 * apps/web, e deliberata.
 *
 * Nell'app il nonce per richiesta obbliga a rendere dinamica ogni pagina: una
 * pagina pre-renderizzata non può contenere un valore che nasce alla richiesta
 * (GUASTI G-28). Qui la pagina DEVE restare statica, servita dalla CDN: è ciò che
 * tiene basso l'LCP. Il bootstrap di Next su una pagina statica usa script
 * inline, quindi serve 'unsafe-inline'.
 *
 * Il compromesso regge perché su questa pagina non c'è niente da rubare: nessuna
 * sessione, nessun cookie di autenticazione, nessun contenuto inserito da un
 * utente e rimandato indietro. Il modulo di richiesta demo viaggia verso una
 * Server Action e non viene mai riflesso nella pagina.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${sviluppo ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  ...(sviluppo ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const intestazioni = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  // Senza preload: iscriversi alla lista dei browser è una scelta che non si
  // ritira in fretta, e il dominio è appena nato.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Le anteprime di Vercel non devono finire nei motori: solo la produzione
  // è indicizzabile. Non ci si affida al comportamento predefinito di Vercel.
  ...(produzione ? [] : [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: intestazioni }];
  },
  async redirects() {
    // In PRODUZIONE un solo host serve la pagina: finbeacon.eu. Qualunque altro
    // (gli alias *.vercel.app che Vercel assegna da sé) rimanda lì, altrimenti
    // la stessa pagina sarebbe indicizzabile a due indirizzi.
    //
    // Non si elencano gli alias per nome: la prima versione lo faceva, e il nome
    // scritto a memoria (finbeacon-landing.vercel.app) non era quello assegnato
    // davvero (finbeacon-landing-docallfixs-projects.vercel.app). La regola non
    // sarebbe mai scattata. La negazione copre anche gli alias futuri.
    //
    // Fuori produzione niente: le anteprime devono restare raggiungibili al loro
    // indirizzo. www e finbeacon.it si rimandano dalle impostazioni di dominio.
    if (!produzione) return [];
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "^(?!finbeacon\\.eu$).+$" }],
        destination: "https://finbeacon.eu/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
