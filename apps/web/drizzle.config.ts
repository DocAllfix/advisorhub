import "dotenv/config";
import { defineConfig } from "drizzle-kit";

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
