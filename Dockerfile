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
ENV NODE_ENV=production
ENV PORT=3000
ENV UPLOAD_DIR=/data/uploads
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

# Fichiers copiés directement au nom de l'utilisateur non-root `node`.
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/build ./build
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/package.json ./
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

# Les images envoyées vivent dans un volume où `node` doit pouvoir écrire.
# `tr` retire d'éventuels retours chariot Windows du script de démarrage.
RUN tr -d '\r' < /usr/local/bin/entrypoint.sh > /tmp/entrypoint.sh \
    && mv /tmp/entrypoint.sh /usr/local/bin/entrypoint.sh \
    && chmod +x /usr/local/bin/entrypoint.sh \
    && mkdir -p /data/uploads \
    && chown -R node:node /data \
    && chown node:node /app

USER node
EXPOSE 3000
VOLUME /data/uploads

ENTRYPOINT ["entrypoint.sh"]
