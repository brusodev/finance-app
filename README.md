# Prospera

Sistema completo de gestão financeira pessoal com controle de contas, transações, categorias, transferências, cartões de crédito e investimentos.

## Funcionalidades

### Gestão Financeira

- **Dashboard Interativo** - Visão geral com gráficos e estatísticas
- **Contas Bancárias** - Gerenciamento de múltiplas contas com diferentes moedas (BRL, USD, EUR)
- **Cartões de Crédito** - Cadastro, configuração e revisão de faturas com importação manual, CSV e OFX
- **Importações organizadas** - Histórico agrupado por mês, com lotes recolhíveis e ordenados pela atividade mais recente
- **Proteção contra duplicidade** - Bloqueia uma nova importação equivalente para a mesma conta e mês, permitindo vários lotes diferentes no mesmo mês
- **Classificação por IA** - Sugere categoria, tipo e descrição para lançamentos importados, com processamento em lotes
- **Categorias Personalizadas** - Organize receitas e despesas com ícones coloridos
- **Transações** - Registro completo de movimentações financeiras
- **Transferências entre Contas** - Movimente valores entre suas contas facilmente

### Investimentos

- **Dashboard de Investimentos** - Visão geral do portfólio com cards de resumo
- **Gestão de Ativos** - Tesouro Direto, CDB, ETF, FII, Ações, Criptomoedas
- **Movimentações** - Aportes, resgates, rendimentos e taxas
- **Planejamento de Metas** - Metas com valor alvo, prazo e taxa de retorno
- **Simulador Financeiro** - Projeções com juros compostos

### Interface

- **Dark Mode** - Tema claro e escuro
- **Responsivo** - Desktop e mobile
- **Sidebar Colapsável** - Menu lateral com submenu para investimentos

### Autenticação

- **JWT** - Autenticação segura
- **Perfil de Usuário** - Dados pessoais e preferências

### Classificação inteligente de importações

O classificador usa a API da Groq para sugerir categorias e descrições dos lançamentos.

- Classifica somente itens pendentes do lote.
- Divide lotes grandes em blocos menores e acompanha o progresso no frontend.
- Reaplica automaticamente associações já aprendidas para o mesmo estabelecimento, sem chamar a IA novamente.
- Usa classificações anteriores como exemplos para ajudar a IA em descrições novas ou ambíguas.
- A memória de classificação é registrada quando o lote é confirmado com uma categoria definida.

Configure no arquivo `.env.docker`:

```env
GROQ_API_KEY=sua-chave-groq
GROQ_MODEL=openai/gpt-oss-20b
```

O modelo precisa estar disponível para a chave utilizada. Para trocar o modelo, altere `GROQ_MODEL` e recrie o container do backend:

```bash
docker compose --env-file .env.docker up -d --build backend
```

Sem `GROQ_API_KEY`, ou quando a API estiver indisponível, os lançamentos continuam podendo ser classificados manualmente.

---

## Deploy com Docker + Cloudflare Tunnel

A stack roda localmente via Docker e é exposta publicamente via Cloudflare Tunnel — sem abrir portas no roteador ou precisar de IP fixo.

### Pré-requisitos

- Docker Desktop
- cloudflared instalado e autenticado
- Domínio no Cloudflare

### Configuração

1. Copie o arquivo de variáveis de ambiente:

```bash
cp .env.docker.example .env.docker
```

2. Edite `.env.docker` com suas credenciais.

3. Suba a stack:

```bash
docker compose --env-file .env.docker up -d --build
```

### URLs

| Serviço | URL |
|---------|-----|
| Frontend | <https://finance.projdev.site> |
| API | <https://finance-api.projdev.site> |
| API Docs | <https://finance-api.projdev.site/docs> |
| Local Frontend | <http://localhost:3000> |
| Local API | <http://localhost:8000> |

### Atualizar após mudanças no código

```bash
docker compose --env-file .env.docker up -d --build
```

### Migração de dados

Para migrar dados de outro PostgreSQL (ex: Railway):

```powershell
.\migrate_from_railway.ps1
```

---

## Executar Localmente (sem Docker)

### Pré-requisitos

- Python 3.9+
- Node.js 16+
- PostgreSQL 17+

### Backend

```bash
cd backend
./start.sh
```

### Frontend

```bash
cd frontend
./start.sh
```

Login padrão: `bruno` / `123456`

---

## Tecnologias

### Backend

- **FastAPI** - Framework web moderno e rápido
- **SQLAlchemy** - ORM para PostgreSQL
- **PostgreSQL 17** - Banco de dados relacional
- **JWT** - Autenticação segura
- **Pydantic** - Validação de dados

### Frontend

- **React 18** - Biblioteca UI
- **Vite** - Build tool
- **Tailwind CSS** - Framework CSS
- **Lucide Icons** - Ícones modernos
- **React Router** - Navegação SPA

### Infraestrutura

- **Docker + Docker Compose** - Containerização
- **Cloudflare Tunnel** - Exposição segura sem abrir portas
- **Nginx** - Servidor web para o frontend

---

## Estrutura do Projeto

```text
finance-app/
├── backend/
│   ├── app/
│   │   ├── routes/          # Endpoints da API
│   │   ├── models.py        # Modelos do banco
│   │   ├── schemas.py       # Schemas Pydantic
│   │   ├── crud.py          # Operações CRUD
│   │   ├── database.py      # Configuração do DB
│   │   └── main.py          # App principal
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── context/         # Context API
│   │   └── services/        # Integração API
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── .env.docker              # Variáveis de ambiente (não commitado)
└── migrate_from_railway.ps1 # Script de migração
```

---

## Próximos Passos

- [ ] Notificações de vencimento
- [ ] Metas de gastos por categoria
- [ ] Relatórios PDF
- [ ] Aplicativo mobile (React Native)
- [ ] Integração com APIs bancárias
- [ ] Backup automático

---

Prospera - Desenvolvido com FastAPI + React por Bruno Vargas em 2026.
