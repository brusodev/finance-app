# 🚀 Deploy para VPS - Finance App

Este guia mostra como fazer deploy do Finance App em uma VPS.

---

## 📋 Pré-requisitos na VPS

- Ubuntu/Debian (ou similar)
- Python 3.8+
- Node.js 16+ (para build)
- Nginx (ou Apache)
- Acesso SSH

---

## 🔧 1. Preparar o Backend

### Na sua máquina local:

```bash
cd backend
# O backend já está pronto, basta fazer upload
```

### Na VPS:

```bash
# Criar diretório
mkdir -p /var/www/finance-app
cd /var/www/finance-app

# Upload dos arquivos (use SCP, SFTP ou Git)
# Exemplo com SCP:
scp -r backend user@sua-vps:/var/www/finance-app/

# Instalar dependências
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Criar arquivo .env se necessário
cat > .env << 'EOF'
DATABASE_URL=sqlite:///./finance.db
SECRET_KEY=seu_secret_key_aqui
EOF

# Testar
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## 🎨 2. Preparar o Frontend

### Na sua máquina local:

```bash
cd frontend

# Editar .env.production com o IP/domínio da VPS
nano .env.production
```

Exemplo de `.env.production`:
```env
VITE_API_URL=http://SEU_IP_VPS:8000
# ou
VITE_API_URL=https://api.seudominio.com
```

```bash
# Gerar build
./build.sh

# Será criada a pasta 'dist' com os arquivos estáticos
```

### Upload para VPS:

```bash
# Fazer upload da pasta dist
scp -r dist user@sua-vps:/var/www/finance-app/frontend/
```

---

## 🌐 3. Configurar Nginx

### Na VPS:

```bash
# Instalar Nginx
sudo apt update
sudo apt install nginx

# Criar configuração
sudo nano /etc/nginx/sites-available/finance-app
```

Exemplo de configuração:

```nginx
# Backend API
server {
    listen 80;
    server_name api.seudominio.com;  # ou use IP

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;  # ou use IP

    root /var/www/finance-app/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Ativar configuração
sudo ln -s /etc/nginx/sites-available/finance-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔄 4. Configurar Serviço Systemd (Backend)

Para o backend rodar automaticamente:

```bash
sudo nano /etc/systemd/system/finance-backend.service
```

Conteúdo:

```ini
[Unit]
Description=Finance App Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/finance-app/backend
Environment="PATH=/var/www/finance-app/backend/venv/bin"
ExecStart=/var/www/finance-app/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Ativar e iniciar
sudo systemctl daemon-reload
sudo systemctl enable finance-backend
sudo systemctl start finance-backend
sudo systemctl status finance-backend
```

---

## 🔒 5. Configurar SSL (Opcional mas Recomendado)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seudominio.com -d www.seudominio.com -d api.seudominio.com

# Renovação automática já está configurada
```

Após o SSL, atualize o `.env.production` do frontend:
```env
VITE_API_URL=https://api.seudominio.com
```

E gere o build novamente.

---

## 🔥 6. Configurar Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

---

## 📝 7. Script de Deploy Automatizado

Crie um script `deploy.sh` na VPS:

```bash
#!/bin/bash

echo "🚀 Atualizando Finance App..."

# Backend
cd /var/www/finance-app/backend
git pull  # se usar Git
sudo systemctl restart finance-backend

# Frontend
cd /var/www/finance-app/frontend
# Upload do novo build aqui
sudo systemctl reload nginx

echo "✅ Deploy concluído!"
```

---

## 🧪 8. Testar

```bash
# Testar backend
curl http://localhost:8000

# Testar frontend (do seu PC)
# Acesse: http://SEU_IP_VPS
```

---

## 📊 9. Monitoramento

### Logs do Backend:
```bash
sudo journalctl -u finance-backend -f
```

### Logs do Nginx:
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🔧 10. Troubleshooting

### Backend não inicia:
```bash
sudo systemctl status finance-backend
sudo journalctl -u finance-backend -n 50
```

### Erro 502 Bad Gateway:
- Verifique se o backend está rodando na porta 8000
- Verifique a configuração do Nginx

### CORS ainda dá erro:
- Verifique se o `allow_origins` no backend inclui o domínio do frontend
- Limpe o cache do navegador

---

## 📦 Estrutura Final na VPS

```
/var/www/finance-app/
├── backend/
│   ├── app/
│   ├── venv/
│   ├── finance.db
│   └── .env
└── frontend/
    └── dist/
        ├── index.html
        ├── assets/
        └── ...
```

---

## 💡 Dicas

1. **Backup do banco de dados** regularmente:
   ```bash
   cp /var/www/finance-app/backend/finance.db ~/backups/finance-$(date +%Y%m%d).db
   ```

2. **Use Git** para facilitar deploys futuros

3. **Configure um domínio** ao invés de usar IP

4. **Monitore recursos** da VPS (CPU, RAM, disco)

5. **Configure alertas** para quando o serviço cair

---

## 🎯 Checklist de Deploy

- [ ] VPS configurada e acessível
- [ ] Python e Node.js instalados
- [ ] Backend enviado para VPS
- [ ] Dependências do backend instaladas
- [ ] Frontend buildado com URL correta
- [ ] Frontend enviado para VPS
- [ ] Nginx configurado
- [ ] Serviço systemd criado
- [ ] Firewall configurado
- [ ] SSL configurado (opcional)
- [ ] Testado e funcionando
- [ ] Backup configurado

---

**Boa sorte com o deploy! 🚀**
