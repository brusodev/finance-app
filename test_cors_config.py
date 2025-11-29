import re

# Testar o regex CORS
pattern = r"https://.*\.up\.railway\.app"
test_urls = [
    "https://finance-app-bruno.up.railway.app",
    "https://backend-production-01bf8.up.railway.app",
    "https://test.up.railway.app",
    "http://localhost:3000",
]

print("Testando regex CORS:")
print(f"Pattern: {pattern}\n")

for url in test_urls:
    match = re.match(pattern, url)
    print(f"{url}")
    print(f"  Match: {bool(match)}")
    if match:
        print(f"  Matched: {match.group()}")
    print()
