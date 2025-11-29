# 🧪 Guia de Teste - Componentes Frontend (B2)

**Data**: 23 de Novembro de 2024  
**Status**: ✅ Pronto para Testes

## 🚀 Como Testar

### 1. Iniciar o Backend
```powershell
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Iniciar o Frontend
```powershell
cd frontend
npm install  # Se não tiver rodado antes
npm run dev
```

Acesso em: `http://localhost:3001`

---

## 📝 Fluxo de Testes Recomendado

### Test 1: Registro de Novo Usuário ✅

**Passos:**
1. Acessar `http://localhost:3001`
2. Clique em "Cadastre-se aqui" (ou vá para `/register`)
3. Preencha:
   - Username: `testuser123`
   - Senha: `senha123`
   - Confirmar: `senha123`
4. Clique em "Registrar"

**Resultado Esperado:**
- ✅ Sem erros
- ✅ Redirecionado para `/login`
- ✅ Usuário criado no banco

**Se der erro:**
```
- "Username already exists" → Usar outro username
- "Password too short" → Usar senha com 6+ caracteres
- Erro de conexão → Verificar se backend está rodando
```

---

### Test 2: Login com Usuário ✅

**Passos:**
1. Estar em `/login`
2. Preencha:
   - Username: `testuser123`
   - Senha: `senha123`
3. Clique em "Entrar"

**Resultado Esperado:**
- ✅ Redirecionado para `/dashboard`
- ✅ Token armazenado em localStorage
- ✅ Dados do usuário visíveis

**Debug:**
- Abrir DevTools (F12) → Console
- Verificar: `localStorage.getItem('user')`
- Deve retornar JSON com token

---

### Test 3: Dashboard Carregamento ✅

**Passos:**
1. Após login, estar em `/dashboard`
2. Aguardar carregamento

**Resultado Esperado:**
- ✅ Cards aparecem: Saldo, Receitas, Despesas
- ✅ Valores iniciais: 0.00 (sem transações)
- ✅ Botão "+ Adicionar Transação" visível
- ✅ Tabela vazia com mensagem "Nenhuma transação registrada"

---

### Test 4: Adicionar Primeira Transação ✅

**Passos:**
1. Em `/dashboard`, clique "+ Adicionar Transação"
2. Preencha o formulário:
   - Valor: `100.00`
   - Data: `23/11/2024` (hoje)
   - Categoria: Selecione uma disponível
   - Descrição: "Salário do mês"
3. Clique "Adicionar"

**Resultado Esperado:**
- ✅ Formulário fecha
- ✅ Transação aparece na tabela
- ✅ Card "Receitas" atualiza para R$ 100,00
- ✅ Card "Saldo Total" atualiza para R$ 100,00
- ✅ Tabela ordena por data (mais recente primeiro)

---

### Test 5: Adicionar Despesa ✅

**Passos:**
1. Clique "+ Adicionar Transação"
2. Preencha:
   - Valor: `-50.00` (valor negativo!)
   - Data: `23/11/2024`
   - Categoria: Alimentação (ou outra)
   - Descrição: "Mercado"
3. Clique "Adicionar"

**Resultado Esperado:**
- ✅ Transação aparece em vermelho
- ✅ Valor mostra como "- R$ 50,00"
- ✅ Card "Despesas" atualiza para R$ 50,00
- ✅ Card "Saldo Total" atualiza para R$ 50,00

---

### Test 6: Editar Transação ✅

**Passos:**
1. Na tabela, clique "Editar" em qualquer transação
2. Formulário abre com dados preenchidos
3. Mude algo:
   - Valor para `150.00`
   - Descrição para "Salário corrigido"
4. Clique "Atualizar"

**Resultado Esperado:**
- ✅ Formulário fecha
- ✅ Transação atualiza na tabela
- ✅ Valores nos cards atualizam
- ✅ Descrição reflete a mudança

---

### Test 7: Deletar Transação ✅

**Passos:**
1. Na tabela, clique "Deletar" em qualquer transação
2. Confirme no diálogo "Tem certeza..."
3. Transação é removida

**Resultado Esperado:**
- ✅ Transação desaparece da tabela
- ✅ Valores nos cards atualizam
- ✅ Total de transações diminui no rodapé

---

### Test 8: Validações do Formulário ✅

**Teste 1: Campo vazio**
- Deixar "Valor" em branco
- Clicar "Adicionar"
- ✅ Erro: "Todos os campos são obrigatórios"

**Teste 2: Valor inválido**
- Preencher Valor com "ABC"
- Clicar "Adicionar"
- ✅ Erro: "Valor deve ser um número válido"

