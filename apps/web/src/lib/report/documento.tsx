import { formatEuro, formatNumero, type Analisi, type DatiBilancio } from "@advisorhub/engine";
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  type DocumentProps,
} from "@react-pdf/renderer";
import path from "node:path";
import * as React from "react";

import { INDICATORI, type ChiaveIndicatore } from "@/lib/analisi/indicatori-meta";
import { sinteticoDaScore } from "@/lib/analisi/sintesi-breve";

import { cartellaFont } from "./percorso-font";
import { quota, SCALA_DSCR_6M, SCALE, valoreGrezzo, type ScalaIndicatore } from "./soglie";
import { C, graficaTono, testoTono, type Tono } from "./tema";

// I font sono incorporati nel PDF: senza, il documento userebbe Helvetica e
// perderebbe sia l'identità sia l'incolonnamento dei numeri.
const dir = cartellaFont();
Font.register({
  family: "Plex",
  fonts: [
    { src: path.join(dir, "IBMPlexSans-Regular.ttf"), fontWeight: 400 },
    { src: path.join(dir, "IBMPlexSans-Medium.ttf"), fontWeight: 500 },
    { src: path.join(dir, "IBMPlexSans-SemiBold.ttf"), fontWeight: 600 },
  ],
});
Font.register({
  family: "PlexMono",
  fonts: [
    { src: path.join(dir, "IBMPlexMono-Regular.ttf"), fontWeight: 400 },
    { src: path.join(dir, "IBMPlexMono-SemiBold.ttf"), fontWeight: 600 },
  ],
});
Font.register({
  family: "PlexSerif",
  fonts: [{ src: path.join(dir, "IBMPlexSerif-SemiBold.ttf"), fontWeight: 600 }],
});
// Senza questo react-pdf spezza le parole con trattini arbitrari
Font.registerHyphenationCallback((parola) => [parola]);

const s = StyleSheet.create({
  pagina: {
    backgroundColor: C.bg,
    color: C.fg,
    fontFamily: "Plex",
    fontSize: 9,
    paddingTop: 38,
    paddingHorizontal: 42,
    paddingBottom: 46,
  },
  testata: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 7,
    borderBottomWidth: 0.7,
    borderBottomColor: C.border,
  },
  studio: { flexDirection: "row", alignItems: "center", gap: 6 },
  logo: {
    width: 15,
    height: 15,
    borderRadius: 4,
    backgroundColor: C.primarySoft,
    color: C.primary,
    fontSize: 8,
    fontWeight: 600,
    textAlign: "center",
    paddingTop: 3.2,
  },
  studioNome: { fontSize: 9, fontWeight: 600 },
  doc: { fontSize: 7, letterSpacing: 1.1, color: C.fg2 },

  occhiello: { fontSize: 7, letterSpacing: 1.3, color: C.fg2 },
  h1: { fontFamily: "PlexSerif", fontWeight: 600, fontSize: 22, marginTop: 5, letterSpacing: -0.3 },
  meta: { fontFamily: "PlexMono", fontSize: 8, color: C.fg2, marginTop: 6 },

  verdetto: {
    flexDirection: "row",
    gap: 20,
    marginTop: 14,
    paddingTop: 12,
    paddingBottom: 13,
    borderTopWidth: 0.7,
    borderTopColor: C.fg,
    borderBottomWidth: 0.5,
    borderBottomColor: C.hairline,
  },
  punteggio: { width: 86 },
  score: { fontFamily: "PlexMono", fontWeight: 600, fontSize: 42, letterSpacing: -1 },
  su100: { fontSize: 7, letterSpacing: 1.2, color: C.fg2, marginTop: 4 },
  scalaBase: { height: 3, backgroundColor: C.muted, marginTop: 8, borderRadius: 1.5 },
  scalaQuota: { height: 3, borderRadius: 1.5 },
  h2: { fontFamily: "PlexSerif", fontWeight: 600, fontSize: 15 },
  desc: { fontSize: 9.5, lineHeight: 1.55, color: C.fg2, marginTop: 5 },
  azione: { backgroundColor: C.card, borderRadius: 5, padding: 9, marginTop: 10 },
  azioneLab: { fontSize: 6.5, letterSpacing: 1.2, color: C.fg2 },
  azioneTesto: { fontSize: 9.5, fontWeight: 500, marginTop: 3 },

  sezione: { marginTop: 15 },
  h3: {
    fontSize: 7,
    letterSpacing: 1.3,
    color: C.fg2,
    paddingBottom: 5,
    borderBottomWidth: 0.7,
    borderBottomColor: C.fg,
  },

  riga: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: C.hairline,
  },
  nome: { width: 118, fontSize: 9, fontWeight: 600 },
  nomeSub: { fontSize: 7, fontWeight: 400, color: C.fg2, marginTop: 1.5 },
  valore: { width: 66, fontFamily: "PlexMono", fontWeight: 600, fontSize: 13, textAlign: "right" },
  unita: { fontSize: 7.5, fontWeight: 400, color: C.fg2 },
  bulletBox: { flex: 1, height: 20, position: "relative" },
  track: {
    position: "absolute",
    top: 4,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: C.muted,
    borderRadius: 1.5,
  },
  banda: { position: "absolute", top: 0, height: 6, backgroundColor: C.bandaSottoSoglia },
  barra: { position: "absolute", top: 5.5, left: 0, height: 3, borderRadius: 1.5 },
  tacca: { position: "absolute", top: 1, width: 1.2, height: 12, backgroundColor: C.fg },
  etichettaSoglia: { position: "absolute", top: 12, fontSize: 6, color: C.fg2 },
  giudizio: { width: 74, fontSize: 8, fontWeight: 600, textAlign: "right" },
  legenda: { fontSize: 6.5, color: C.fg2, marginTop: 7 },

  dscr: {
    marginTop: 8,
    borderWidth: 0.8,
    borderColor: C.primary,
    borderRadius: 6,
    padding: 11,
    backgroundColor: C.card,
  },
  dscrTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  dscrBig: { fontFamily: "PlexMono", fontWeight: 600, fontSize: 26, letterSpacing: -0.6 },
  formula: { fontFamily: "PlexMono", fontSize: 7, color: C.fg2, marginTop: 10 },

  due: { flexDirection: "row", gap: 24, marginTop: 9 },
  col: { flex: 1 },
  voce: {
    flexDirection: "row",
    gap: 7,
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: C.hairline,
  },
  seg: { width: 2, height: 9, borderRadius: 1, marginTop: 1.5 },
  voceTesto: { flex: 1, fontSize: 8.5, lineHeight: 1.45 },

  tRiga: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: C.hairline,
  },
  tEtichetta: { fontSize: 8.5, color: C.fg2 },
  tValore: { fontFamily: "PlexMono", fontWeight: 500, fontSize: 8.5 },

  prosa: { fontSize: 8.5, lineHeight: 1.6, color: C.fg2, marginTop: 8 },
  soglie: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  sogliaVoce: { fontSize: 6.5, color: C.fg2 },
  nota: { fontSize: 6.8, lineHeight: 1.5, color: C.fg2, marginTop: 9 },
  piede: {
    position: "absolute",
    bottom: 24,
    left: 42,
    right: 42,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: C.hairline,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  piedeTesto: { fontSize: 6.5, color: C.fg2 },
});

