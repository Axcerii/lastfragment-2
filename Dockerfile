# syntax=docker/dockerfile:1

# Image Debian plutôt qu'Alpine : Prisma et bcrypt y trouvent leurs binaires précompilés.
# Debian 13 (trixie) : moins de failles connues que bookworm dans les paquets système.
FROM node:22-trixie-slim AS base
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
# La CLI Prisma ne contacte pas ses serveurs et n'écrit rien dans le dossier personnel.
ENV CHECKPOINT_DISABLE=1
ENV PRISMA_HIDE_UPDATE_MESSAGE=1

# Le code appartient à root : l'utilisateur `node` peut le lire, pas le modifier.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

# Les images envoyées vivent dans un volume, seul endroit où `node` doit pouvoir écrire.
# `tr` retire d'éventuels retours chariot Windows du script de démarrage.
RUN tr -d '\r' < /usr/local/bin/entrypoint.sh > /tmp/entrypoint.sh \
    && mv /tmp/entrypoint.sh /usr/local/bin/entrypoint.sh \
    && chmod +x /usr/local/bin/entrypoint.sh \
    # npm, npx, yarn et corepack ne servent qu'à installer : absents de l'image, ils ne peuvent
    # ni être exploités ni apporter leurs failles connues.
    && rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx \
        /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-* \
    && mkdir -p /data/uploads \
    && chown -R node:node /data

USER node
EXPOSE 3000
VOLUME /data/uploads

ENTRYPOINT ["entrypoint.sh"]
