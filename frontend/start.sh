#!/bin/bash

# Script para iniciar o frontend do Finance App
# Uso: ./start.sh

echo "🚀 Iniciando Finance App Frontend..."
echo ""

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
    echo ""
fi

# Verificar .env.local
if [ -f ".env.local" ]; then
    echo "✅ Arquivo .env.local encontrado"
    echo "📝 API configurada para: $(grep VITE_API_URL .env.local | cut -d '=' -f2)"
else
    echo "⚠️  Arquivo .env.local não encontrado!"
    echo "   Criando com configuração padrão..."
    cat > .env.local << 'EOF'
# Configuração Local - Este arquivo sobrescreve os outros
# Use este arquivo para configurar o IP da sua rede local ou VPN

# Para VPN (ajuste o IP da VPN):
VITE_API_URL=http://100.87.89.96:8000
EOF
    echo "✅ Arquivo .env.local criado!"
fi

echo ""
echo "🌐 Iniciando servidor na rede (0.0.0.0:3000)..."
echo "   Acessível em:"
echo "   - http://localhost:3000"
echo "   - http://100.87.89.96:3000 (VPN)"
echo "   - http://192.168.0.250:3000 (Rede local)"
echo ""
echo "📝 Pressione Ctrl+C para parar o servidor"
echo ""

# Iniciar Vite
npm run dev
