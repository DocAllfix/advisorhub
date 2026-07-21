import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { eq } from "drizzle-orm";

import { db, schema } from "./db";

/**
 * Autenticazione multi-studio: studio = organization (plugin Better Auth),
 * ruoli nativi owner/admin/member. Email+password per l'MVP; il magic link
 * si abilita quando sarà configurato un provider email (Fase 10).
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
  },
  plugins: [
    organization({
      // Un utente = un solo studio nell'MVP (il titolare crea lo studio al signup)
      organizationLimit: 1,
      sendInvitationEmail: async () => {
        // Nessun provider email in Fase 3: il link di invito viene mostrato
        // nell'interfaccia e copiato manualmente dal titolare.
      },
    }),
    nextCookies(),
  ],
  databaseHooks: {
    session: {
      create: {
        // Tenant scoping: ogni sessione nasce già agganciata allo studio
        // dell'utente (un solo studio per utente nell'MVP).
        before: async (session) => {
          const membri = await db
            .select({ organizationId: schema.member.organizationId })
            .from(schema.member)
            .where(eq(schema.member.userId, session.userId))
            .limit(1);
          return {
            data: {
              ...session,
              activeOrganizationId: membri[0]?.organizationId ?? null,
            },
          };
        },
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  /**
   * Rate limiting: soglia generale prudente, più stretta sugli endpoint che
   * si prestano a tentativi ripetuti (login, registrazione, inviti).
   */
  rateLimit: {
    enabled: true,
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 300, max: 10 },
      "/organization/invite-member": { window: 300, max: 20 },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
