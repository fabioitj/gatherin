##############################
# 1. Etapa de Instalação de Dependências
##############################
FROM node:22-slim AS deps

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    libssl-dev \
    libc6 \
    zlib1g \
    wget \
 && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

# Instalar TODAS as dependências (inclui dev para o build)
RUN npm ci

##############################
# 2. Etapa de Build
##############################
FROM node:22-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    libssl-dev \
    libc6 \
    zlib1g \
 && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN mkdir -p /app/public

# Copiar schema do Prisma
COPY prisma ./prisma

# Gerar client e aplicar migrations
RUN npx prisma generate --schema=./prisma/schema.prisma

RUN npx prisma migrate deploy

# Build Next.js (standalone mode)
RUN npm run build

##############################
# 3. Etapa Final (Produção)
##############################
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    libc6 \
    zlib1g \
    wget \
 && rm -rf /var/lib/apt/lists/*

RUN groupadd -g 1001 nodejs \
 && useradd -m -u 1001 -g nodejs nextjs

RUN mkdir -p /app/public && chown -R nextjs:nodejs /app/public

# Copiar arquivos do build
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
# ou, se for standalone: CMD ["node", "server.js"]
