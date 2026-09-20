import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { organization, user } from "./auth-schema";

/**
 * Schema di dominio advisorhub (Fase 4). L'autenticazione (organization, user,
 * member, ...) vive in auth-schema.ts; qui solo le entità di business, tutte
 * riconducibili a uno studio (organization) per il tenant scoping.
 *
 * Importi monetari: numeric(15,2), mode number (range ampiamente entro il
 * sicuro dei double per valori di bilancio PMI). Il segno è vincolato solo
 * dove è un invariante economico reale (una quantità che non può essere
 * negativa), non sui massimi degli slider del prototipo, che sono di UI.
 */
const euro = (nome: string) => numeric(nome, { precision: 15, scale: 2, mode: "number" });

/** Clienti (aziende analizzate) di uno studio. */
export const clienti = pgTable(
  "clienti",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    ragioneSociale: text("ragione_sociale").notNull(),
    codiceAteco: text("codice_ateco"),
    // micro | piccola | media | grande — usato per benchmark contestuali (futuro)
    dimensione: text("dimensione"),
    note: text("note"),
    // Soft-delete: valorizzato = archiviato (gestito in Fase 6)
    archiviatoAt: timestamp("archiviato_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("clienti_organization_idx").on(t.organizationId),
    check(
      "clienti_dimensione_valida",
      sql`${t.dimensione} is null or ${t.dimensione} in ('micro','piccola','media','grande')`,
    ),
  ],
);

/**
 * Esercizi: i dati di bilancio di un cliente per un anno. Le 10 grandezze
 * storiche + 4 grandezze previsionali 6M (opzionali, per il DSCR prospettico).
 */
export const esercizi = pgTable(
  "esercizi",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => clienti.id, { onDelete: "cascade" }),
    anno: integer("anno").notNull(),

    // 10 grandezze storiche
    valProd: euro("val_prod").notNull(),
    fatturato: euro("fatturato").notNull(),
    ro: euro("ro").notNull(),
    capInvest: euro("cap_invest").notNull(),
    patrNetto: euro("patr_netto").notNull(),
    utileNetto: euro("utile_netto").notNull(),
    ebitda: euro("ebitda").notNull(),
    pfn: euro("pfn").notNull(),
    servizioDebito: euro("servizio_debito").notNull(),
    flussoCassa: euro("flusso_cassa").notNull(),

    // 4 grandezze previsionali 6M (nullable: il DSCR prospettico è opzionale)
    liquiditaIniziale: euro("liquidita_iniziale"),
    entrate6m: euro("entrate_6m"),
    uscite6m: euro("uscite_6m"),
    debito6m: euro("debito_6m"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    // Un solo esercizio per anno per cliente
    uniqueIndex("esercizi_cliente_anno_uidx").on(t.clienteId, t.anno),
    index("esercizi_cliente_idx").on(t.clienteId),
    check("esercizi_anno_valido", sql`${t.anno} between 1900 and 2100`),
    // Invarianti economici: quantità non negative
    check(
      "esercizi_non_negativi",
      sql`${t.valProd} >= 0 and ${t.fatturato} >= 0 and ${t.capInvest} >= 0 and ${t.servizioDebito} >= 0`,
    ),
    check(
      "esercizi_previsionali_non_negativi",
      sql`(${t.liquiditaIniziale} is null or ${t.liquiditaIniziale} >= 0)
        and (${t.entrate6m} is null or ${t.entrate6m} >= 0)
        and (${t.uscite6m} is null or ${t.uscite6m} >= 0)
        and (${t.debito6m} is null or ${t.debito6m} >= 0)`,
    ),
  ],
);

/**
 * Analisi: snapshot versionato del calcolo del motore per un esercizio
 * (o una simulazione what-if, con esercizioId null). input e output sono i
 * JSON di @advisorhub/engine; score denormalizzato per liste/ordinamenti.
 */
export const analisi = pgTable(
  "analisi",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => clienti.id, { onDelete: "cascade" }),
    esercizioId: uuid("esercizio_id").references(() => esercizi.id, { onDelete: "set null" }),
    versione: integer("versione").notNull().default(1),
    input: jsonb("input").notNull(),
    output: jsonb("output").notNull(),
    score: integer("score").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("analisi_cliente_idx").on(t.clienteId),
    index("analisi_esercizio_idx").on(t.esercizioId),
    check("analisi_score_valido", sql`${t.score} between 0 and 100`),
    check("analisi_versione_positiva", sql`${t.versione} >= 1`),
  ],
);

/** Report PDF generati per un cliente (metadati; il file vive in Storage, Fase 9). */
export const report = pgTable(
  "report",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => clienti.id, { onDelete: "cascade" }),
    analisiId: uuid("analisi_id").references(() => analisi.id, { onDelete: "set null" }),
    titolo: text("titolo").notNull(),
    storagePath: text("storage_path"),
    creatoDaUserId: text("creato_da_user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("report_cliente_idx").on(t.clienteId)],
);

/** Registro delle mutazioni, per studio. */
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    azione: text("azione").notNull(),
    entita: text("entita").notNull(),
    entitaId: text("entita_id"),
    dettagli: jsonb("dettagli"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("audit_org_created_idx").on(t.organizationId, t.createdAt)],
);

/**
 * Scadenze / adempimenti dello studio. Possono essere legate a un cliente
 * (es. deposito bilancio Rossi Spa) o generali dello studio (clienteId null).
 */
export const scadenze = pgTable(
  "scadenze",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    clienteId: uuid("cliente_id").references(() => clienti.id, { onDelete: "cascade" }),
    titolo: text("titolo").notNull(),
    data: date("data", { mode: "string" }).notNull(),
    // bilancio | iva | imposte | contributi | adempimenti | altro
    categoria: text("categoria").notNull().default("adempimenti"),
    note: text("note"),
    completataAt: timestamp("completata_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("scadenze_org_data_idx").on(t.organizationId, t.data),
    index("scadenze_cliente_idx").on(t.clienteId),
    check(
      "scadenze_categoria_valida",
      sql`${t.categoria} in ('bilancio','iva','imposte','contributi','adempimenti','altro')`,
    ),
  ],
);

/**
 * Coda di posta in uscita.
 *
 * Le email non partono dentro la richiesta dell'utente: vengono accodate qui
 * nella stessa transazione del dominio e spedite da un worker separato. Se il
 * relay SMTP è irraggiungibile, la richiesta dell'utente riesce comunque e il
 * messaggio non si perde — senza questa coda, un timeout durante un recupero
 * password lascerebbe la persona chiusa fuori in modo definitivo.
 *
 * organizationId è nullable: il recupero password precede la risoluzione dello
 * studio (si conosce solo l'email).
 */
export const mailOutbox = pgTable(
  "mail_outbox",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id").references(() => organization.id, {
      onDelete: "cascade",
    }),
    destinatario: text("destinatario").notNull(),
    oggetto: text("oggetto").notNull(),
    corpoTesto: text("corpo_testo").notNull(),
    corpoHtml: text("corpo_html"),
    tentativi: integer("tentativi").default(0).notNull(),
    ultimoErrore: text("ultimo_errore"),
    inviataAt: timestamp("inviata_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    // Indice parziale: il worker interroga solo le non inviate, che sono poche
    // anche quando la tabella è cresciuta.
    index("mail_outbox_da_inviare_idx")
      .on(t.createdAt)
      .where(sql`${t.inviataAt} is null`),
    check("mail_outbox_tentativi_non_negativi", sql`${t.tentativi} >= 0`),
  ],
);
