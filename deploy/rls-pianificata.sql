-- ═══════════════════════════════════════════════════════════════════════════
-- PREPARATA E NON APPLICATA — 18 settembre 2026
--
-- Questo file è scritto, provato su un database reale e funzionante: le sei
-- politiche si creano, il ruolo applicativo è non-superuser, e con RLS attiva
-- un'applicazione senza contesto vede correttamente ZERO righe.
--
-- NON è nel giornale delle migrazioni, e va applicato solo insieme al lavoro
-- descritto qui sotto. Applicarlo da solo rende l'applicazione inutilizzabile.
--
-- ── Cosa manca ─────────────────────────────────────────────────────────────
--
-- Le politiche leggono il tenant da `app.organization_id`, una variabile di
-- SESSIONE. Su un pool di connessioni l'unico modo sicuro di impostarla è
-- `set_config(..., true)` dentro una transazione, quindi ogni funzione di
-- lettura e scrittura (circa quindici, in clienti/, esercizi/, scadenze/ e
-- analisi/panoramica.ts) va avvolta in `db.transaction`. Senza, ogni query
-- restituisce zero righe.
--
-- ── Perché non è stato fatto subito ────────────────────────────────────────
--
-- Due fatti verificati che ne abbassano il valore NEL MODELLO DI DEPLOY ATTUALE:
--
-- 1. UN'ISTANZA OSPITA UN SOLO STUDIO. `organizationLimit: 1`, registrazione
--    pubblica chiusa, e `crea-titolare.js` ne crea esattamente uno. Su quel
--    database non esistono due organizzazioni fra cui isolare: la politica
--    difenderebbe da uno scenario che non può darsi.
--
-- 2. LA RLS QUI NON PROTEGGE DA UNA CREDENZIALE TRAPELATA. Chi possiede la
--    stringa di connessione imposta la variabile di sessione da sé. È una
--    difesa contro una query che dimentica il filtro, non contro un furto di
--    credenziali — l'audit iniziale affermava entrambe le cose, e la seconda
--    è sbagliata.
--
-- 3. Il rischio che resta — una query futura senza filtro — è oggi coperto dal
--    test end-to-end di isolamento fra studi (`e2e/isolamento.spec.ts`), che
--    non esisteva quando l'audit è stato scritto.
--
-- ── Quando applicarla ──────────────────────────────────────────────────────
--
-- • Sul database Supabase attuale, che ospita PIÙ studi insieme: lì il valore è
--   pieno e immediato.
-- • Se un giorno un'istanza ospitasse più di uno studio.
-- • Come irrigidimento in profondità, quando si vuole che la regola 3 del
--   CLAUDE.md sia strutturale e non affidata alla disciplina di chi scrive.
--
-- Ordine di applicazione: PRIMA il wrapper transazionale su tutte le query,
-- POI questo file. Mai il contrario.
-- ═══════════════════════════════════════════════════════════════════════════

-- Row Level Security: difesa in profondità sul tenant scoping.
--
-- COSA PROTEGGE, e cosa no. Va detto con precisione, perché è facile
-- sopravvalutarla: la politica legge il tenant da una variabile di sessione che
-- l'applicazione imposta. Chi possiede la stringa di connessione può impostarla
-- da sé, quindi questa NON è una difesa contro una credenziale trapelata.
--
-- È una difesa contro UNA QUERY CHE DIMENTICA IL FILTRO. Oggi tutte e sole le
-- query partono da requireStudio() e filtrano per organizationId; domani una
-- query nuova potrebbe non farlo, e senza questa rete il difetto sarebbe
-- silenzioso e trasversale agli studi. È la regola 3 del CLAUDE.md di progetto
-- resa strutturale invece che affidata alla disciplina.
--
-- DUE RUOLI:
--   finbeacon      proprietario. Migrazioni, seed, backup. NON soggetto a RLS
--                   (un proprietario la scavalca, salvo FORCE che qui non si usa).
--   finbeacon_app  applicazione. Nessun DDL, soggetto alle politiche.
--
-- DATABASE_URL usa finbeacon_app; DIRECT_URL resta sul proprietario.

