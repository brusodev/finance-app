# 📚 API Backend - Documentação Completa

**Version**: 1.0.0  
**Base URL**: `http://localhost:8000`  
**Status**: ✅ Produção-ready

---

## 📖 Índice

1. [Autenticação](#autenticação)
2. [Usuários](#usuários)
3. [Categorias](#categorias)
4. [Transações](#transações)
5. [Health Check](#health-check)
6. [Códigos de Status](#códigos-de-status)
7. [Tratamento de Erros](#tratamento-de-erros)

---

## 🔐 Autenticação

### POST /auth/register
Registra um novo usuário na aplicação.

**Request:**
```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "joao.silva",
    "password": "senha123"
  }'
```

**Payload:**
```json
{
  "username": "joao.silva",
  "password": "senha123"
}
```

**Response (200 - Sucesso):**
```json
{
  "id": 1,
  "username": "joao.silva"
}
```

**Erros:**
- `400 Bad Request` - Username já existe ou dados inválidos
- `422 Unprocessable Entity` - Validação falhou

**Notas:**
- Username deve ser único
- Password será hashed automaticamente (PBKDF2)
- Mínimo 6 caracteres recomendado para senha

---

### POST /auth/login
Autentica um usuário existente.

**Request:**
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "joao.silva",
    "password": "senha123"
  }'
```

**Payload:**
```json
{
  "username": "joao.silva",
  "password": "senha123"
}
```

**Response (200 - Sucesso):**
```json
{
  "id": 1,
  "username": "joao.silva"
}
```

**Erros:**
- `401 Unauthorized` - Senha incorreta
- `404 Not Found` - Usuário não encontrado
- `422 Unprocessable Entity` - Validação falhou

---

## 👥 Usuários

### GET /users/
Lista todos os usuários registrados.

**Request:**
```bash
curl -X GET "http://localhost:8000/users/" \
  -H "Content-Type: application/json"
```

**Response (200 - Sucesso):**
```json
[
  {
    "id": 1,
    "username": "joao.silva"
  },
  {
    "id": 2,
    "username": "maria.santos"
  }
]
```

**Parâmetros:**
- Nenhum requerido

---

### GET /users/{id}
Obtém informações de um usuário específico.

**Request:**
```bash
curl -X GET "http://localhost:8000/users/1" \
  -H "Content-Type: application/json"
```

**Response (200 - Sucesso):**
```json
{
  "id": 1,
  "username": "joao.silva"
}
```

**Erros:**
- `404 Not Found` - Usuário não encontrado

**Parâmetros:**
- `id` (path) - ID do usuário (obrigatório)

---

### PUT /users/{id}
Atualiza os dados de um usuário.

**Request:**
```bash
curl -X PUT "http://localhost:8000/users/1" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "joao.silva.updated",
    "password": "novaSenha456"
  }'
```

**Payload:**
```json
{
  "username": "joao.silva.updated",
  "password": "novaSenha456"
}
```

**Response (200 - Sucesso):**
```json
{
  "id": 1,
  "username": "joao.silva.updated"
}
```

**Erros:**
- `404 Not Found` - Usuário não encontrado
- `400 Bad Request` - Dados inválidos
- `422 Unprocessable Entity` - Validação falhou

**Parâmetros:**
- `id` (path) - ID do usuário (obrigatório)

---

### DELETE /users/{id}
Deleta um usuário da aplicação.

**Request:**
```bash
curl -X DELETE "http://localhost:8000/users/1" \
  -H "Content-Type: application/json"
```

**Response (200 - Sucesso):**
```json
{
  "message": "Usuário deletado com sucesso"
}
```

**Erros:**
- `404 Not Found` - Usuário não encontrado

**Parâmetros:**
- `id` (path) - ID do usuário (obrigatório)

---

## 📁 Categorias

### GET /categories/
Lista todas as categorias.

**Request:**
```bash
curl -X GET "http://localhost:8000/categories/" \
  -H "Content-Type: application/json"
```

**Response (200 - Sucesso):**
```json
[
  {
    "id": 1,
    "name": "Alimentação",
    "user_id": 1
  },
  {
    "id": 2,
    "name": "Transporte",
    "user_id": 1
  }
]
```

**Parâmetros:**
- Nenhum requerido

---

### POST /categories/
Cria uma nova categoria.

**Request:**
```bash
curl -X POST "http://localhost:8000/categories/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alimentação"
  }'
```

**Payload:**
```json
{
  "name": "Alimentação"
}
```

**Response (201 - Criado):**
```json
{
  "id": 1,
  "name": "Alimentação",
  "user_id": 1
}
```

**Erros:**
- `400 Bad Request` - Categoria já existe
- `422 Unprocessable Entity` - Validação falhou

**Notas:**
- Nome deve ser único
- user_id é associado automaticamente

---

### GET /categories/{id}
Obtém uma categoria específica.

**Request:**
```bash
curl -X GET "http://localhost:8000/categories/1" \
  -H "Content-Type: application/json"
```

**Response (200 - Sucesso):**
```json
{
  "id": 1,
  "name": "Alimentação",
  "user_id": 1
}
```

**Erros:**
- `404 Not Found` - Categoria não encontrada

**Parâmetros:**
- `id` (path) - ID da categoria (obrigatório)

---

### PUT /categories/{id}
Atualiza uma categoria.

**Request:**
```bash
curl -X PUT "http://localhost:8000/categories/1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Comida"
  }'
```

**Payload:**
```json
{
  "name": "Comida"
}
```

**Response (200 - Sucesso):**
```json
{
  "id": 1,
  "name": "Comida",
  "user_id": 1
}
```

**Erros:**
- `404 Not Found` - Categoria não encontrada
- `400 Bad Request` - Nome já existe
- `422 Unprocessable Entity` - Validação falhou

**Parâmetros:**
- `id` (path) - ID da categoria (obrigatório)

---

### DELETE /categories/{id}
Deleta uma categoria.

**Request:**
```bash
curl -X DELETE "http://localhost:8000/categories/1" \
  -H "Content-Type: application/json"
```

**Response (200 - Sucesso):**
```json
{
  "message": "Categoria deletada com sucesso"
}
```

**Erros:**
- `404 Not Found` - Categoria não encontrada

**Parâmetros:**
- `id` (path) - ID da categoria (obrigatório)

---

## 💰 Transações

### GET /transactions/
Lista todas as transações.

**Request:**
```bash
curl -X GET "http://localhost:8000/transactions/" \
  -H "Content-Type: application/json"
```

**Response (200 - Sucesso):**
```json
[
  {
    "id": 1,
    "amount": 50.50,
    "date": "2025-11-22",
    "description": "Almoço",
    "category_id": 1,
    "user_id": 1
  },
  {
    "id": 2,
    "amount": 15.00,
    "date": "2025-11-23",
    "description": "Café",
    "category_id": 1,
    "user_id": 1
  }
]
```

**Parâmetros:**
- Nenhum requerido

---

### POST /transactions/
Cria uma nova transação.

**Request:**
```bash
curl -X POST "http://localhost:8000/transactions/" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50.50,
    "date": "2025-11-22",
    "description": "Almoço no restaurante",
    "category_id": 1
  }'
```

**Payload:**
```json
{
  "amount": 50.50,
  "date": "2025-11-22",
  "description": "Almoço no restaurante",
  "category_id": 1
}
```

**Response (201 - Criado):**
```json
{
  "id": 1,
  "amount": 50.50,
  "date": "2025-11-22",
  "description": "Almoço no restaurante",
  "category_id": 1,
  "user_id": 1
}
```

**Erros:**
- `404 Not Found` - Categoria não encontrada
- `400 Bad Request` - Valor negativo ou dados inválidos
- `422 Unprocessable Entity` - Validação falhou

**Validações:**
- amount deve ser positivo
- category_id deve existir
- description é obrigatório
- date é obrigatório

---

### GET /transactions/{id}
Obtém uma transação específica.

**Request:**
```bash
curl -X GET "http://localhost:8000/transactions/1" \
  -H "Content-Type: application/json"
```

**Response (200 - Sucesso):**
```json
{
  "id": 1,
  "amount": 50.50,
  "date": "2025-11-22",
  "description": "Almoço no restaurante",
  "category_id": 1,
  "user_id": 1
}
```

**Erros:**
- `404 Not Found` - Transação não encontrada

**Parâmetros:**
- `id` (path) - ID da transação (obrigatório)

---

### PUT /transactions/{id}
Atualiza uma transação.

**Request:**
```bash
curl -X PUT "http://localhost:8000/transactions/1" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 60.00,
    "date": "2025-11-22",
    "description": "Almoço atualizado",
    "category_id": 1
  }'
```

**Payload:**
```json
{
  "amount": 60.00,
  "date": "2025-11-22",
  "description": "Almoço atualizado",
  "category_id": 1
}
```

**Response (200 - Sucesso):**
```json
{
  "id": 1,
  "amount": 60.00,
  "date": "2025-11-22",
  "description": "Almoço atualizado",
  "category_id": 1,
  "user_id": 1
}
```

**Erros:**
- `404 Not Found` - Transação ou categoria não encontrada
- `400 Bad Request` - Valor negativo ou dados inválidos
- `422 Unprocessable Entity` - Validação falhou

**Parâmetros:**
- `id` (path) - ID da transação (obrigatório)

---

### DELETE /transactions/{id}
Deleta uma transação.

**Request:**
```bash
curl -X DELETE "http://localhost:8000/transactions/1" \
  -H "Content-Type: application/json"
```

**Response (200 - Sucesso):**
```json
{
  "message": "Transação deletada com sucesso"
}
```

**Erros:**
- `404 Not Found` - Transação não encontrada

**Parâmetros:**
- `id` (path) - ID da transação (obrigatório)

---

## ❤️ Health Check

### GET /
Verifica o status da API.

**Request:**
```bash
curl -X GET "http://localhost:8000/"
```

**Response (200 - Online):**
```json
{
  "message": "Finance App API está funcionando!",
  "status": "online",
  "documentation": "/docs",
  "endpoints": {
    "auth": "/auth",
    "users": "/users",
    "categories": "/categories",
    "transactions": "/transactions"
  }
}
```

---

## 📊 Códigos de Status

| Código | Significado | Descrição |
|--------|-----------|-----------|
| **200** | OK | Requisição bem-sucedida |
| **201** | Created | Recurso criado com sucesso |
| **400** | Bad Request | Dados inválidos ou duplicados |
| **401** | Unauthorized | Credenciais incorretas |
| **404** | Not Found | Recurso não encontrado |
| **422** | Unprocessable Entity | Validação de dados falhou |
| **500** | Internal Server Error | Erro no servidor |

---

## ⚠️ Tratamento de Erros

### Erro de Validação (400)
```json
{
  "detail": [
    {
      "loc": ["body", "username"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### Erro de Autenticação (401)
```json
{
  "detail": "Senha incorreta"
}
```

### Recurso Não Encontrado (404)
```json
{
  "detail": "Categoria não encontrada"
}
```

### Duplicação (400)
```json
{
  "detail": "Categoria com este nome já existe"
}
```

---

## 🧪 Testando a API

### Com Swagger UI (Recomendado)
```
http://localhost:8000/docs
```

### Com ReDoc
```
http://localhost:8000/redoc
```

### Com cURL (Exemplos acima)

### Com Python Requests
```python
import requests

# Register
response = requests.post('http://localhost:8000/auth/register', 
    json={'username': 'joao', 'password': 'senha123'})
print(response.json())

# Login
response = requests.post('http://localhost:8000/auth/login',
    json={'username': 'joao', 'password': 'senha123'})
print(response.json())

# Get categories
response = requests.get('http://localhost:8000/categories/')
print(response.json())
```

### Com JavaScript/Fetch
```javascript
// Register
fetch('http://localhost:8000/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    username: 'joao', 
    password: 'senha123' 
  })
})
.then(res => res.json())
.then(data => console.log(data))
```

---

## 🔧 Configuração

### Variáveis de Ambiente
```env
DATABASE_URL=sqlite:///./finance.db
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Headers Recomendados
```
Content-Type: application/json
Accept: application/json
```

---

## 📊 Resumo dos Endpoints

| Método | Endpoint | Descrição | Status |
|--------|----------|-----------|--------|
| POST | /auth/register | Registrar usuário | ✅ |
| POST | /auth/login | Fazer login | ✅ |
| GET | /users/ | Listar usuários | ✅ |
| GET | /users/{id} | Obter usuário | ✅ |
| PUT | /users/{id} | Atualizar usuário | ✅ |
| DELETE | /users/{id} | Deletar usuário | ✅ |
| GET | /categories/ | Listar categorias | ✅ |
| POST | /categories/ | Criar categoria | ✅ |
| GET | /categories/{id} | Obter categoria | ✅ |
| PUT | /categories/{id} | Atualizar categoria | ✅ |
| DELETE | /categories/{id} | Deletar categoria | ✅ |
| GET | /transactions/ | Listar transações | ✅ |
| POST | /transactions/ | Criar transação | ✅ |
| GET | /transactions/{id} | Obter transação | ✅ |
| PUT | /transactions/{id} | Atualizar transação | ✅ |
| DELETE | /transactions/{id} | Deletar transação | ✅ |
| GET | / | Health check | ✅ |

**Total: 18 endpoints ✅**

---

## 📝 Notas Importantes

### Autenticação
- Atualmente a API usa autenticação básica (username/password)
- Recomenda-se implementar JWT tokens para produção
- Senhas são hashed com PBKDF2 (develop only - usar bcrypt em produção)

### Database
- Desenvolvimento: SQLite (finance.db)
- Produção: Migrar para PostgreSQL

### CORS
- Configurado para `localhost:3000` e `localhost:3001`
- Modificar em `backend/app/main.py` para produção

### Validações
- Todos os campos obrigatórios são validados
- Valores numéricos são verificados
- Relacionamentos (FK) são validados

---

## 🚀 Próximos Passos

1. Implementar autenticação JWT
2. Adicionar paginação aos endpoints GET
3. Adicionar filtros e busca
4. Implementar rate limiting
5. Adicionar logs estruturados

---

**Versão**: 1.0.0  
**Última Atualização**: 23 de Novembro de 2025  
**Status**: ✅ Produção-ready
