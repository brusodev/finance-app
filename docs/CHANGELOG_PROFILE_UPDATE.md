# Changelog - Atualização de Perfil e Novos Campos

## Resumo das Alterações

Este documento descreve as melhorias implementadas no sistema de perfil de usuário do Finance App.

## 🔧 Problema Resolvido

**Erro 422 ao Atualizar Perfil**
- O endpoint `/users/profile` não estava usando autenticação
- Validação incorreta de campos vazios no CRUD
- Faltava endpoint GET para obter dados do perfil

## ✨ Novos Recursos

### 1. Campos Adicionais no Perfil

Adicionados os seguintes campos ao perfil do usuário:

- **CPF**: Documento de identificação (formato: 000.000.000-00)
- **Telefone**: Número de contato (formato: (00) 00000-0000)
- **Data de Nascimento**: Campo de data
- **Endereço**: Campo de texto para endereço completo

### 2. Backend

#### Modelo de Dados (`models.py`)
```python
class User(Base):
    # ... campos existentes ...
    cpf = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    birth_date = Column(Date, nullable=True)
    address = Column(String, nullable=True)
```

#### Schemas (`schemas.py`)
- Atualizado `User` schema com novos campos
- Atualizado `UserUpdate` schema com novos campos opcionais

#### Rotas (`routes/users.py`)
- ✅ Adicionado autenticação ao `PUT /users/profile`
- ✅ Criado `GET /users/profile` para obter dados do usuário autenticado
- ✅ Usa `current_user` do token de autenticação

#### CRUD (`crud.py`)
- Validação corrigida: `if field is not None:` ao invés de `if field:`
- Suporte para atualização de todos os novos campos

### 3. Frontend

#### Página de Perfil (`Profile.jsx`)
- Layout responsivo com grid 2 colunas (desktop)
- Novos campos de formulário:
  - Nome Completo
  - Email
  - CPF (máximo 14 caracteres)
  - Telefone
  - Data de Nascimento (input type="date")
  - Endereço (textarea com 3 linhas)
- Melhor tratamento de erros
- Persistência no localStorage após atualização

#### Sidebar (`Sidebar.jsx`)
- Seção de perfil do usuário com avatar
- Avatar circular ou iniciais do usuário
- Nome completo e email exibidos
- Link clicável para página de perfil
- Design mobile-first responsivo

### 4. Migração de Banco de Dados

#### Script de Migração (`migrate_user_fields.py`)
- Adiciona colunas automaticamente ao banco existente
- Compatível com SQLite e PostgreSQL
- Execução automática no deploy do Railway
- Execução no `start.sh` local

#### Configuração de Deploy
- `nixpacks.toml`: Fase de setup para executar migrações
- `start.sh`: Executa migrações antes de iniciar servidor

## 🚀 Como Usar

### Atualização Local

1. Execute a migração:
```bash
cd backend
python migrate_user_fields.py
```

2. Inicie o servidor:
```bash
./start.sh
```

### Deploy no Railway

As migrações são executadas automaticamente durante o deploy. Não é necessária ação manual.

## 📝 Endpoints da API

### GET /users/profile
Obtém dados do perfil do usuário autenticado

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "id": 1,
  "username": "usuario",
  "email": "usuario@email.com",
  "full_name": "Nome Completo",
  "avatar": "data:image/...",
  "cpf": "123.456.789-00",
  "phone": "(11) 98765-4321",
  "birth_date": "1990-01-01",
  "address": "Rua Example, 123 - São Paulo, SP"
}
```

### PUT /users/profile
Atualiza perfil do usuário autenticado

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "email": "novo@email.com",
  "full_name": "Novo Nome",
  "avatar": "data:image/...",
  "cpf": "123.456.789-00",
  "phone": "(11) 98765-4321",
  "birth_date": "1990-01-01",
  "address": "Novo endereço"
}
```

## 🎨 Interface do Usuário

### Sidebar
- Avatar circular com borda azul
- Iniciais do usuário caso não tenha avatar
- Nome e email com truncate para textos longos
- Hover com mudança de cor
- Click redireciona para perfil

### Página de Perfil
- Layout responsivo (mobile-first)
- 1 coluna em mobile
- 2 colunas em desktop (md:grid-cols-2)
- Campo de endereço ocupa linha inteira
- Botão de salvar com ícone e loading state

## 🔒 Segurança

- Todos os endpoints de perfil requerem autenticação
- Token JWT validado em cada requisição
- Campos opcionais - nenhum campo é obrigatório
- Validação de tipos no Pydantic

## 📊 Compatibilidade

- SQLite: ✅ Totalmente compatível
- PostgreSQL: ✅ Totalmente compatível
- Railway Deploy: ✅ Migração automática
- Local Development: ✅ Script de migração incluído

## 🐛 Problemas Resolvidos

1. ✅ Erro 422 ao atualizar perfil
2. ✅ Falta de autenticação no endpoint
3. ✅ Validação incorreta de campos vazios
4. ✅ Impossibilidade de obter dados do perfil
5. ✅ Falta de campos importantes (CPF, telefone, etc)

## 📦 Commits Relacionados

- `fix: Corrigir URLs hardcoded nas páginas do frontend`
- `feat: Implementar atualização de perfil e visualização de avatar`
- `feat: Adicionar campos extras ao perfil do usuário`
- `feat: Adicionar migração automática ao deploy`

---

**Data:** 29/11/2025
**Versão:** 2.0.0
**Desenvolvido com:** Claude Code 🤖
