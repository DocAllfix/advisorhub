import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// .env.local PRIMA di .env: dotenv non sovrascrive le chiavi gia' presenti,
// quindi vince il primo file caricato. E' l'opposto di `node --env-file`, dove
// vince l'ultimo. Sbagliare l'ordine qui significa migrare il database di
// produzione credendo di lavorare in locale.
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: ["./src/lib/auth-schema.ts", "./src/lib/schema-dominio.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Session pooler: le migration non passano dal transaction pooler
    url: process.env.DIRECT_URL!,
  },
  strict: true,
  verbose: true,
});
