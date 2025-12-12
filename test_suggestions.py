#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para testar o endpoint de sugestões de descrições
"""
import requests
import json
import sys
import io

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

API_URL = "http://localhost:8000"

def login(username, password):
    """Faz login e retorna o token"""
    response = requests.post(
        f"{API_URL}/auth/login",
        json={"username": username, "password": password}
    )
    if response.status_code == 200:
        data = response.json()
        print(f"Login response: {data}")
        # Tenta várias chaves possíveis
        return data.get("access_token") or data.get("token") or data.get("access_token")
    else:
        print(f"Erro no login: {response.status_code} - {response.text}")
        return None

def get_suggestions(token, transaction_type=None, category_id=None, limit=10):
    """Busca sugestões de descrições"""
    headers = {"Authorization": f"Bearer {token}"}
    params = {"limit": limit}

    if transaction_type:
        params["transaction_type"] = transaction_type
    if category_id:
        params["category_id"] = category_id

    response = requests.get(
        f"{API_URL}/transactions/suggestions/descriptions",
        headers=headers,
        params=params
    )

    print(f"\n📊 Status: {response.status_code}")
    print(f"🔗 URL: {response.url}")

    if response.status_code == 200:
        suggestions = response.json()
        print(f"✅ Sugestões encontradas: {len(suggestions)}")
        if suggestions:
            print("\n📝 Sugestões:")
            for i, suggestion in enumerate(suggestions, 1):
                print(f"  {i}. {suggestion}")
        else:
            print("⚠️  Nenhuma sugestão disponível (pode não haver transações no banco)")
        return suggestions
    else:
        print(f"❌ Erro: {response.text}")
        return None

def get_transactions(token):
    """Lista transações existentes"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_URL}/transactions/", headers=headers)

    if response.status_code == 200:
        transactions = response.json()
        print(f"\n💰 Total de transações: {len(transactions)}")
        if transactions:
            print("\n📋 Primeiras 5 transações:")
            for t in transactions[:5]:
                print(f"  - {t.get('description', 'Sem descrição')} (ID: {t.get('id')})")
        return transactions
    else:
        print(f"❌ Erro ao buscar transações: {response.text}")
        return None

def main():
    print("🧪 Testando endpoint de sugestões de descrições\n")
    print("=" * 60)

    # Login
    print("\n1️⃣  Fazendo login...")
    token = login("testefront", "teste123")

    if not token:
        # Tenta criar o usuário
        print("\n🔧 Tentando criar usuário testefront...")
        response = requests.post(
            f"{API_URL}/auth/register",
            json={
                "username": "testefront",
                "password": "teste123",
                "email": "teste@front.com",
                "full_name": "Teste Frontend"
            }
        )
        if response.status_code == 200:
            print("✅ Usuário criado com sucesso!")
            token = login("testefront", "teste123")
        else:
            print(f"❌ Erro ao criar usuário: {response.text}")
            return

    if not token:
        print("❌ Não foi possível obter token de autenticação")
        return

    print("✅ Login realizado com sucesso!")

    # Buscar transações existentes
    print("\n2️⃣  Buscando transações existentes...")
    transactions = get_transactions(token)

    # Testar sugestões sem filtros
    print("\n3️⃣  Testando sugestões SEM filtros...")
    print("-" * 60)
    get_suggestions(token)

    # Testar sugestões com filtro de tipo
    print("\n4️⃣  Testando sugestões para DESPESAS...")
    print("-" * 60)
    get_suggestions(token, transaction_type="expense")

    # Testar sugestões com filtro de tipo
    print("\n5️⃣  Testando sugestões para RECEITAS...")
    print("-" * 60)
    get_suggestions(token, transaction_type="income")

    # Testar sugestões com categoria (se houver transações)
    if transactions and len(transactions) > 0:
        category_id = transactions[0].get('category_id')
        if category_id:
            print(f"\n6️⃣  Testando sugestões para categoria {category_id}...")
            print("-" * 60)
            get_suggestions(token, category_id=category_id)

    print("\n" + "=" * 60)
    print("✅ Testes concluídos!")

if __name__ == "__main__":
    main()
