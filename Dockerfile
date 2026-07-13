# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app

# Install with dev dependencies first (Vite/Svelte are needed to build the client).
COPY package.json package-lock.json ./
COPY shared/package.json shared/package.json
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci

COPY shared shared
COPY server server
COPY client client
RUN npm run build -w client


FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Production-only install: skips Vite/Svelte, which are only needed to build the static client.
COPY package.json package-lock.json ./
COPY shared/package.json shared/package.json
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci --omit=dev

COPY shared/src shared/src
COPY server/src server/src
COPY --from=builder /app/client/dist client/dist

EXPOSE 3001
CMD ["npm", "start"]
