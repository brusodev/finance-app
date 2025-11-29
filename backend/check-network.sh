#!/bin/bash

# Script de diagnóstico de rede para o Finance App Backend
# Verifica se o backend está acessível na rede

echo "🔍 Diagnóstico de Rede - Finance App Backend"
echo "============================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se uvicorn está rodando
echo "1️⃣ Verificando se o backend está rodando..."
if pgrep -f "uvicorn.*app.main:app" > /dev/null; then
    echo -e "${GREEN}✅ Backend está rodando${NC}"
else
    echo -e "${RED}❌ Backend NÃO está rodando${NC}"
    echo "   Execute: ./start.sh"
    exit 1
fi

echo ""

# Verificar porta 8000
echo "2️⃣ Verificando se a porta 8000 está escutando..."
if netstat -an 2>/dev/null | grep ":8000" | grep "LISTEN" > /dev/null; then
    echo -e "${GREEN}✅ Porta 8000 está escutando${NC}"

    # Verificar se está escutando em 0.0.0.0 ou apenas 127.0.0.1
    if netstat -an 2>/dev/null | grep "0.0.0.0:8000" > /dev/null; then
        echo -e "${GREEN}✅ Escutando em 0.0.0.0 (rede)${NC}"
    elif netstat -an 2>/dev/null | grep "127.0.0.1:8000" > /dev/null; then
        echo -e "${RED}❌ Escutando APENAS em 127.0.0.1 (localhost)${NC}"
        echo -e "${YELLOW}   Solução: Reinicie com --host 0.0.0.0${NC}"
    fi
else
    echo -e "${RED}❌ Porta 8000 NÃO está escutando${NC}"
fi

echo ""

# Testar localhost
echo "3️⃣ Testando acesso local (localhost)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000 | grep -q "200"; then
    echo -e "${GREEN}✅ http://localhost:8000 acessível${NC}"
else
    echo -e "${RED}❌ http://localhost:8000 não acessível${NC}"
fi

echo ""

# Descobrir IPs
echo "4️⃣ Descobrindo IPs da máquina..."
echo ""
if command -v ipconfig &> /dev/null; then
    # Windows
    echo "🌐 IPs disponíveis:"
    ipconfig | grep -i "IPv4" | grep -v "127.0.0.1"
else
    # Linux/Mac
    echo "🌐 IPs disponíveis:"
    ip addr show | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | cut -d'/' -f1
fi

echo ""
echo "5️⃣ URLs de acesso recomendadas:"
echo "   📍 Local:      http://localhost:8000"
echo "   📍 VPN:        http://100.87.89.96:8000"
echo "   📍 Rede:       http://192.168.0.250:8000"
echo ""

# Verificar configuração de CORS
echo "6️⃣ Verificando configuração de CORS..."
if grep -q "allow_origin_regex" app/main.py; then
    echo -e "${GREEN}✅ CORS configurado com regex (aceita qualquer IP)${NC}"
else
    echo -e "${YELLOW}⚠️  CORS pode estar limitado a localhost${NC}"
    echo "   Verifique app/main.py"
fi

echo ""
echo "============================================="
echo "✅ Diagnóstico completo!"
echo ""
echo "💡 Para testar de outro PC:"
echo "   1. Certifique-se que o backend rodou com --host 0.0.0.0"
echo "   2. Configure o firewall para permitir porta 8000"
echo "   3. Use um dos IPs acima no navegador"
echo ""
