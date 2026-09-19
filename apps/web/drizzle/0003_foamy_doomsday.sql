CREATE TABLE "mail_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text,
	"destinatario" text NOT NULL,
	"oggetto" text NOT NULL,
	"corpo_testo" text NOT NULL,
	"corpo_html" text,
	"tentativi" integer DEFAULT 0 NOT NULL,
	"ultimo_errore" text,
	"inviata_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mail_outbox_tentativi_non_negativi" CHECK ("mail_outbox"."tentativi" >= 0)
);
--> statement-breakpoint
ALTER TABLE "mail_outbox" ADD CONSTRAINT "mail_outbox_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mail_outbox_da_inviare_idx" ON "mail_outbox" USING btree ("created_at") WHERE "mail_outbox"."inviata_at" is null;