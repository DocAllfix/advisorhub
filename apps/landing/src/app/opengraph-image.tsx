import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { formatNumero } from "@finbeacon/engine";
import { ImageResponse } from "next/og";

import { HERO } from "@/lib/contenuti";
import { ANALISI_ESEMPIO, SERIE_DSCR6M, SOGLIA_DSCR6M } from "@/lib/esempio";
import { tracciaSoglia } from "@/lib/soglia";

/**
 * L'anteprima dei link (LinkedIn, WhatsApp, motori): composta in codice, non
 * un file statico, così segue i testi e i numeri della pagina da sola.
 *
 * Le istanze cliente non sono indicizzabili: questa è l'unica anteprima che
 * esisterà mai del prodotto.
 *
 * Due vincoli del renderer (Satori): non legge `oklch` né le variabili CSS, e
 * non legge `woff2`. Colori in esadecimale (convertiti dai token di DESIGN.md e
 * verificati) e font TrueType, gli stessi del report.
 */
export const alt = `FinBeacon. ${HERO.titolo}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const C = {
  carta: "#f8fafd",
  inchiostro: "#161b20",
  attenuato: "#50565c",
  ottanio: "#00717f",
  notte: "#0b1015",
  superficieNotte: "#151a20",
  inchiostroChiaro: "#ebeff2",
  attenuatoNotte: "#a5acb2",
  bordoNotte: "#2d343b",
  ottanioLuce: "#47c5d2",
  criticoTesto: "#ffa199",
  criticoFondo: "#481b19",
  criticoSegno: "#fa6863",
};

const SIMBOLO =
  "M16 4H48A12 12 0 0 1 50.39 4.24L24.32 37.61A6.2 6.2 0 1 0 25.87 39.4L60 19.69V48A12 12 0 0 1 48 60H16A12 12 0 0 1 4 48V16A12 12 0 0 1 16 4Z";

function svgDati(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function grafico(): string {
  const L = 336;
  const A = 110;
  const { punti, ySoglia, attraversamento } = tracciaSoglia(
    SERIE_DSCR6M.map((r) => r.dscr6m),
    SOGLIA_DSCR6M,
    L,
    A,
  );
  const serie = punti.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const luce = attraversamento
    ? `<line x1="${attraversamento.x}" y1="${ySoglia}" x2="${attraversamento.x}" y2="${A}" stroke="${C.ottanioLuce}" stroke-width="2" opacity=".35"/><circle cx="${attraversamento.x}" cy="${ySoglia}" r="7" fill="${C.ottanioLuce}"/>`
    : "";
  return svgDati(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 ${L + 16} ${A + 16}" width="${L + 16}" height="${A + 16}"><polyline points="${serie}" fill="none" stroke="${C.inchiostroChiaro}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><line x1="-8" x2="${L + 8}" y1="${ySoglia}" y2="${ySoglia}" stroke="${C.bordoNotte}" stroke-width="2"/>${luce}</svg>`,
  );
}

async function font(nome: string) {
  return readFile(join(process.cwd(), "src/assets/fonts", nome));
}

export default async function ImmagineAnteprima() {
  const [sans, sansForte, mono] = await Promise.all([
    font("IBMPlexSans-Regular.ttf"),
    font("IBMPlexSans-SemiBold.ttf"),
    font("IBMPlexMono-SemiBold.ttf"),
  ]);
  const dscr6m = ANALISI_ESEMPIO.indicatori.dscrProspettico!;
  const giudizio = ANALISI_ESEMPIO.giudizi.dscrPro;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: C.carta,
        padding: 64,
        fontFamily: "Plex",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: 600,
          paddingRight: 48,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={svgDati(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><path fill="${C.ottanio}" fill-rule="evenodd" d="${SIMBOLO}"/></svg>`,
            )}
            width={52}
            height={52}
            alt=""
          />
          <span style={{ fontSize: 36, fontWeight: 600, color: C.inchiostro, letterSpacing: -0.5 }}>
            FinBeacon
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: 64,
              fontWeight: 600,
              lineHeight: 1.04,
              color: C.inchiostro,
              letterSpacing: -2,
            }}
          >
            {HERO.titolo}
          </span>
          <span style={{ marginTop: 24, fontSize: 26, lineHeight: 1.35, color: C.attenuato }}>
            Analisi di bilancio e allerta crisi per gli studi commercialisti.
          </span>
        </div>
        <span style={{ fontSize: 22, color: C.attenuato }}>finbeacon.eu</span>
      </div>

      <div
        style={{
          display: "flex",
          flex: 1,
          background: C.notte,
          borderRadius: 24,
          padding: 28,
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            background: C.superficieNotte,
            border: `1px solid ${C.bordoNotte}`,
            borderRadius: 16,
            padding: 28,
          }}
        >
          {/*
           * Il valore su una riga sua: accanto all'etichetta spaziata non ci
           * stava, e usciva dal bordo destro della scheda (visto sull'anteprima).
           */}
          <span style={{ fontSize: 15, letterSpacing: 2, color: C.attenuatoNotte }}>
            DSCR PROSPETTICO · 6 MESI
          </span>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: 10,
            }}
          >
            <span style={{ fontSize: 17, color: C.attenuatoNotte, paddingBottom: 6 }}>
              soglia {formatNumero(SOGLIA_DSCR6M, 2)} · art. 3 CCII
            </span>
            <span
              style={{ fontFamily: "PlexMono", fontSize: 60, lineHeight: 1, color: C.criticoTesto }}
            >
              {formatNumero(dscr6m, 2)}
            </span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={grafico()} width={352} height={126} alt="" style={{ marginTop: 22 }} />
          <div style={{ display: "flex", alignItems: "center", marginTop: 20, gap: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: C.criticoFondo,
                color: C.criticoTesto,
                borderRadius: 999,
                padding: "4px 14px",
                fontSize: 18,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: 999, background: C.criticoSegno }} />
              {giudizio.label}
            </div>
            <span style={{ fontSize: 17, color: C.inchiostroChiaro }}>
              Non copre: crisi probabile.
            </span>
          </div>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Plex", data: sans, weight: 400, style: "normal" },
        { name: "Plex", data: sansForte, weight: 600, style: "normal" },
        { name: "PlexMono", data: mono, weight: 600, style: "normal" },
      ],
    },
  );
}