/** Barra a proiettile: valore, soglia e area sotto soglia in una riga sola. */
function Bullet({
  valore,
  scala,
  tono,
  etichettaSopra = false,
}: {
  valore: number | null;
  scala: ScalaIndicatore;
  tono: Tono;
  /** Nel riquadro DSCR sotto la barra c'è la formula: l'etichetta va sopra. */
  etichettaSopra?: boolean;
}) {
  const pSoglia = quota(scala.soglia, scala.max);
  const pValore = valore === null ? 0 : quota(valore, scala.max);
  // L'etichetta si stacca dal bordo per non uscire dalla barra
  const sinistra = Math.min(Math.max(pSoglia, 6), 74);
  return (
    <View style={[s.bulletBox, etichettaSopra ? { height: 24, paddingTop: 8 } : {}]}>
      <View style={[s.track, etichettaSopra ? { top: 12 } : {}]} />
      <View
        style={[s.banda, { left: 0, width: `${pSoglia}%` }, etichettaSopra ? { top: 12 } : {}]}
      />
      {valore !== null && (
        <View
          style={[
            s.barra,
            { width: `${pValore}%`, backgroundColor: graficaTono[tono] },
            etichettaSopra ? { top: 13.5 } : {},
          ]}
        />
      )}
      <View style={[s.tacca, { left: `${pSoglia}%` }, etichettaSopra ? { top: 9 } : {}]} />
      <Text style={[s.etichettaSoglia, { left: `${sinistra}%` }, etichettaSopra ? { top: 0 } : {}]}>
        {scala.etichetta}
      </Text>
    </View>
  );
}

