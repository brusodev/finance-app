"""
Script para executar testes com diferentes configurações
"""

import sys
import subprocess


def run_all_tests():
    """Executar todos os testes com cobertura"""
    print("🧪 Executando TODOS os testes...\n")
    cmd = ["pytest", "-v", "--cov=app", "--cov-report=term-missing", "--cov-report=html"]
    return subprocess.run(cmd).returncode


def run_fast_tests():
    """Executar apenas testes rápidos (sem integração)"""
    print("⚡ Executando testes RÁPIDOS (sem integração)...\n")
    cmd = ["pytest", "-v", "-m", "not slow", "--tb=short"]
    return subprocess.run(cmd).returncode


def run_integration_tests():
    """Executar apenas testes de integração"""
    print("🔗 Executando testes de INTEGRAÇÃO...\n")
    cmd = ["pytest", "-v", "tests/test_integration.py", "--tb=short"]
    return subprocess.run(cmd).returncode


def run_specific_module(module):
    """Executar testes de um módulo específico"""
    print(f"📦 Executando testes do módulo: {module}\n")
    cmd = ["pytest", "-v", f"tests/test_{module}.py", "--tb=short"]
    return subprocess.run(cmd).returncode


def run_with_html_report():
    """Executar testes e gerar relatório HTML"""
    print("📊 Executando testes e gerando relatório HTML...\n")
    cmd = ["pytest", "-v", "--cov=app", "--cov-report=html", "--html=htmlcov/report.html"]
    result = subprocess.run(cmd).returncode
    if result == 0:
        print("\n✅ Relatório HTML gerado em: htmlcov/index.html")
    return result


def run_debug_mode():
    """Executar testes em modo debug (com prints)"""
    print("🐛 Executando testes em modo DEBUG...\n")
    cmd = ["pytest", "-v", "-s", "--tb=long"]
    return subprocess.run(cmd).returncode


def show_coverage():
    """Mostrar relatório de cobertura"""
    print("📈 Gerando relatório de cobertura...\n")
    cmd = ["pytest", "--cov=app", "--cov-report=term-missing"]
    return subprocess.run(cmd).returncode


def main():
    """Menu principal"""
    if len(sys.argv) > 1:
        command = sys.argv[1]

        commands = {
            "all": run_all_tests,
            "fast": run_fast_tests,
            "integration": run_integration_tests,
            "html": run_with_html_report,
            "debug": run_debug_mode,
            "coverage": show_coverage,
        }

        if command in commands:
            sys.exit(commands[command]())
        elif command in ["auth", "users", "categories", "accounts", "transactions"]:
            sys.exit(run_specific_module(command))
        else:
            print(f"❌ Comando desconhecido: {command}\n")
            show_help()
            sys.exit(1)
    else:
        show_help()


def show_help():
    """Mostrar ajuda"""
    print("""
╔══════════════════════════════════════════════════════════════╗
║             🧪 SISTEMA DE TESTES - Finance App              ║
╚══════════════════════════════════════════════════════════════╝

Uso: python run_tests.py [comando]

Comandos disponíveis:

  all           - Executar TODOS os testes com cobertura
  fast          - Executar testes RÁPIDOS (sem integração)
  integration   - Executar apenas testes de INTEGRAÇÃO
  html          - Gerar relatório HTML de cobertura
  debug         - Executar em modo DEBUG (com prints)
  coverage      - Mostrar relatório de cobertura

  auth          - Testar apenas Auth API
  users         - Testar apenas Users API
  categories    - Testar apenas Categories API
  accounts      - Testar apenas Accounts API
  transactions  - Testar apenas Transactions API

Exemplos:

  python run_tests.py all
  python run_tests.py fast
  python run_tests.py accounts
  python run_tests.py integration

Ou use pytest diretamente:

  pytest -v                          # Todos os testes
  pytest tests/test_auth.py          # Apenas auth
  pytest -k "test_create"            # Testes com "create" no nome
  pytest --cov=app                   # Com cobertura
  pytest -v -s                       # Verbose com prints
  pytest -x                          # Para no primeiro erro

═══════════════════════════════════════════════════════════════
""")


if __name__ == "__main__":
    main()
