import requests
import uuid
import time
import json

time.sleep(1)  # Aguardar servidor

BASE_URL = "http://localhost:8000"

print("=" * 70)
print("🧪 TESTE DE CORS E API")
print("=" * 70)

# Teste 1: Preflight OPTIONS
print("\n1️⃣  Teste Preflight OPTIONS")
print("-" * 70)
try:
    response = requests.options(
        f"{BASE_URL}/auth/register",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST"
        }
    )
    print(f"✓ Status: {response.status_code}")
    print(f"✓ Access-Control-Allow-Origin: {response.headers.get('access-control-allow-origin', 'NOT SET')}")
    print(f"✓ Access-Control-Allow-Methods: {response.headers.get('access-control-allow-methods', 'NOT SET')}")
except Exception as e:
    print(f"❌ ERROR: {e}")

# Teste 2: Registrar
print("\n2️⃣  Teste Registro")
print("-" * 70)
try:
    username = f"testuser_{str(uuid.uuid4())[:8]}"
    password = "Password123"
    
    response = requests.post(
        f"{BASE_URL}/auth/register",
        json={"username": username, "password": password},
        headers={"Origin": "http://localhost:5173"}
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ SUCESSO! Usuário criado: {data.get('username')}")
        registered_username = username
        registered_password = password
    else:
        print(f"❌ ERRO: {response.json()}")
except Exception as e:
    print(f"❌ ERROR: {e}")

# Teste 3: Login
print("\n3️⃣  Teste Login")
print("-" * 70)
try:
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"username": registered_username, "password": registered_password},
        headers={"Origin": "http://localhost:5173"}
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        token = data.get('token')
        print(f"✅ SUCESSO! Login bem-sucedido")
        print(f"   Token: {token[:50]}...")
    else:
        print(f"❌ ERRO: {response.json()}")
except Exception as e:
    print(f"❌ ERROR: {e}")

print("\n" + "=" * 70)
print("✅ TESTES CONCLUÍDOS!")
print("=" * 70)
