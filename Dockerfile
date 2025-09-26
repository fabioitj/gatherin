##############################
# 1. Etapa de Instalação de Dependências
##############################
FROM node:22-slim AS deps

WORKDIR /app

# Instalar libs do Prisma (necessárias no runtime)
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    libssl-dev \
    libc6 \
    zlib1g \
    wget \
 && rm -rf /var/lib/apt/lists/*

# Copiar package.json e lockfile
COPY package.json package-lock.json ./

# Instalar TODAS as dependências (inclui dev para o build)
RUN npm ci

##############################
# 2. Etapa de Build
##############################
FROM node:22-slim AS builder

WORKDIR /app

# Copiar libs do sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    libssl-dev \
    libc6 \
    zlib1g \
 && rm -rf /var/lib/apt/lists/*

# Copiar dependências da etapa anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar todo o código
COPY . .

# 🔑 Criar a pasta public (mesmo se não existir no repositório)
RUN mkdir -p /app/public

# Gerar Prisma Client
RUN npx prisma generate

# Build da aplicação Next.js (standalone)
RUN npm run build

##############################
# 3. Etapa Final (Produção)
##############################
FROM node:22-slim AS runner

WORKDIR /app

# Variáveis de ambiente
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Instalar apenas libs necessárias no runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    libc6 \
    zlib1g \
    wget \
 && rm -rf /var/lib/apt/lists/*

# Criar usuário e grupo não-root (sintaxe Debian)
RUN groupadd -g 1001 nodejs \
 && useradd -m -u 1001 -g nodejs nextjs

# Copiar arquivos da build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Usar usuário não-root
USER nextjs

# Expor porta
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Comando para iniciar a aplicação
CMD ["node", "server.js"]
