# 🎨 Guia de Integração - Sistema de Sugestões no Frontend

## 📋 Visão Geral

Este guia mostra como integrar os 3 sistemas de sugestões no frontend:
1. ✅ Sugestões de **Contas**
2. ✅ Sugestões de **Categorias**
3. ✅ Sugestões de **Descrições de Transações** ← **NOVO!**

## 🚀 Endpoints Disponíveis

| Recurso | Endpoint | Filtros |
|---------|----------|---------|
| Contas | `GET /accounts/suggestions` | `limit` |
| Categorias | `GET /categories/suggestions` | `limit` |
| Descrições | `GET /transactions/suggestions/descriptions` | `transaction_type`, `category_id`, `limit` |

## 💡 Exemplo Completo - Formulário de Nova Transação

### React + TypeScript

```tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface TransactionFormProps {
  onSubmit: (transaction: Transaction) => void;
}

export function TransactionForm({ onSubmit }: TransactionFormProps) {
  // Estados do formulário
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [accountId, setAccountId] = useState<number | null>(null);

  // Sugestões
  const [descriptionSuggestions, setDescriptionSuggestions] = useState<string[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
  const [accountSuggestions, setAccountSuggestions] = useState<string[]>([]);

  // Loading states
  const [loadingDescriptions, setLoadingDescriptions] = useState(false);

  // ========================================
  // 1. BUSCAR SUGESTÕES DE DESCRIÇÃO
  // ========================================
  useEffect(() => {
    async function fetchDescriptionSuggestions() {
      setLoadingDescriptions(true);
      try {
        const params = new URLSearchParams({
          transaction_type: transactionType,
          ...(categoryId && { category_id: categoryId.toString() }),
          limit: '10'
        });

        const response = await axios.get(
          `/transactions/suggestions/descriptions?${params}`
        );
        setDescriptionSuggestions(response.data);
      } catch (error) {
        console.error('Erro ao buscar sugestões de descrição:', error);
      } finally {
        setLoadingDescriptions(false);
      }
    }

    fetchDescriptionSuggestions();
  }, [transactionType, categoryId]); // Recarrega quando tipo ou categoria mudar

  // ========================================
  // 2. BUSCAR SUGESTÕES DE CATEGORIA
  // ========================================
  useEffect(() => {
    async function fetchCategorySuggestions() {
      try {
        const response = await axios.get('/categories/suggestions?limit=10');
        setCategorySuggestions(response.data);
      } catch (error) {
        console.error('Erro ao buscar sugestões de categoria:', error);
      }
    }

    fetchCategorySuggestions();
  }, []);

  // ========================================
  // 3. BUSCAR SUGESTÕES DE CONTA
  // ========================================
  useEffect(() => {
    async function fetchAccountSuggestions() {
      try {
        const response = await axios.get('/accounts/suggestions?limit=10');
        setAccountSuggestions(response.data);
      } catch (error) {
        console.error('Erro ao buscar sugestões de conta:', error);
      }
    }

    fetchAccountSuggestions();
  }, []);

  // ========================================
  // RENDERIZAÇÃO
  // ========================================
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({...}); }}>
      {/* Tipo de Transação */}
      <div className="form-group">
        <label>Tipo</label>
        <select
          value={transactionType}
          onChange={(e) => setTransactionType(e.target.value as 'income' | 'expense')}
        >
          <option value="expense">Despesa</option>
          <option value="income">Receita</option>
        </select>
      </div>

      {/* Valor */}
      <div className="form-group">
        <label>Valor</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value))}
          placeholder="0.00"
        />
      </div>

      {/* Data */}
      <div className="form-group">
        <label>Data</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* Categoria com Sugestões */}
      <div className="form-group">
        <label>Categoria</label>
        <input
          type="text"
          list="category-suggestions"
          placeholder="Digite ou escolha uma categoria"
        />
        <datalist id="category-suggestions">
          {categorySuggestions.map((suggestion, index) => (
            <option key={index} value={suggestion} />
          ))}
        </datalist>
      </div>

      {/* Conta com Sugestões */}
      <div className="form-group">
        <label>Conta</label>
        <input
          type="text"
          list="account-suggestions"
          placeholder="Digite ou escolha uma conta"
        />
        <datalist id="account-suggestions">
          {accountSuggestions.map((suggestion, index) => (
            <option key={index} value={suggestion} />
          ))}
        </datalist>
      </div>

      {/* Descrição com Sugestões INTELIGENTES */}
      <div className="form-group">
        <label>
          Descrição
          {loadingDescriptions && <span className="loading">...</span>}
        </label>

        {/* Input com datalist nativo */}
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          list="description-suggestions"
          placeholder="Digite ou escolha uma descrição"
        />
        <datalist id="description-suggestions">
          {descriptionSuggestions.map((suggestion, index) => (
            <option key={index} value={suggestion} />
          ))}
        </datalist>

        {/* OU: Chips de quick-fill */}
        <div className="suggestion-chips">
          {descriptionSuggestions.slice(0, 5).map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setDescription(suggestion)}
              className="chip"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <button type="submit">Criar Transação</button>
    </form>
  );
}
```

## 🎨 CSS para os Chips de Sugestão

