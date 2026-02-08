# 📈 Prospera

Sistema completo de gestão financeira pessoal com controle de contas, transações, categorias, transferências e investimentos.

## ✨ Funcionalidades

### 📊 Gestão Financeira
- **Dashboard Interativo** - Visão geral com gráficos e estatísticas
- **Contas Bancárias** - Gerenciamento de múltiplas contas com diferentes moedas (BRL, USD, EUR)
- **Categorias Personalizadas** - Organize receitas e despesas com ícones coloridos
- **Transações** - Registro completo de movimentações financeiras
- **Transferências entre Contas** - Movimente valores entre suas contas facilmente

### 📈 Investimentos
- **Dashboard de Investimentos** - Visão geral do portfólio com cards de resumo
- **Gestão de Ativos** - Cadastre e gerencie seus investimentos:
  - Tesouro Direto
  - CDB
  - ETF
  - FII (Fundos Imobiliários)
  - Ações
  - Criptomoedas
  - Outros ativos
- **Movimentações de Investimentos** - Registre:
  - Aportes
  - Resgates
  - Rendimentos
  - Taxas
- **Planejamento de Metas** - Configure metas personalizadas:
  - Valor alvo personalizado
  - Prazo flexível
  - Estratégia escada (aportes crescentes ao longo do tempo)
  - Taxa de retorno mensal
  - Múltiplos períodos de contribuição
- **Simulador Financeiro** - Projeções com juros compostos
- **Acompanhamento de Progresso** - Gráficos de evolução e projeções

### 📱 Análise e Relatórios
- **Relatórios Detalhados** - Análise por categorias com gráficos
- **Histórico de Transações** - Filtros avançados e busca
- **Gráficos Interativos** - Visualização clara dos dados financeiros

### 🎨 Interface
- **Dark Mode** - Tema claro e escuro
- **Responsivo** - Funciona perfeitamente em desktop e mobile
- **Sidebar Colapsável** - Menu lateral com submenu para investimentos
- **Componentes Modernos** - Interface limpa com Tailwind CSS e Lucide Icons

### 🔐 Autenticação e Perfil
- **Sistema de Login Seguro** - Autenticação com JWT
- **Perfil de Usuário** - Dados pessoais e avatar
- **Configurações** - Personalização de moeda e preferências

---

## 🚀 Deploy Rápido no Railway

**Frontend + Backend + PostgreSQL tudo no Railway!**

📖 Guia completo passo a passo: **[DEPLOY_RAILWAY_COMPLETO.md](DEPLOY_RAILWAY_COMPLETO.md)**

Tempo estimado: **15-20 minutos**

---

## 🏃 Executar Localmente

### Pré-requisitos
- Python 3.9+
- Node.js 16+
- PostgreSQL 13+

### Backend
```bash
cd backend
./start.sh
```

O backend estará disponível em `http://localhost:8000`
Documentação da API: `http://localhost:8000/docs`

### Frontend
```bash
cd frontend
./start.sh
```

O frontend estará disponível em `http://localhost:5173`

**Login padrão:** `bruno` / `123456`

---

## 🛠️ Tecnologias

### Backend
- **FastAPI** - Framework web moderno e rápido
- **SQLAlchemy** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação segura
- **Pydantic** - Validação de dados

### Frontend
- **React 18** - Biblioteca UI
- **Vite** - Build tool ultrarrápido
- **Tailwind CSS** - Framework CSS utilitário
- **Lucide Icons** - Ícones modernos
- **React Router** - Navegação SPA
- **Context API** - Gerenciamento de estado

---

## 📚 Documentação

- **[Deploy Railway Completo](DEPLOY_RAILWAY_COMPLETO.md)** ⭐ - Frontend + Backend no Railway
- [Deploy Railway Alternativo](DEPLOY_RAILWAY.md) - Railway + Vercel separados
- [Deploy em VPS](DEPLOY_VPS.md) - Nginx + PostgreSQL em servidor próprio
- [Configurar Rede Local](CONFIGURAR_REDE.md) - Desenvolvimento em rede/VPN
- [Comandos Rápidos](COMANDOS_RAPIDOS.md) - Referência de comandos úteis

---

## 📂 Estrutura do Projeto

```
finance-app/
├── backend/
│   ├── app/
│   │   ├── routes/          # Endpoints da API
│   │   │   ├── auth.py      # Autenticação
│   │   │   ├── users.py     # Usuários
│   │   │   ├── accounts.py  # Contas bancárias
│   │   │   ├── categories.py # Categorias
│   │   │   ├── transactions.py # Transações
│   │   │   ├── transfers.py  # Transferências
│   │   │   └── investments.py # Investimentos
│   │   ├── models.py        # Modelos do banco
│   │   ├── schemas.py       # Schemas Pydantic
│   │   ├── crud.py          # Operações CRUD
│   │   ├── simulation.py    # Simulação de investimentos
│   │   ├── database.py      # Configuração do DB
│   │   └── main.py          # App principal
│   └── start.sh
├── frontend/
│   ├── src/
│   │   ├── pages/           # Páginas da aplicação
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Accounts.jsx
│   │   │   ├── Categories.jsx
│   │   │   ├── Transactions.jsx
│   │   │   ├── NewTransaction.jsx
│   │   │   ├── Transfers.jsx
│   │   │   ├── Investments.jsx
│   │   │   ├── InvestmentAssets.jsx
│   │   │   ├── InvestmentTransactions.jsx
│   │   │   ├── InvestmentGoal.jsx
│   │   │   ├── Report.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── Settings.jsx
│   │   ├── components/      # Componentes reutilizáveis
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── ...
│   │   ├── context/         # Context API
│   │   │   ├── AuthContext.jsx
│   │   │   └── TransactionContext.jsx
│   │   ├── services/        # Integração API
│   │   │   └── api.jsx
│   │   └── utils/           # Utilitários
│   │       └── formatters.js
│   └── start.sh
└── README.md
```

---

## 🎯 Próximos Passos

- [ ] Importação de OFX/CSV
- [ ] Notificações de vencimento
- [ ] Metas de gastos por categoria
- [ ] Relatórios PDF
- [ ] Aplicativo mobile (React Native)
- [ ] Integração com APIs bancárias
- [ ] Backup automático

---

## 📝 Licença

Este projeto é de código aberto para uso pessoal e educacional.

---

## 🤝 Contribuindo

Sugestões e melhorias são bem-vindas! Sinta-se à vontade para:
1. Fazer fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abrir um Pull Request

---

**Prospera - Desenvolvido com ❤️ usando FastAPI + React**

**Desenvolvido por Bruno Vargas em 2026.**