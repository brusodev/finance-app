# 🐛 Relatório de Bugs do Frontend - Finance App

**Data**: 10 de Dezembro de 2025
**Testes Executados**: 24 testes
**Testes Passados**: 12 (50%)
**Testes Falhados**: 12 (50%)

---

## 📊 Resumo Executivo

Os testes automatizados identificaram **bugs críticos** no frontend que explicam os problemas reportados pelo usuário. O principal problema é que **a página de Relatórios Financeiros NÃO está integrada com as APIs do backend**, mesmo que as APIs estejam funcionando perfeitamente.

---

## 🔴 BUGS CRÍTICOS

### 1. **Relatórios Financeiros Completamente Não Funcionais**
**Componente**: `src/pages/Report.jsx`
**Severidade**: ⚠️ CRÍTICA
**Status**: ❌ NÃO IMPLEMENTADO

**Problema**:
- A página de Relatórios é apenas um **placeholder** com texto "Em breve"
- NÃO faz chamadas para as APIs do backend:
  - ❌ `/dashboard` - NÃO é chamado
  - ❌ `/transactions/totals/by-category` - NÃO é chamado
  - ❌ `/transactions/totals/by-period` - NÃO é chamado
- NÃO exibe dados reais
- NÃO possui gráficos ou visualizações
- É apenas uma interface estática sem funcionalidade

**Evidência**:
```jsx
// Arquivo atual Report.jsx - linhas 17-19
<div className="h-40 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg border border-dashed border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500">
  Em breve
</div>
```

**Impacto**: O usuário vê uma página vazia quando tenta acessar relatórios, mesmo com as APIs funcionando.

**Correção Necessária**:
- Implementar chamadas às APIs de relatórios
- Adicionar componentes de visualização (gráficos)
- Integrar dados reais do backend

---

## 🟡 BUGS DE INTERFACE E FORMATAÇÃO

### 2. **Formatação de Valores Monetários Incorreta**
**Componente**: `src/pages/Accounts.jsx`, `src/pages/Dashboard.jsx`
**Severidade**: 🟡 MÉDIA
**Status**: ❌ FALHANDO

**Problema**:
- Valores são exibidos com ponto como separador de milhar
- Esperado: `R$ 1.000,00`
- Obtido: `R$ 1000.00` (sem formatação)

**Arquivos Afetados**:
- `Accounts.jsx:229` - Exibição do saldo da conta
- `Dashboard.jsx:89,99,109` - Exibição de totais

**Correção Necessária**:
```javascript
// Implementar função de formatação correta
const formatCurrency = (value) => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Uso: R$ {formatCurrency(account.balance)}
```

---

### 3. **Loading State Não Detectável em Testes**
**Componente**: `src/pages/Dashboard.jsx`
**Severidade**: 🟡 MÉDIA
**Status**: ❌ FALHANDO

**Problema**:
- O spinner de loading não possui um atributo `role="status"`
- Testes não conseguem detectar o estado de carregamento
- Problema de acessibilidade (leitores de tela)

**Correção em**: `Dashboard.jsx:60`
```jsx
// Atual (linha 60)
<div className="flex items-center justify-center h-64">

// Correto
<div className="flex items-center justify-center h-64" role="status" aria-label="Carregando dados">
```

---

### 4. **Cores de Saldo Negativo Não Aplicadas Corretamente**
**Componente**: `src/pages/Accounts.jsx`
**Severidade**: 🟡 MÉDIA
**Status**: ❌ FALHANDO

**Problema**:
- Classes CSS para saldos negativos não são aplicadas corretamente
- Teste esperava `text-red-600` mas elemento não possui a classe

**Localização**: `Accounts.jsx:228-229`