```css
.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.suggestion-chips .chip {
  padding: 6px 12px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-chips .chip:hover {
  background-color: #e0e0e0;
  border-color: #007bff;
  transform: translateY(-2px);
}

.suggestion-chips .chip:active {
  transform: translateY(0);
}

.loading {
  margin-left: 8px;
  color: #888;
  font-size: 12px;
}
```

## 🔄 Fluxo de Interação do Usuário

```
1. Usuário seleciona "Despesa" ────────┐
                                       ▼
2. Sistema busca sugestões de descrições para despesas
                                       │
3. Usuário seleciona categoria "Alimentação" ───┐
                                                 ▼
4. Sistema recarrega sugestões (agora filtradas por tipo + categoria)
                                                 │
5. Mostra: "Supermercado", "Restaurante", "Ifood", etc.
                                                 │
6. Usuário clica em "Supermercado" ─────────────┘
                                                 │
7. Campo descrição preenchido automaticamente! ✅
```

## 🌟 Variações de UX

### 1. **Dropdown com Autocomplete**
```tsx
import Autocomplete from '@mui/material/Autocomplete';

<Autocomplete
  options={descriptionSuggestions}
  value={description}
  onChange={(event, newValue) => setDescription(newValue || '')}
  renderInput={(params) => (
    <TextField {...params} label="Descrição" />
  )}
/>
```

### 2. **Chips Clicáveis Destacados**
```tsx
<div className="popular-descriptions">
  <h4>Descrições populares:</h4>
  {descriptionSuggestions.map((suggestion, index) => (
    <Chip
      key={index}
      label={suggestion}
      onClick={() => setDescription(suggestion)}
      variant={description === suggestion ? "filled" : "outlined"}
    />
  ))}
</div>
```

### 3. **Dropdown Customizado**
```tsx
{showSuggestions && descriptionSuggestions.length > 0 && (
  <div className="suggestions-dropdown">
    {descriptionSuggestions.map((suggestion, index) => (
      <div
        key={index}
        className="suggestion-item"
        onClick={() => {
          setDescription(suggestion);
          setShowSuggestions(false);
        }}
      >
        <span className="icon">💡</span>
        {suggestion}
      </div>
    ))}
  </div>
)}
```

## 📱 Versão Mobile-Friendly

```tsx
import { Swiper, SwiperSlide } from 'swiper/react';

<Swiper
  spaceBetween={10}
  slidesPerView="auto"
  className="suggestions-swiper"
>
  {descriptionSuggestions.map((suggestion, index) => (
    <SwiperSlide key={index} style={{ width: 'auto' }}>
      <button
        className="suggestion-pill"
        onClick={() => setDescription(suggestion)}
      >
        {suggestion}
      </button>
    </SwiperSlide>
  ))}
</Swiper>
```

## ⚡ Otimizações

### 1. **Debounce para Evitar Requisições Excessivas**
```tsx
import { useDebounce } from 'use-debounce';

const [debouncedType] = useDebounce(transactionType, 500);
const [debouncedCategory] = useDebounce(categoryId, 500);

useEffect(() => {
  fetchDescriptionSuggestions();
}, [debouncedType, debouncedCategory]);
```

### 2. **Cache de Sugestões**
```tsx
import { useQuery } from '@tanstack/react-query';

const { data: suggestions } = useQuery({
  queryKey: ['descriptions', transactionType, categoryId],
  queryFn: () => fetchDescriptionSuggestions(transactionType, categoryId),
  staleTime: 5 * 60 * 1000, // Cache por 5 minutos
});
```

### 3. **Prefetch ao Hover**
```tsx
<select
  onMouseEnter={() => {
    // Prefetch sugestões para o tipo oposto
    const oppositeType = transactionType === 'income' ? 'expense' : 'income';
    queryClient.prefetchQuery(['descriptions', oppositeType, categoryId]);
  }}
>
  {/* ... */}
</select>
```

## 🎯 Casos de Uso Especiais

### Mostrar Badge com Popularidade
```tsx
{descriptionSuggestions.map((suggestion, index) => (
  <button
    key={index}
    onClick={() => setDescription(suggestion)}
  >
    {suggestion}
    {index < 3 && (
      <span className="popular-badge">
        🔥 Top {index + 1}
      </span>
    )}
  </button>
))}
```

### Ícones Contextuais por Tipo
```tsx
const getIcon = (type: string) => {
  return type === 'income' ? '💰' : '💸';
};

<span className="type-icon">{getIcon(transactionType)}</span>
```

### Sugestões Diferentes por Tela
```tsx
// Dashboard: Top 5
<DescriptionSuggestions limit={5} />

// Formulário Completo: Top 15
<DescriptionSuggestions limit={15} />
```

## 📊 Analytics (Opcional)

```tsx
const handleSuggestionClick = (suggestion: string, index: number) => {
  // Aplicar sugestão
  setDescription(suggestion);

  // Track analytics
  analytics.track('suggestion_used', {
    type: 'transaction_description',
    value: suggestion,
    position: index,
    transaction_type: transactionType,
    category_id: categoryId
  });
};
```

---

**Implementado em:** 2025-12-01
**Framework:** React (adaptável para Vue, Angular, Vanilla JS)
**Status:** ✅ Pronto para integração
