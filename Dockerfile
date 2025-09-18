# Etapa de build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Rodar as migrações Prisma antes do build
RUN npx prisma migrate deploy
RUN npm run build

# Etapa de execução
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app ./

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "run", "start", "--", "-p", "3000", "-H", "0.0.0.0"]