-- Il ruolo esiste già su un'istanza riavviata: la creazione è idempotente.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'finbeacon_app') THEN
    CREATE ROLE finbeacon_app LOGIN;
  END IF;
END
$$;

-- Privilegi minimi: leggere e scrivere i dati, niente struttura.
GRANT USAGE ON SCHEMA public TO finbeacon_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO finbeacon_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO finbeacon_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO finbeacon_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO finbeacon_app;

-- Il tenant corrente. `true` come secondo argomento: se la variabile non è
-- impostata restituisce NULL invece di errore, e una politica che confronta con
-- NULL non fa passare nulla. Il comportamento predefinito è quindi «nessuna
-- riga», non «tutte».
CREATE OR REPLACE FUNCTION app_studio_corrente() RETURNS text
  LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.organization_id', true), '')
$$;

-- ── Tabelle con organization_id proprio ────────────────────────────────────
ALTER TABLE clienti   ENABLE ROW LEVEL SECURITY;
ALTER TABLE scadenze  ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY clienti_per_studio ON clienti
  USING (organization_id = app_studio_corrente())
  WITH CHECK (organization_id = app_studio_corrente());

CREATE POLICY scadenze_per_studio ON scadenze
  USING (organization_id = app_studio_corrente())
  WITH CHECK (organization_id = app_studio_corrente());

CREATE POLICY audit_per_studio ON audit_log
  USING (organization_id = app_studio_corrente())
  WITH CHECK (organization_id = app_studio_corrente());

-- ── Tabelle che ereditano il tenant da clienti ─────────────────────────────
-- esercizi, analisi e report non hanno organization_id: lo raggiungono con un
-- join su clienti. La politica usa quindi una sottoquery. Costa un indice già
-- esistente (la chiave primaria di clienti) e vale la pena: denormalizzare la
-- colonna avrebbe significato tenerla allineata a mano per sempre.
ALTER TABLE esercizi ENABLE ROW LEVEL SECURITY;
ALTER TABLE analisi  ENABLE ROW LEVEL SECURITY;
ALTER TABLE report   ENABLE ROW LEVEL SECURITY;

CREATE POLICY esercizi_per_studio ON esercizi
  USING (EXISTS (SELECT 1 FROM clienti c
                 WHERE c.id = esercizi.cliente_id
                   AND c.organization_id = app_studio_corrente()))
  WITH CHECK (EXISTS (SELECT 1 FROM clienti c
                      WHERE c.id = esercizi.cliente_id
                        AND c.organization_id = app_studio_corrente()));

CREATE POLICY analisi_per_studio ON analisi
  USING (EXISTS (SELECT 1 FROM clienti c
                 WHERE c.id = analisi.cliente_id
                   AND c.organization_id = app_studio_corrente()))
  WITH CHECK (EXISTS (SELECT 1 FROM clienti c
                      WHERE c.id = analisi.cliente_id
                        AND c.organization_id = app_studio_corrente()));

CREATE POLICY report_per_studio ON report
  USING (EXISTS (SELECT 1 FROM clienti c
                 WHERE c.id = report.cliente_id
                   AND c.organization_id = app_studio_corrente()))
  WITH CHECK (EXISTS (SELECT 1 FROM clienti c
                      WHERE c.id = report.cliente_id
                        AND c.organization_id = app_studio_corrente()));

-- ── Tabelle di autenticazione: NIENTE RLS ──────────────────────────────────
-- user, session, account, verification, organization, member e invitation le
-- gestisce Better Auth, che non conosce la variabile di sessione. Metterci una
-- politica significherebbe rompere l'accesso. Il loro tenant è implicito
-- nell'identità di chi sta chiedendo, e la libreria lo verifica per conto suo.
