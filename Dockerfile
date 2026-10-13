# syntax=docker/dockerfile:1

# Image Debian plutôt qu'Alpine : Prisma et bcrypt y trouvent leurs binaires précompilés.
FROM node:22-slim AS base
WORKDIR /app
# Prisma a besoin d'OpenSSL pour parler à MySQL.
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# --- Build : toutes les dépendances, client Prisma, build SvelteKit ---
FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build
# Ne garder que les dépendances de production pour l'image finale (le client Prisma généré en fait partie).
RUN npm prune --omit=dev

# --- Exécution ---
FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    UPLOAD_DIR=/data/uploads \n    NPM_CONFIG_UPDATE_NOTIFIER=false

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

# Les images envoyées vivent dans un volume ; l'utilisateur non-root `node` doit pouvoir y écrire.
# `sed` retire d'éventuels retours chariot Windows du script de démarrage.
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh \
    && chmod +x /usr/local/bin/entrypoint.sh \
    && mkdir -p /data/uploads \
    && chown -R node:node /data /app

USER node
EXPOSE 3000
VOLUME /data/uploads

ENTRYPOINT ["entrypoint.sh"]
