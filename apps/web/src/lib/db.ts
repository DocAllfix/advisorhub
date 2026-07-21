import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as authSchema from "./auth-schema";

/**
 * Connessione runtime via transaction pooler Supabase (porta 6543).
 * Le migration usano DIRECT_URL (session pooler) via drizzle-kit.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

export const schema = { ...authSchema };

export const db = drizzle(pool, { schema });