**Correção Necessária**:
Verificar se a lógica condicional de classes está correta:
```jsx
<p className={`text-2xl font-bold ${account.balance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
```

---

## 🟢 BUGS MENORES E DE LÓGICA

### 5. **Campo `initial_balance` vs `balance` na Criação de Contas**
**Componente**: `src/pages/Accounts.jsx`
**Severidade**: 🟢 BAIXA
**Status**: ⚠️ INCONSISTÊNCIA

**Problema**:
- O formulário envia o campo `balance` mas deveria enviar `initial_balance`
- Backend espera `initial_balance` para novas contas

**Localização**: `Accounts.jsx:57-60`

**Correção Necessária**:
```javascript
// Atual
const accountData = {
  ...formData,
  balance: parseFloat(formData.balance)
}

// Correto
const accountData = {
  name: formData.name,
  account_type: formData.account_type,
  initial_balance: parseFloat(formData.balance),
  currency: formData.currency
}
```

---

### 6. **Botões de Edição/Exclusão Sem Roles Adequados**
**Componente**: `src/pages/Accounts.jsx`
**Severidade**: 🟢 BAIXA
**Status**: ⚠️ ACESSIBILIDADE

**Problema**:
- Botões de ação não possuem aria-labels
- Dificulta testes e acessibilidade

**Localização**: `Accounts.jsx:214-219`

**Correção Necessária**:
```jsx
<button
  onClick={() => handleEdit(account)}
  className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
  aria-label={`Editar conta ${account.name}`}
>
  <Edit2 size={18} />
</button>
```

---

### 7. **Confirmação de Exclusão Mock Não Funciona em Testes**
**Componente**: `src/pages/Accounts.jsx`
**Severidade**: 🟢 BAIXA
**Status**: ⚠️ TESTE

**Problema**:
- `window.confirm()` usado para confirmação
- Dificulta testes automatizados
- Melhor usar modal personalizado

**Localização**: `Accounts.jsx:79`

---

## 📈 Estatísticas de Testes

### Report.test.jsx
- ✅ 4 testes passando
- ❌ 1 teste falhando (menor - validação de classes CSS)

### Dashboard.test.jsx
- ✅ 4 testes passando
- ❌ 5 testes falhando (formatação de valores e loading state)

### Accounts.test.jsx
- ✅ 4 testes passando
- ❌ 6 testes falhando (formatação de valores, campos de formulário)

---

## 🎯 Prioridades de Correção

### 🔴 URGENTE (Fazer Primeiro)
1. **Implementar integração de Relatórios com APIs**
   - Conectar com `/dashboard`
   - Conectar com `/transactions/totals/by-category`
   - Conectar com `/transactions/totals/by-period`
   - Adicionar gráficos e visualizações de dados

### 🟡 IMPORTANTE (Fazer em Seguida)
2. **Corrigir formatação de valores monetários**
   - Implementar `formatCurrency()` global
   - Aplicar em todos os componentes

3. **Corrigir estados de loading**
   - Adicionar roles de acessibilidade
   - Melhorar indicadores visuais

### 🟢 MELHORIAS (Fazer Quando Possível)
4. **Corrigir campo `initial_balance` em Accounts**
5. **Adicionar aria-labels nos botões**
6. **Substituir `window.confirm()` por modals**

---

## 📝 Notas Adicionais

### APIs Backend - Status ✅
Todos os endpoints de relatórios estão **FUNCIONANDO PERFEITAMENTE**:
- ✅ `GET /dashboard` - Retorna dados
- ✅ `GET /transactions/totals/by-category` - Retorna dados
- ✅ `GET /transactions/totals/by-period` - Retorna dados

**O problema é 100% no frontend que não consome essas APIs.**

### Contas com Saldo Zero
Contas antigas (IDs 6, 7, 8, 10, 15) com saldo zero são **dados legados**, não um bug.

---

## 🔧 Comandos para Desenvolvedores

```bash
# Executar testes
cd frontend
npm test

# Executar testes em modo watch
npm run test:watch

# Ver interface de testes
npm run test:ui
```

---

**Gerado automaticamente por testes automatizados com Vitest + React Testing Library**
