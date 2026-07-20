# syntax=docker/dockerfile:1

# =========================================================================
# Stage 1: deps - install all dependencies (incl. dev, needed to build)
# =========================================================================
FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install

# =========================================================================
# Stage 2: build - compile TypeScript to dist/
# =========================================================================
FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build

# =========================================================================
# Stage 3: runtime - slim production image
# =========================================================================
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Non-root user for defense in depth.
RUN groupadd --gid 1001 nodejs && useradd --uid 1001 --gid nodejs --shell /bin/sh --create-home appuser

COPY package*.json ./
RUN npm install --omit=dev \
    && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh && chown -R appuser:nodejs /app

USER appuser

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/main.js"]
