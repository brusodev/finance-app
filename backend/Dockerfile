FROM python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema (apenas o necessário para psycopg2-binary)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar arquivos de dependências
COPY requirements.txt .

# Instalar dependências Python (pip/setuptools atualizados: os da imagem
# base têm alertas de segurança)
RUN pip install --no-cache-dir --upgrade pip==26.2.2 setuptools==84.2.1 \
    && pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY . .

# Expor porta
EXPOSE 8000

# Comando para iniciar a aplicação
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
