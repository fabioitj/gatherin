# 1. Etapa de Instalação de Dependências
FROM node:22-slim AS deps

WORKDIR /app

# Copiar package.json e lockfile
COPY package.json package-lock.json ./

# Instalar dependências de produção
RUN npm ci --only=production

# 2. Etapa de Build
FROM node:22-slim AS builder

WORKDIR /app

# Copiar dependências da etapa anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar todo o código
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Build da aplicação
RUN npm run build

# 3. Etapa Final (Produção)
FROM node:22-slim AS runner

WORKDIR /app

# Definir variáveis de ambiente
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Criar usuário e grupo não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copiar arquivos da build (standalone)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Mudar para o usuário não-root
USER nextjs

# Expor a porta
EXPOSE 3000

# Healthcheck para verificar se a aplicação está rodando
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Comando para iniciar a aplicação
CMD ["node", "server.js"]