# Design System — Dark Glassmorphism

Guia de referência para o tema visual da aplicação Prospera.

---

## Paleta de cores (dark mode)

| Camada | Valor | Uso |
|--------|-------|-----|
| Fundo raiz | `#000000` | `html`, `body.dark` |
| Superfície primária | `#111111` | Sidebar, modais, elementos fixos |
| Superfície secundária | `#1a1a1a` | Inputs, selects, áreas internas |
| Superfície terciária | `#2a2a2a` | Badges, tabs ativas, elementos elevados |
| Borda padrão | `white/[0.06]` | Divisores, bordas de layout |
| Borda de card | `white/[0.08]` | Cards e painéis |
| Borda de hover | `white/[0.15]` | Estado hover de cards interativos |

---

## Cards e painéis (glassmorphism)

Padrão obrigatório para qualquer card ou painel de conteúdo na aplicação:

```jsx
className="rounded-2xl border border-white/[0.08] bg-white/[0.03] dark:bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.07] hover:border-white/[0.15] transition-all duration-200"
```

Para cards **não interativos** (sem hover):

```jsx
className="rounded-2xl border border-white/[0.08] bg-white/[0.03] dark:bg-white/[0.03] backdrop-blur-sm"
```

---

## Modais

Modais usam fundo **sólido** — glassmorphism não se aplica a overlays:

```jsx
// Overlay
className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"

// Caixa do modal
className="bg-white dark:bg-[#111111] rounded-xl shadow-xl w-full max-w-md"

// Divisores internos do modal
className="border-b border-zinc-200 dark:border-white/[0.06]"
```

---

## Ícones com halo

Para cards com ícone centralizado (ex: categorias, ativos):

```jsx
// Container do ícone
className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/[0.06] group-hover:bg-white/[0.1] transition-colors duration-200"

// Ícone
className="text-3xl"
```

---

## Inputs e selects

```jsx
className="w-full px-3 py-2 border border-zinc-300 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white text-sm"
```

---

## Hovers

| Elemento | Classe |
|----------|--------|
| Botão / link de nav | `dark:hover:bg-white/[0.06]` |
| Linha de tabela | `dark:hover:bg-white/[0.04]` |
| Card interativo | `hover:bg-white/[0.07] hover:border-white/[0.15]` |
| Ação oculta (aparece no hover do pai) | `opacity-0 group-hover:opacity-100 transition-opacity duration-150` |

---

## Hierarquia de profundidade

```
#000000  ← fundo raiz (página)
  #111111  ← sidebar, modais
    #1a1a1a  ← inputs, painéis internos
      #2a2a2a  ← badges, tabs ativas
```

Cards glassmorphism (`bg-white/[0.03]`) flutuam sobre qualquer nível desta hierarquia.

---

## Bordas de divisão interna

Usar sempre `white/[0.06]` para divisores dentro de painéis, em vez de `zinc-*`:

```jsx
className="border-t border-white/[0.06]"
className="divide-y divide-white/[0.06]"
```

---

## Configurações globais (não alterar)

- `frontend/index.html` — `theme-color` e `background-color` pré-JS
- `frontend/src/index.css` — `html { background-color: #000 }`, `color-scheme: dark`
- `frontend/tailwind.config.js` — paleta `dark.*` customizada
- `frontend/src/components/Layout.jsx` — `dark:bg-black` no wrapper raiz
- `frontend/src/components/Sidebar.jsx` — `dark:bg-[#111111]`