function RigaIndicatore({
  chiave,
  analisi,
  dati,
}: {
  chiave: ChiaveIndicatore;
  analisi: Analisi;
  dati: DatiBilancio;
}) {
  const meta = INDICATORI.find((m) => m.chiave === chiave)!;
  const scala = SCALE[chiave];
  const g = analisi.giudizi[chiave];
  const grezzo = valoreGrezzo(chiave, analisi.indicatori);
  const testo = meta.valore(analisi, dati);
  // "2,18 anni": l'unità resta piccola e non manda a capo la cifra
  const [cifra, unita] = testo.includes(" ") ? testo.split(" ") : [testo, null];

  return (
    <View style={s.riga} wrap={false}>
      <View style={s.nome}>
        <Text>{meta.titolo}</Text>
        <Text style={s.nomeSub}>{scala.descrizione}</Text>
      </View>
      <Text style={s.valore}>
        {cifra}
        {unita ? <Text style={s.unita}> {unita}</Text> : null}
      </Text>
      <Bullet valore={grezzo} scala={scala} tono={g.tone} />
      <Text style={[s.giudizio, { color: testoTono[g.tone] }]}>{g.label}</Text>
    </View>
  );
}

function Testata({ studio, destra }: { studio: string; destra: string }) {
  return (
    <View style={s.testata} fixed>
      <View style={s.studio}>
        <Text style={s.logo}>{studio.slice(0, 1).toUpperCase()}</Text>
        <Text style={s.studioNome}>{studio}</Text>
      </View>
      <Text style={s.doc}>{destra.toUpperCase()}</Text>
    </View>
  );
}

