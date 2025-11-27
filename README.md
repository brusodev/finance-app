# Finance App - Aplicação de Gerenciamento Financeiro Pessoal

Uma aplicação full-stack moderna para gerenciamento de finanças pessoais com interface intuitiva e recursos robustos.

## 🚀 Quick Start

### Requisitos
- **Python 3.8+**
- **Node.js 14+**
- **PostgreSQL 12+**

### Instalação Rápida

```bash
# 1. Clone o repositório
git clone <seu-repo>
cd finance-app

# 2. Execute o script de setup (Windows)
.\setup.ps1

# 3. Configure o banco de dados
createdb finance_db
# Edite backend/.env com suas credenciais

# 4. Inicie o projeto
.\run-dev.ps1
```

## 📁 Estrutura do Projeto

```
finance-app/
├── backend/                    # API FastAPI
│   ├── app/
│   │   ├── main.py            # Entrada da aplicação
│   │   ├── database.py        # Config do banco
│   │   ├── models.py          # Modelos SQLAlchemy
│   │   ├── schemas.py         # Schemas Pydantic
│   │   ├── crud.py            # Operações CRUD
│   │   ├── models/            # Modelos específicos
│   │   └── routes/            # Endpoints da API
│   ├── requirements.txt        # Dependências Python
│   └── .env                    # Variáveis de ambiente
│
├── frontend/                   # Interface React
│   ├── src/
│   │   ├── components/        # Componentes reutilizáveis
│   │   ├── pages/             # Páginas da aplicação
│   │   ├── services/          # Cliente HTTP
│   │   └── App.jsx            # Componente raiz
│   ├── package.json           # Dependências Node.js
│   └── vite.config.js         # Config do Vite
│
├── docs/                      # Documentação
│   ├── GUIA_ARQUITETURA.md
│   ├── GUIA_DESENVOLVIMENTO.md
│   └── API.md
│
└── scripts/                   # Scripts utilitários
    ├── setup.ps1             # Setup Windows
    ├── setup.sh              # Setup Unix
    ├── run-dev.ps1           # Run Windows
    └── run-dev.sh            # Run Unix
```

## 🔧 Tecnologias

### Backend
- **FastAPI** - Framework web moderno
- **SQLAlchemy** - ORM para banco de dados
- **PostgreSQL** - Banco de dados relacional
- **Pydantic** - Validação de dados

### Frontend
- **React 18** - Biblioteca de UI
- **Vite** - Build tool rápido
- **React Router** - Roteamento
- **Tailwind CSS** - Styling

## 📚 Documentação

- [Documentação Completa](./docs/DOCUMENTACAO.md)
- [Guia de Desenvolvimento](./docs/GUIA_DESENVOLVIMENTO.md)
- [API Endpoints](./docs/API.md)
- [Guia de Scripts](./docs/SCRIPTS_README.md)

## 🚀 Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/` | Status da API |
| `POST` | `/auth/register` | Registrar usuário |
| `POST` | `/auth/login` | Fazer login |
| `GET` | `/transactions` | Listar transações |
| `POST` | `/transactions` | Criar transação |
| `GET` | `/categories` | Listar categorias |

## 🌐 Acesso Local

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8000 |
| Docs API | http://localhost:8000/docs |

## 📝 Environment

Crie um arquivo `backend/.env`:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/finance_db
SECRET_KEY=sua-chave-secreta-aqui
ENVIRONMENT=development
```

## 🤝 Contribuição

1. Crie uma branch para sua feature: `git checkout -b feature/nova-funcionalidade`
2. Commit suas mudanças: `git commit -am 'Add nova funcionalidade'`
3. Push para a branch: `git push origin feature/nova-funcionalidade`
4. Abra um Pull Request

## 📄 Licença

MIT License

---

**Desenvolvido com ❤️ para gerenciamento financeiro pessoal**
