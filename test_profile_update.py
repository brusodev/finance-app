import requests
import json

# URL base
BASE_URL = "http://localhost:8000"

# Fazer login primeiro
login_data = {
    "username": "bruno",
    "password": "senha123"
}

print("1. Fazendo login...")
login_response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
print(f"Status: {login_response.status_code}")

if login_response.status_code == 200:
    token = login_response.json()["token"]
    print(f"Token obtido: {token}")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Testar endpoint de debug
    print("\n2. Testando endpoint de debug...")
    debug_data = {
        "full_name": "Bruno Teste",
        "email": "bruno@teste.com",
        "avatar": None,
        "cpf": None,
        "phone": None,
        "birth_date": None,
        "address": None
    }

    debug_response = requests.post(
        f"{BASE_URL}/users/profile/debug",
        json=debug_data,
        headers=headers
    )
    print(f"Status: {debug_response.status_code}")
    print(f"Resposta: {json.dumps(debug_response.json(), indent=2)}")

    # Testar atualização de perfil
    print("\n3. Testando atualização de perfil...")
    update_response = requests.put(
        f"{BASE_URL}/users/profile",
        json=debug_data,
        headers=headers
    )
    print(f"Status: {update_response.status_code}")

    if update_response.status_code == 200:
        print(f"Sucesso! Resposta: {json.dumps(update_response.json(), indent=2)}")
    else:
        print(f"Erro: {update_response.text}")
else:
    print(f"Erro no login: {login_response.text}")