function Piede({ testo }: { testo: string }) {
  return (
    <View style={s.piede} fixed>
      <Text style={s.piedeTesto}>{testo}</Text>
      <Text
        style={s.piedeTesto}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

export interface DatiReport {
  studio: string;
  ragioneSociale: string;
  anno: number;
  dimensione: string | null;
  codiceAteco: string | null;
  dati: DatiBilancio;
  analisi: Analisi;
  dataOggi: string;
}

const SOGLIE_LEGENDA = [
  "ROS > 10% ottimo",
  "Turnover > 1 ottimo",
  "ROI > 8% ottimo",
  "ROE 5-15% buono",
  "GI < 2 anni ottimo",
  "DSCR > 1,5 ottimo",
  "DSCR 6M > 1,1 (CNDCEC)",
];

export function DocumentoReport({ d }: { d: DatiReport }): React.ReactElement<DocumentProps> {
  const a = d.analisi;
  const sint = sinteticoDaScore(a.score);
  const identita = [
    `Esercizio ${d.anno}`,
    // "Media" da solo suona monco in un documento destinato al cliente
    d.dimensione ? `${d.dimensione} impresa` : null,
    d.codiceAteco ? `ATECO ${d.codiceAteco}` : null,
    `elaborato il ${d.dataOggi}`,
  ]
    .filter(Boolean)
    .join("  ·  ");
  const piede = `${d.studio} · ${d.ragioneSociale} · Esercizio ${d.anno}`;
  const dscrPro = a.indicatori.dscrProspettico;
  const gPro = a.giudizi.dscrPro;

  const grandezze: [string, number][][] = [
    [
      ["Valore della produzione", d.dati.valProd],
      ["Fatturato", d.dati.fatturato],
      ["Reddito operativo", d.dati.ro],
      ["EBITDA / MOL", d.dati.ebitda],
      ["Utile netto", d.dati.utileNetto],
    ],
    [
      ["Capitale investito", d.dati.capInvest],
      ["Patrimonio netto", d.dati.patrNetto],
      ["Posizione finanziaria netta", d.dati.pfn],
      ["Servizio del debito", d.dati.servizioDebito],
      ["Flusso di cassa operativo", d.dati.flussoCassa],
    ],
  ];

  return (
    <Document
      title={`Analisi ${d.ragioneSociale} ${d.anno}`}
      author={d.studio}
      subject="Analisi economico-finanziaria"
      creator="advisorhub"
    >
      {/* ---------- Pagina 1 ---------- */}
      <Page size="A4" style={s.pagina}>
        <Testata studio={d.studio} destra="Analisi economico-finanziaria" />

        <View style={{ marginTop: 18 }}>
          <Text style={s.occhiello}>REPORT PER IL CLIENTE</Text>
          <Text style={s.h1}>{d.ragioneSociale}</Text>
          <Text style={s.meta}>{identita}</Text>
        </View>

        <View style={s.verdetto}>
          <View style={s.punteggio}>
            <Text style={[s.score, { color: testoTono[sint.tone] }]}>{a.score}</Text>
            <Text style={s.su100}>SU 100</Text>
            <View style={s.scalaBase}>
              <View
                style={[
                  s.scalaQuota,
                  { width: `${a.score}%`, backgroundColor: graficaTono[sint.tone] },
                ]}
              />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.h2}>{a.sintesi.titolo}</Text>
            <Text style={s.desc}>{a.sintesi.descrizione}</Text>
            <View style={s.azione}>
              <Text style={s.azioneLab}>AZIONE PRIORITARIA</Text>
              <Text style={s.azioneTesto}>{a.azionePrioritaria}</Text>
            </View>
          </View>
        </View>

        <View style={s.sezione}>
          <Text style={s.h3}>INDICATORI E SOGLIE DI RIFERIMENTO</Text>
          {INDICATORI.map((m) => (
            <RigaIndicatore key={m.chiave} chiave={m.chiave} analisi={a} dati={d.dati} />
          ))}
          <Text style={s.legenda}>
            La barra è il valore dell&apos;esercizio, il trattino verticale la soglia di
            riferimento, la fascia scura l&apos;area sotto soglia.
          </Text>
        </View>

        <View style={s.sezione} wrap={false}>
          <Text style={s.h3}>CONTINUITÀ AZIENDALE · DSCR PROSPETTICO A 6 MESI</Text>
          <View style={s.dscr}>
            <View style={s.dscrTop}>
              <View style={{ flex: 1 }}>
                <Text style={[s.h2, { fontSize: 12 }]}>Copertura prospettica del debito</Text>
                <Text style={[s.nomeSub, { marginTop: 3 }]}>
                  CNDCEC, art. 3 Codice della crisi d&apos;impresa · soglia 1,10
                </Text>
              </View>
              <Text style={[s.dscrBig, { color: testoTono[gPro.tone] }]}>
                {dscrPro === null ? "n.d." : dscrPro >= 99 ? "∞" : formatNumero(dscrPro, 2)}
              </Text>
            </View>
            {dscrPro !== null && dscrPro < 99 && (
              <View style={{ marginTop: 12, marginBottom: 6 }}>
                <Bullet valore={dscrPro} scala={SCALA_DSCR_6M} tono={gPro.tone} etichettaSopra />
              </View>
            )}
            <Text style={s.formula}>
              (Liquidità iniziale + Entrate 6M − Uscite 6M) / Debito da servire 6M
              {a.indicatori.disponibile6m !== null
                ? `  ·  disponibilità ${formatEuro(a.indicatori.disponibile6m)}`
                : ""}
            </Text>
            <Text style={[s.prosa, { marginTop: 8 }]}>
              {gPro.testo} <Text style={{ color: C.fg }}>Cosa puoi fare:</Text> {gPro.azione}
            </Text>
          </View>
        </View>

        <Piede testo={piede} />
      </Page>

      {/* ---------- Pagina 2 ---------- */}
      <Page size="A4" style={s.pagina}>
        <Testata studio={d.studio} destra={`${d.ragioneSociale} · Esercizio ${d.anno}`} />

        <View style={s.sezione}>
          <Text style={s.h3}>LETTURA SINTETICA</Text>
          <View style={s.due}>
            <View style={s.col}>
              {a.puntiForza.map((v, i) => (
                <View key={i} style={s.voce}>
                  <View style={[s.seg, { backgroundColor: C.okG }]} />
                  <Text style={s.voceTesto}>{v.txt}</Text>
                </View>
              ))}
              <Text style={s.legenda}>Punti di forza</Text>
            </View>
            <View style={s.col}>
              {a.areeAttenzione.map((v, i) => (
                <View key={i} style={s.voce}>
                  <View style={[s.seg, { backgroundColor: v.k === "OK" ? C.muted : C.warnG }]} />
                  <Text style={s.voceTesto}>{v.txt}</Text>
                </View>
              ))}
              <Text style={s.legenda}>Aree di attenzione</Text>
            </View>
          </View>
        </View>

        <View style={s.sezione}>
          <Text style={s.h3}>ANALISI ESTESA</Text>
          <Text style={s.prosa}>{a.analisiEstesa}</Text>
        </View>

        <View style={s.sezione}>
          <Text style={s.h3}>DATI DI BILANCIO UTILIZZATI</Text>
          <View style={s.due}>
            {grandezze.map((colonna, i) => (
              <View key={i} style={s.col}>
                {colonna.map(([etichetta, valore]) => (
                  <View key={etichetta} style={s.tRiga}>
                    <Text style={s.tEtichetta}>{etichetta}</Text>
                    <Text style={s.tValore}>{formatEuro(valore)}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
          <View style={s.soglie}>
            {SOGLIE_LEGENDA.map((t) => (
              <Text key={t} style={s.sogliaVoce}>
                {t}
              </Text>
            ))}
          </View>
          <Text style={s.nota}>
            <Text style={{ color: C.fg, fontWeight: 600 }}>Nota di metodo. </Text>
            Il Turnover è calcolato sul fatturato mentre il ROS sul valore della produzione, quindi
            ROI ≈ ROS × Turnover è un&apos;approssimazione e non un&apos;identità. Il GI è espresso
            in anni. Il DSCR prospettico 6M non concorre al punteggio di sintesi: è una lettura di
            continuità a sé. Analisi gestionale elaborata su dati forniti dal cliente, non
            costituisce giudizio legale o fiscale.
          </Text>
        </View>

        <Piede testo={piede} />
      </Page>
    </Document>
  );
}
