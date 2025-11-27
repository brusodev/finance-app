finance-app/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── crud.py
│   │   ├── database.py
│   │   ├── routes/
│   │   │   ├── users.py
│   │   │   ├── auth.py
│   │   │   ├── transactions.py
│   │   │   └── categories.py
│   │   └── __init__.py
│   ├── requirements.txt
│   └── alembic/           # opcional para migrações
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── TransactionForm.jsx
    │   │   ├── TransactionList.jsx
    │   │   └── CategorySelect.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   └── Report.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── tailwind.config.js
    ├── package.json
    └── postcss.config.js