# 1. Etapa de Build
FROM python:3.11-slim AS builder

# Instalar dependências de build
RUN apt-get update && apt-get install -y --no-install-recommends gcc

# Criar diretório de trabalho
WORKDIR /app

# Instalar dependências Python
COPY requirements.txt .
RUN pip wheel --no-cache-dir --wheel-dir /wheels -r requirements.txt

# 2. Etapa Final (Produção)
FROM python:3.11-slim

# Instalar dependências de tempo de execução
RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Criar diretório de trabalho
WORKDIR /app

# Copiar wheels da etapa de build e instalar
COPY --from=builder /wheels /wheels
RUN pip install --no-cache /wheels/*

# Copiar código da aplicação
COPY . .

# Criar usuário não-root
RUN useradd -m -u 1001 python && \
    chown -R python:python /app

# Mudar para usuário não-root
USER python

# Expor a porta
EXPOSE 8000

# Healthcheck para verificar se a API está rodando
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

# Comando para iniciar a aplicação
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]