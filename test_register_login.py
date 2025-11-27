import requests
import json

BASE_URL = "http://localhost:8000"

# Registrar usuário
username = "testuser_final"
password = "Password123"

print("1. Registrando usuário...")
resp1 = requests.post(
    f"{BASE_URL}/auth/register",
    json={"username": username, "password": password}
)
print(f"   Status: {resp1.status_code}")
print(f"   Response: {json.dumps(resp1.json(), indent=2)}")

# Login
print("\n2. Fazendo login...")
resp2 = requests.post(
    f"{BASE_URL}/auth/login",
    json={"username": username, "password": password}
)
print(f"   Status: {resp2.status_code}")
print(f"   Response: {json.dumps(resp2.json(), indent=2)}")

# Verificar se há token
response_data = resp2.json()
if 'token' in response_data:
    print(f"\n✅ Token encontrado: {response_data['token'][:30]}...")
else:
    print(
        f"\n⚠️  Sem token na response. Chaves disponíveis: {list(response_data.keys())}")
