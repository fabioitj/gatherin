# Etapa de build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Etapa final de execução
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app ./
ENV NODE_ENV=production
EXPOSE 3000

# Executa migrações (caso existam) e inicia o servidor Next.js
CMD npx prisma migrate deploy && npm run start -- -p 3000 -H 0.0.0.0
