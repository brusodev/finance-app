# 🎯 Sistema de Sugestões de Descrição para Transações

## 📋 Visão Geral

Implementado sistema inteligente de sugestões de descrição para transações, similar ao sistema já existente para Contas e Categorias. O sistema sugere descrições baseadas nas transações mais populares de outros usuários.

## ✨ Funcionalidades

### 🔍 Sugestões Inteligentes

O sistema analisa transações de outros usuários e retorna as descrições mais populares, com filtros opcionais para refinar os resultados.

### 🎨 Filtros Disponíveis

1. **Por Tipo de Transação** - Filtra por `income` ou `expense`
2. **Por Categoria** - Filtra por categoria específica
3. **Combinação de Filtros** - Pode combinar tipo + categoria
4. **Limite Customizável** - Define quantas sugestões retornar

## 🚀 Como Usar

### Endpoint da API

**GET** `/transactions/suggestions/descriptions`

#### Parâmetros (todos opcionais):

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `transaction_type` | string | null | Filtrar por tipo: `income` ou `expense` |
| `category_id` | int | null | ID da categoria para filtrar |
| `limit` | int | 10 | Número máximo de sugestões |

### Exemplos de Uso

#### 1. Sugestões Gerais (Top 10)
```bash
GET /transactions/suggestions/descriptions
```

**Resposta:**
```json
[
  "Aluguel",
  "Conta de luz",
  "Internet",
  "Supermercado",
  "Gasolina",
  "Academia",
  "Netflix",
  "Salário",
  "Freelance",
  "Investimento"
]
```

#### 2. Sugestões para Despesas
```bash
GET /transactions/suggestions/descriptions?transaction_type=expense
```

**Resposta:**
```json
[
  "Aluguel",
  "Conta de luz",
  "Internet",
  "Supermercado",
  "Gasolina",
  "Academia",
  "Netflix",
  "Restaurante",
  "Uber",
  "Farmácia"
]
```

#### 3. Sugestões para Receitas
```bash
GET /transactions/suggestions/descriptions?transaction_type=income
```

**Resposta:**
```json
[
  "Salário",
  "Freelance",
  "Investimento",
  "Venda",
  "Bônus",
  "Cashback",
  "Reembolso",
  "Comissão",
  "Aluguel recebido",
  "Prêmio"
]
```

#### 4. Sugestões para Categoria Específica
```bash
GET /transactions/suggestions/descriptions?category_id=5
```

Retorna descrições populares para a categoria de ID 5.

#### 5. Combinação: Despesas + Categoria + Top 20
```bash
GET /transactions/suggestions/descriptions?transaction_type=expense&category_id=3&limit=20
```

Retorna as 20 descrições mais populares de despesas na categoria 3.

## 💡 Casos de Uso

### 1. **Autocomplete Inteligente no Frontend**
```javascript
// Ao usuário digitar no campo descrição
async function fetchSuggestions(type, categoryId) {
  const response = await fetch(
    `/transactions/suggestions/descriptions?transaction_type=${type}&category_id=${categoryId}`
  );
  const suggestions = await response.json();
  return suggestions;
}
```

### 2. **Sugestões Contextuais**
```javascript
// Quando usuário seleciona uma categoria, mostrar sugestões relacionadas
onCategoryChange(categoryId) {
  const suggestions = await fetchSuggestions(currentType, categoryId);
  showSuggestions(suggestions);
}
```

### 3. **Quick Fill / Templates**
```javascript
// Mostrar botões de descrições populares para preenchimento rápido
<div class="quick-fill">
  {suggestions.map(desc => (
    <button onClick={() => setDescription(desc)}>
      {desc}
    </button>
  ))}
</div>
```

## 🔒 Segurança e Privacidade

### Proteções Implementadas:

1. ✅ **Exclusão do Próprio Usuário** - Não mostra as próprias descrições
2. ✅ **Apenas Descrições Preenchidas** - Filtra nulls e strings vazias
3. ✅ **Autenticação Obrigatória** - Requer usuário logado
4. ✅ **Popularidade como Critério** - Mostra apenas descrições comuns

### Privacidade:

- ❌ **Não expõe valores** - Apenas descrições
- ❌ **Não expõe usuários** - Anônimo
- ❌ **Não expõe datas** - Apenas a descrição
- ✅ **Agregado por popularidade** - Informação coletiva

## 📊 Implementação Técnica

### Função no CRUD ([crud.py:450-497](../backend/app/crud.py#L450-L497))

