#!/bin/bash

# Script para build de produção do Frontend
# Uso: ./build.sh

echo "📦 Finance App - Build de Produção"
echo "===================================="
echo ""

# Verificar se .env.production existe
if [ ! -f ".env.production" ]; then
    echo "⚠️  Arquivo .env.production não encontrado!"
    echo "   Criando com valores padrão..."
    cat > .env.production << 'EOF'
# Configuração de Produção
# Substitua pelo IP/domínio da sua VPS
VITE_API_URL=http://SEU_IP_VPS:8000
EOF
    echo ""
    echo "⚠️  IMPORTANTE: Edite .env.production e configure a URL da API!"
    echo ""
    read -p "Pressione Enter para continuar ou Ctrl+C para cancelar..."
fi

echo "📝 Configuração atual:"
grep VITE_API_URL .env.production
echo ""

echo "🔨 Instalando dependências..."
npm install

echo ""
echo "🏗️  Gerando build de produção..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build concluído com sucesso!"
    echo ""
    echo "📁 Arquivos gerados em: ./dist"
    echo ""
    echo "🚀 Próximos passos:"
    echo "   1. Faça upload da pasta 'dist' para sua VPS"
    echo "   2. Configure um servidor web (nginx, apache, etc.)"
    echo "   3. Aponte para a pasta dist"
    echo ""
else
    echo ""
    echo "❌ Erro ao gerar build!"
    exit 1
fi
