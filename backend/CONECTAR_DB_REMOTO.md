# 🌐 Conectar Sistema Local ao Banco de Dados Online (Railway)

Este guia mostra como conectar seu backend local ao banco de dados PostgreSQL hospedado no Railway.

## 🎯 Objetivo

Usar o **banco de dados em produção** (Railway) no seu **desenvolvimento local**, para:
- ✅ Testar com dados reais
- ✅ Não precisar configurar PostgreSQL localmente
- ✅ Compartilhar dados entre local e produção
- ✅ Facilitar testes e desenvolvimento

## 📋 Pré-requisitos

1. ✅ Ter o Railway configurado com PostgreSQL
2. ✅ Ter a `DATABASE_URL` do Railway
3. ✅ Ter `psycopg2-binary` instalado (já está no requirements.txt)

## 🚀 Passo a Passo

### 1. Obter a DATABASE_URL do Railway

No Railway, vá em:
1. Seu projeto → PostgreSQL
2. Aba **Connect**
3. Copie a **Database URL** (formato completo)

Exemplo:
```
postgresql://postgres:SENHA@host.railway.app:1234/railway
```

### 2. Configurar o arquivo `.env`

Seu arquivo `.env` já está configurado:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:AipgyavIuQtKDvlGfycpkIgiVCYqkSxo@switchback.proxy.rlwy.net:25835/railway

# Security
SECRET_KEY=your-secret-key-here-change-in-production

# Environment
ENVIRONMENT=development
```

### 3. Testar a Conexão

Execute o script de teste:

```bash
cd backend
python test_db_connection.py
```

**Se conectou com sucesso**, você verá:
```
✅ CONEXÃO ESTABELECIDA COM SUCESSO!

📊 Versão do PostgreSQL:
   PostgreSQL 16.x...

📋 Tabelas encontradas (5):
   - users
   - categories
   - accounts
   - transactions
   - alembic_version
```

**Se deu erro**, o script vai te mostrar soluções.

### 4. Iniciar o Backend Local

Com o `.env` configurado, inicie o servidor:

```bash
uvicorn app.main:app --reload
```

Agora seu backend local está usando o banco do Railway! 🎉

### 5. Verificar se Está Funcionando

Abra o navegador em:
```
http://localhost:8000/docs
```

Teste qualquer endpoint. Os dados estarão sincronizados com o Railway.

## 🔍 Como Verificar a Conexão

### Método 1: Logs do Backend

Quando você inicia o backend, ele mostra:

```
🔄 Verificando migrações do banco de dados...
📊 Banco de dados detectado: PostgreSQL
✅ Coluna 'cpf' já existe
✅ Coluna 'phone' já existe
...
✅ Migrações concluídas com sucesso!
```

### Método 2: Script de Teste

```bash
python test_db_connection.py
```

### Método 3: Testar API

```bash
# Registrar usuário
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"teste","password":"123456","email":"teste@test.com","full_name":"Teste"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"teste","password":"123456"}'
```

## 📊 Estrutura de Arquivos

```
backend/
├── .env                        # ← Configuração do banco
├── app/
│   ├── main.py                 # ← Inicia e conecta ao banco
│   ├── database.py             # ← Gerencia conexão
│   └── models.py               # ← Define tabelas
├── test_db_connection.py       # ← Script de teste (NOVO)
└── requirements.txt            # ← Dependências (já tem psycopg2)
```

## 🔧 Troubleshooting

### Erro: "No module named 'psycopg2'"

Instale as dependências:
```bash
pip install -r requirements.txt
```

### Erro: "could not connect to server"

1. **Verifique a internet** - Precisa estar online
2. **Verifique a URL** - Confira se copiou correta do Railway
3. **Verifique o Railway** - Acesse o dashboard e veja se o DB está online

### Erro: "password authentication failed"

A senha na `DATABASE_URL` está incorreta. Copie novamente do Railway.

### Erro: "SSL required"

PostgreSQL do Railway exige SSL. Nossa configuração já trata isso em `database.py`:

```python
if "postgresql" in database_url:
    engine = create_engine(
        database_url,
        connect_args={"sslmode": "require"}  # ← Isso resolve
    )
```

## ⚙️ Configurações Avançadas

### Usar SQLite Local para Desenvolvimento

Se quiser usar SQLite localmente e PostgreSQL em produção:

**Opção 1: Criar `.env.local`**
```env
DATABASE_URL=sqlite:///./finance.db
```

E carregar assim:
```python
load_dotenv(".env.local")  # Para local
load_dotenv(".env")        # Para produção
```

**Opção 2: Variável de ambiente**
```bash
# Windows
set DATABASE_URL=sqlite:///./finance.db
uvicorn app.main:app --reload

# Linux/Mac
DATABASE_URL=sqlite:///./finance.db uvicorn app.main:app --reload
```

### Pool de Conexões

Para otimizar performance com PostgreSQL remoto:

```python
# database.py
engine = create_engine(
    database_url,
    pool_size=5,        # Máximo de 5 conexões simultâneas
    max_overflow=10,    # Até 10 extras em pico
    pool_timeout=30,    # Timeout de 30s
    pool_recycle=3600,  # Reciclar conexões a cada hora
    connect_args={"sslmode": "require"}
)
```

## 📝 Checklist de Conexão

- [ ] Tenho a DATABASE_URL do Railway
- [ ] Copiei para o arquivo .env
- [ ] Instalei as dependências (pip install -r requirements.txt)
- [ ] Testei a conexão (python test_db_connection.py)
- [ ] Iniciei o backend (uvicorn app.main:app --reload)
- [ ] Testei um endpoint (/docs)

## 🎯 Quando Usar Banco Remoto vs Local

### Use Banco Remoto (Railway) quando:
✅ Quer testar com dados reais
✅ Está desenvolvendo features que afetam produção
✅ Quer compartilhar dados com time
✅ Não quer configurar PostgreSQL local

### Use Banco Local (SQLite) quando:
✅ Está fazendo testes que podem quebrar dados
✅ Não tem internet estável
✅ Quer isolar ambiente de desenvolvimento
✅ Está testando migrações perigosas

## 🔐 Segurança

⚠️ **IMPORTANTE:**

1. **Nunca commite o .env** - Está no .gitignore
2. **Não compartilhe a DATABASE_URL** - Tem credenciais
3. **Use senhas fortes** - Sempre
4. **Faça backup** - Antes de testes destrutivos

## 📞 Suporte

Se algo não funcionar:

1. Execute: `python test_db_connection.py`
2. Copie a mensagem de erro
3. Verifique se:
   - Está online
   - Railway está funcionando
   - .env está correto
   - Dependências instaladas

## 🎉 Próximos Passos

Após conectar:

1. **Execute os testes**:
   ```bash
   python test_all_apis.py
   ```

2. **Rode o frontend local**:
   ```bash
   cd ../frontend
   npm run dev
   ```

3. **Configure VITE_API_URL**:
   ```env
   # frontend/.env
   VITE_API_URL=http://localhost:8000
   ```

Agora você tem:
- ✅ Backend local → Banco Railway
- ✅ Frontend local → Backend local
- ✅ Tudo sincronizado!

---

**Criado por:** Claude Code
**Data:** 06/12/2025
