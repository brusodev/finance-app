#!/bin/bash

# Script principal para iniciar o Finance App
# Uso: ./start.sh [backend|frontend|both]

show_help() {
    echo "🚀 Finance App - Script de Inicialização"
    echo ""
    echo "Uso: ./start.sh [opcao]"
    echo ""
    echo "Opções:"
    echo "  backend   - Inicia apenas o backend"
    echo "  frontend  - Inicia apenas o frontend"
    echo "  both      - Inicia backend e frontend (padrão)"
    echo "  help      - Mostra esta mensagem"
    echo ""
    echo "Exemplos:"
    echo "  ./start.sh backend"
    echo "  ./start.sh frontend"
    echo "  ./start.sh both"
    echo ""
}

start_backend() {
    echo "🔧 Iniciando Backend..."
    cd backend
    ./start.sh
}

start_frontend() {
    echo "🎨 Iniciando Frontend..."
    cd frontend
    ./start.sh
}

start_both() {
    echo "🚀 Iniciando Finance App (Backend + Frontend)"
    echo ""
    echo "⚠️  IMPORTANTE: Este script iniciará ambos os servidores."
    echo "   Recomenda-se executar em terminais separados:"
    echo ""
    echo "   Terminal 1: cd backend && ./start.sh"
    echo "   Terminal 2: cd frontend && ./start.sh"
    echo ""
    echo "Pressione Ctrl+C para cancelar ou Enter para continuar..."
    read

    # Iniciar backend em background
    echo "🔧 Iniciando Backend em background..."
    cd backend
    ./start.sh &
    BACKEND_PID=$!
    cd ..

    sleep 3

    # Iniciar frontend
    echo "🎨 Iniciando Frontend..."
    cd frontend
    ./start.sh

    # Quando frontend for parado, parar o backend também
    kill $BACKEND_PID
}

# Tornar os scripts executáveis
chmod +x backend/start.sh 2>/dev/null
chmod +x frontend/start.sh 2>/dev/null

# Processar argumentos
case "${1:-both}" in
    backend)
        start_backend
        ;;
    frontend)
        start_frontend
        ;;
    both)
        start_both
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "❌ Opção inválida: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