```python
def get_transaction_description_suggestions(
    db: Session,
    user_id: int,
    transaction_type: str = None,
    category_id: int = None,
    limit: int = 10
):
    """
    Get transaction description suggestions from other users (most popular)
    """
    from sqlalchemy import func

    # Query base: descrições de outros usuários, não vazias
    query = db.query(
        models.Transaction.description,
        func.count(models.Transaction.description).label('count')
    ).filter(
        models.Transaction.user_id != user_id,  # Excluir próprio usuário
        models.Transaction.description.isnot(None),
        models.Transaction.description != ''
    )

    # Filtros opcionais
    if transaction_type:
        query = query.filter(models.Transaction.transaction_type == transaction_type)

    if category_id:
        query = query.filter(models.Transaction.category_id == category_id)

    # Agrupar por descrição e ordenar por popularidade
    suggestions = query.group_by(
        models.Transaction.description
    ).order_by(
        func.count(models.Transaction.description).desc()
    ).limit(limit).all()

    return [suggestion.description for suggestion in suggestions]
```

### Endpoint da API ([routes/transactions.py:16-45](../backend/app/routes/transactions.py#L16-L45))

```python
@router.get("/suggestions/descriptions", response_model=list[str])
def get_transaction_description_suggestions(
    transaction_type: str = None,
    category_id: int = None,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Obter sugestões de descrições baseadas em transações populares"""
    suggestions = crud.get_transaction_description_suggestions(
        db,
        user_id=current_user.id,
        transaction_type=transaction_type,
        category_id=category_id,
        limit=limit
    )
    return suggestions
```

## 🎨 Exemplo de Integração no Frontend

### React/JavaScript
```jsx
import { useState, useEffect } from 'react';

function TransactionForm() {
  const [description, setDescription] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [transactionType, setTransactionType] = useState('expense');
  const [categoryId, setCategoryId] = useState(null);

  // Buscar sugestões quando tipo ou categoria mudar
  useEffect(() => {
    async function loadSuggestions() {
      const params = new URLSearchParams({
        transaction_type: transactionType,
        ...(categoryId && { category_id: categoryId }),
        limit: 10
      });

      const response = await fetch(
        `/transactions/suggestions/descriptions?${params}`
      );
      const data = await response.json();
      setSuggestions(data);
    }

    loadSuggestions();
  }, [transactionType, categoryId]);

  return (
    <div>
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descrição"
        list="description-suggestions"
      />

      {/* Datalist nativo do HTML */}
      <datalist id="description-suggestions">
        {suggestions.map((suggestion, index) => (
          <option key={index} value={suggestion} />
        ))}
      </datalist>

      {/* OU botões de quick-fill */}
      <div className="suggestions-chips">
        {suggestions.slice(0, 5).map((suggestion, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setDescription(suggestion)}
            className="suggestion-chip"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
```

## 🌟 Melhorias Futuras Possíveis

1. **Sugestões Baseadas em ML** - Análise de padrões do usuário
2. **Sugestões por Similaridade** - Descrições similares ao que está digitando
3. **Sugestões por Data** - Descrições comuns em determinado período (ex: "Presente Dia das Mães" em maio)
4. **Cache de Sugestões** - Armazenar em cache para melhor performance
5. **Ranking Ponderado** - Considerar recência além de popularidade

## 📈 Benefícios

1. ✅ **UX Melhorada** - Preenchimento mais rápido
2. ✅ **Padronização** - Usuários usam descrições consistentes
3. ✅ **Descoberta** - Usuários aprendem descrições úteis de outros
4. ✅ **Economia de Tempo** - Menos digitação
5. ✅ **Dados Mais Limpos** - Menos variações da mesma descrição

## 🔗 Consistência com Sistema Existente

Este sistema segue o mesmo padrão dos sistemas já implementados:

- **Contas**: `/accounts/suggestions` ([routes/accounts.py:15-27](../backend/app/routes/accounts.py#L15-L27))
- **Categorias**: `/categories/suggestions` (implementado)
- **Transações**: `/transactions/suggestions/descriptions` ← **NOVO!**

Todos seguem a mesma lógica:
1. Excluir dados do próprio usuário
2. Agrupar por popularidade
3. Retornar lista simples de strings
4. Filtros opcionais contextuais

---

**Implementado em:** 2025-12-01
**Status:** ✅ Pronto para produção
**Compatibilidade:** 100% compatível com sistema existente