**Teste 3: Categoria não selecionada**
- Deixar Categoria como "Selecione uma categoria"
- Clicar "Adicionar"
- ✅ Erro: "Todos os campos são obrigatórios"

---

### Test 9: Logout (Proteção de Rota) ✅

**Passos:**
1. Abrir DevTools → Console
2. Executar: `localStorage.removeItem('user')`
3. Recarregar a página (F5)

**Resultado Esperado:**
- ✅ Redirecionado automaticamente para `/login`
- ✅ Dados do dashboard não carregam
- ✅ Proteção de rota funciona

---

### Test 10: Responsividade Mobile ✅

**Passos:**
1. Em `/dashboard`, abrir DevTools (F12)
2. Ativar modo mobile (Ctrl+Shift+M)
3. Redimensionar para 375px largura
4. Verificar:
   - Cards em 1 coluna
   - Tabela scrollável horizontal
   - Botões legíveis

**Resultado Esperado:**
- ✅ Layout adapta para mobile
- ✅ Sem overflow/quebra
- ✅ Tudo clicável

---

## 🐛 Troubleshooting

### Erro: "Cannot GET /dashboard"
**Causa:** React Router não está funcionando  
**Solução:**
```powershell
cd frontend
npm install
npm run dev
```

### Erro: "Failed to fetch categories"
**Causa:** Backend não está rodando  
**Solução:**
```powershell
cd backend
python -m uvicorn app.main:app --reload
```

### Erro: "CORS error"
**Causa:** Backend CORS não permitir localhost:3001  
**Verificar** `backend/app/main.py`:
```python
allow_origins=["http://localhost:3000", "http://localhost:3001"]
```

### Transações não aparecem
**Causa:** Categorias não existem  
**Solução:** Criar categorias via API:
```bash
curl -X POST http://localhost:8000/categories/ \
  -H "Content-Type: application/json" \
  -d '{"name": "Alimentação"}'
```

### localStorage vazio após registro
**Causa:** authAPI não chamou login após register  
**Verificar:** `frontend/src/services/api.js` linha ~40

---

## 📊 Checklist de Testes

| Teste | Status | Data |
|-------|--------|------|
| Registro | ⏳ TODO | |
| Login | ⏳ TODO | |
| Dashboard | ⏳ TODO | |
| Adicionar Receita | ⏳ TODO | |
| Adicionar Despesa | ⏳ TODO | |
| Editar | ⏳ TODO | |
| Deletar | ⏳ TODO | |
| Validações | ⏳ TODO | |
| Logout/Rota | ⏳ TODO | |
| Mobile | ⏳ TODO | |

---

## 💡 Dicas para Debug

### 1. Verificar Requisições HTTP
```javascript
// DevTools → Network
// Filter: Fetch/XHR
// Verificar status 200/201 nas requisições
```

### 2. Verificar localStorage
```javascript
// DevTools → Console
console.log(localStorage.getItem('user'))
console.log(JSON.parse(localStorage.getItem('user')))
```

### 3. Verificar API Responses
```javascript
// DevTools → Console → Network
// Clicar em requisição → Response
// Ver JSON retornado
```

### 4. Ativar Logs da Aplicação
```javascript
// Adicionar em Login.jsx/Register.jsx/Dashboard.jsx
console.log('API Response:', user)
console.log('Error:', err.response?.data)
```

---

## 🎯 Critérios de Sucesso

✅ **Componentes Funcionais:**
- [ ] Login redireciona para Dashboard
- [ ] Register cria novo usuário
- [ ] Dashboard exibe transações
- [ ] Transações CRUD completamente funcional

✅ **Validações:**
- [ ] Campos obrigatórios validados
- [ ] Erros exibidos ao usuário
- [ ] Senhas validadas no Register

✅ **Design:**
- [ ] Responsivo em mobile/desktop
- [ ] Cores consistentes
- [ ] Sem erros de layout

✅ **Integração:**
- [ ] Todas as 5 APIs funcionam
- [ ] localStorage funciona
- [ ] Proteção de rota funciona

---

## 📈 Próximas Etapas Após Testes

1. **C1: Lint & Formatting**
   - [ ] ESLint frontend
   - [ ] Prettier
   - [ ] Black/Flake8 backend

2. **C2: GitHub Actions**
   - [ ] CI/CD pipeline
   - [ ] Testes automáticos

3. **C3: Deploy**
   - [ ] Preparar produção
   - [ ] Deploy em servidor

---

**Status Atual**: Componentes implementados e prontos para teste ✅

**Próxima Ação**: Executar testes manuais seguindo este guia
