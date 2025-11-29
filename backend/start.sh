#!/bin/bash

# Script para iniciar o backend do Finance App
# Uso: ./start.sh

echo "🚀 Iniciando Finance App Backend..."
echo ""

# Ativar ambiente virtual se existir
if [ -d "venv" ]; then
    echo "📦 Ativando ambiente virtual..."
    source venv/Scripts/activate
elif [ -d ".venv" ]; then
    echo "📦 Ativando ambiente virtual..."
    source .venv/Scripts/activate
else
    echo "⚠️  Ambiente virtual não encontrado. Continuando sem ativar..."
fi

echo ""
echo "🔄 Executando migrações do banco de dados..."
python migrate_user_fields.py || echo "⚠️  Migrações podem já ter sido executadas"
echo ""

echo "🌐 Iniciando servidor na rede (0.0.0.0:8000)..."
echo "   Acessível em:"
echo "   - http://localhost:8000"
echo "   - http://100.87.89.96:8000 (VPN)"
echo "   - http://192.168.0.250:8000 (Rede local)"
echo ""
echo "📝 Pressione Ctrl+C para parar o servidor"
echo ""

# Iniciar uvicorn com host 0.0.0.0 para aceitar conexões de rede
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
