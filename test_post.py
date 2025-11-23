import requests
import json

BASE_URL = "http://localhost:8000"

# Teste simples de POST
print("Enviando POST para /auth/register...")
print("-" * 60)

try:
    data = {
        "username": "testuser123",
        "password": "Password123"
    }

    print(f"Payload: {json.dumps(data)}")

    response = requests.post(
        f"{BASE_URL}/auth/register",
        json=data,
        timeout=5
    )

    print(f"\nStatus: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    print(f"Content-Length: {len(response.text)}")
    print(f"Raw Response: {response.text[:500]}")

    if response.text:
        try:
            print(f"JSON: {response.json()}")
        except Exception as json_err:
            print(f"Não é JSON válido: {json_err}")

except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
