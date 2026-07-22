CREATE TABLE "scadenze" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"cliente_id" uuid,
	"titolo" text NOT NULL,
	"data" date NOT NULL,
	"categoria" text DEFAULT 'adempimenti' NOT NULL,
	"note" text,
	"completata_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scadenze_categoria_valida" CHECK ("scadenze"."categoria" in ('bilancio','iva','imposte','contributi','adempimenti','altro'))
);
--> statement-breakpoint
ALTER TABLE "scadenze" ADD CONSTRAINT "scadenze_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scadenze" ADD CONSTRAINT "scadenze_cliente_id_clienti_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clienti"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scadenze_org_data_idx" ON "scadenze" USING btree ("organization_id","data");--> statement-breakpoint
CREATE INDEX "scadenze_cliente_idx" ON "scadenze" USING btree ("cliente_id");