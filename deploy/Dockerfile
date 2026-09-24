# Immagine dell'istanza cliente.
#
#   docker build -f deploy/Dockerfile -t finbeacon:locale .
#
# Il contesto di build e' la RADICE del monorepo: `packages/engine` vive fuori da
# apps/web ed e' TypeScript sorgente, quindi deve entrare nel contesto.
#
# Tre trappole note, evitate per costruzione:
#
#  G-13  Nell'immagine standalone NON c'e' `drizzle-orm`: Next lo impacchetta
#        dentro .next/server e non lo copia in node_modules. Migratore e worker
#        sono quindi BUNDLE autosufficienti prodotti da esbuild, non script che
#        importano pacchetti a runtime.
#  G-14  `.next/standalone` puo' portarsi dietro `src/` e altro materiale
#        locale. Si cancella esplicitamente, e si verifica DENTRO l'immagine.
#  G-20  Le variabili di un'immagine si leggono senza avviarla: in ENV e negli
#        ARG non entra nessun segreto. Solo le NEXT_PUBLIC_*, che Next incorpora
#        comunque nel bundle servito al browser.

# ---------------------------------------------------------------- dipendenze --
FROM node:22-alpine AS dipendenze
RUN corepack enable && corepack prepare pnpm@11.2.2 --activate
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/engine/package.json packages/engine/
RUN pnpm install --frozen-lockfile

# --------------------------------------------------------------------- build --
FROM dipendenze AS build
# Inlined a build time da Next: pubbliche per definizione, non per distrazione.
ARG NEXT_PUBLIC_SENTRY_DSN=""
ARG NEXT_PUBLIC_REGISTRAZIONE_APERTA=""
ARG GIT_SHA="sconosciuto"
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
    NEXT_PUBLIC_REGISTRAZIONE_APERTA=$NEXT_PUBLIC_REGISTRAZIONE_APERTA \
    GIT_SHA=$GIT_SHA \
    NEXT_TELEMETRY_DISABLED=1
COPY . .
# `build:bundle` e non i singoli: il runtime copia TRE bundle (migra, worker,
# crea-titolare) e qui se ne costruivano due. L'immagine falliva su
# `COPY crea-titolare.js`, ma nessuno lo sapeva: il lavoro `immagine` dipende
# dai cancelli, e finche' l'audit e' stato rosso non e' mai stato eseguito.
# Un cancello mai attraversato non e' un cancello (GUASTI G-32).
#
# Con lo script aggregato, un quarto bundle aggiunto a `build:bundle` finisce
# nell'immagine senza che qualcuno debba ricordarsi di toccare anche questo file.
RUN pnpm --filter web build \
 && pnpm --filter web build:bundle

# ------------------------------------------------------------------- runtime --
FROM node:22-alpine AS runtime
RUN apk add --no-cache tini \
 && addgroup -S app && adduser -S app -G app
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Server standalone. `public/` lo copia Next da se'; `.next/static` no (G-06).
COPY --from=build --chown=app:app /repo/apps/web/.next/standalone ./
COPY --from=build --chown=app:app /repo/apps/web/.next/static ./apps/web/.next/static

# Bundle autosufficienti: girano senza node_modules (verificato).
COPY --from=build --chown=app:app /repo/apps/web/migra.js ./apps/web/migra.js
COPY --from=build --chown=app:app /repo/apps/web/worker.js ./apps/web/worker.js
COPY --from=build --chown=app:app /repo/apps/web/crea-titolare.js ./apps/web/crea-titolare.js
# I file .sql delle migrazioni: il migratore li legge a runtime.
COPY --from=build --chown=app:app /repo/apps/web/drizzle ./apps/web/drizzle

# G-14: via tutto cio' che non serve a servire richieste. `outputFileTracingExcludes`
# NON copre questa copia, quindi la pulizia e' esplicita e verificabile.
RUN rm -rf ./apps/web/src ./apps/web/e2e ./apps/web/scripts \
           ./apps/web/*.config.ts ./apps/web/*.config.mjs \
           ./apps/web/tsconfig*.json ./apps/web/.env* \
           ./packages 2>/dev/null || true

USER app
EXPOSE 3000

# tini come PID 1: senza, i segnali non arrivano al processo Node e un
# `docker stop` diventa un kill dopo dieci secondi, a meta' di una transazione.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/web/server.js"]
