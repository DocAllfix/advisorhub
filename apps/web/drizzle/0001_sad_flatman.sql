CREATE TABLE "analisi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"esercizio_id" uuid,
	"versione" integer DEFAULT 1 NOT NULL,
	"input" jsonb NOT NULL,
	"output" jsonb NOT NULL,
	"score" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "analisi_score_valido" CHECK ("analisi"."score" between 0 and 100),
	CONSTRAINT "analisi_versione_positiva" CHECK ("analisi"."versione" >= 1)
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text,
	"azione" text NOT NULL,
	"entita" text NOT NULL,
	"entita_id" text,
	"dettagli" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clienti" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"ragione_sociale" text NOT NULL,
	"codice_ateco" text,
	"dimensione" text,
	"note" text,
	"archiviato_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clienti_dimensione_valida" CHECK ("clienti"."dimensione" is null or "clienti"."dimensione" in ('micro','piccola','media','grande'))
);
--> statement-breakpoint
CREATE TABLE "esercizi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"anno" integer NOT NULL,
	"val_prod" numeric(15, 2) NOT NULL,
	"fatturato" numeric(15, 2) NOT NULL,
	"ro" numeric(15, 2) NOT NULL,
	"cap_invest" numeric(15, 2) NOT NULL,
	"patr_netto" numeric(15, 2) NOT NULL,
	"utile_netto" numeric(15, 2) NOT NULL,
	"ebitda" numeric(15, 2) NOT NULL,
	"pfn" numeric(15, 2) NOT NULL,
	"servizio_debito" numeric(15, 2) NOT NULL,
	"flusso_cassa" numeric(15, 2) NOT NULL,
	"liquidita_iniziale" numeric(15, 2),
	"entrate_6m" numeric(15, 2),
	"uscite_6m" numeric(15, 2),
	"debito_6m" numeric(15, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "esercizi_anno_valido" CHECK ("esercizi"."anno" between 1900 and 2100),
	CONSTRAINT "esercizi_non_negativi" CHECK ("esercizi"."val_prod" >= 0 and "esercizi"."fatturato" >= 0 and "esercizi"."cap_invest" >= 0 and "esercizi"."servizio_debito" >= 0),
	CONSTRAINT "esercizi_previsionali_non_negativi" CHECK (("esercizi"."liquidita_iniziale" is null or "esercizi"."liquidita_iniziale" >= 0)
        and ("esercizi"."entrate_6m" is null or "esercizi"."entrate_6m" >= 0)
        and ("esercizi"."uscite_6m" is null or "esercizi"."uscite_6m" >= 0)
        and ("esercizi"."debito_6m" is null or "esercizi"."debito_6m" >= 0))
);
--> statement-breakpoint
CREATE TABLE "report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"analisi_id" uuid,
	"titolo" text NOT NULL,
	"storage_path" text,
	"creato_da_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analisi" ADD CONSTRAINT "analisi_cliente_id_clienti_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clienti"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analisi" ADD CONSTRAINT "analisi_esercizio_id_esercizi_id_fk" FOREIGN KEY ("esercizio_id") REFERENCES "public"."esercizi"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clienti" ADD CONSTRAINT "clienti_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "esercizi" ADD CONSTRAINT "esercizi_cliente_id_clienti_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clienti"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_cliente_id_clienti_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clienti"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_analisi_id_analisi_id_fk" FOREIGN KEY ("analisi_id") REFERENCES "public"."analisi"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_creato_da_user_id_user_id_fk" FOREIGN KEY ("creato_da_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analisi_cliente_idx" ON "analisi" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX "analisi_esercizio_idx" ON "analisi" USING btree ("esercizio_id");--> statement-breakpoint
CREATE INDEX "audit_org_created_idx" ON "audit_log" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "clienti_organization_idx" ON "clienti" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "esercizi_cliente_anno_uidx" ON "esercizi" USING btree ("cliente_id","anno");--> statement-breakpoint
CREATE INDEX "esercizi_cliente_idx" ON "esercizi" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX "report_cliente_idx" ON "report" USING btree ("cliente_id");