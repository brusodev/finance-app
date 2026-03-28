# Skill: Deploy Local com Docker + Cloudflare Tunnel

Guia de referência rápida para subir, migrar e expor a aplicação Prospera via Docker e Cloudflare Tunnel no Windows.

---

## Infraestrutura

```text
Internet → Cloudflare Tunnel (cloudflared serviço Windows)
               ├── finance.projdev.site      → localhost:3000 (frontend)
               └── finance-api.projdev.site  → localhost:8000 (backend)

Docker Compose
  ├── postgres:17-alpine   (porta 5432)
  ├── finance-backend      (porta 8000)
  └── finance-frontend     (porta 3000)
```

---

## Comandos do Dia a Dia

### Subir a stack

```powershell
docker compose --env-file .env.docker up -d
```

### Rebuild após mudança de código

```powershell
docker compose --env-file .env.docker up -d --build
```

### Ver status dos containers

```powershell
docker compose --env-file .env.docker ps
```

### Ver logs de um serviço

```powershell
docker compose logs -f backend
docker compose logs -f frontend
```

### Parar tudo

```powershell
docker compose down
```

---

## Migração de Banco de Dados

### De outro PostgreSQL (ex: Railway) para o Docker local

```powershell
.\migrate_from_railway.ps1
```

O script:

1. Faz dump do banco de origem com `pg_dump`
2. Sobe o container postgres local se necessário
3. Restaura o dump com `psql`
4. Verifica contagem de registros nas tabelas principais

Requisito: `pg_dump` versão 17 em `C:\Program Files\PostgreSQL\17\bin`.

Se o pg_dump não estiver no PATH, o script adiciona automaticamente.

---

## Cloudflare Tunnel

### Config do tunnel

Arquivo: `C:\cloudflared\config\config.yml`

```yaml
tunnel: <TUNNEL_ID>
credentials-file: C:\Users\<USER>\.cloudflared\<TUNNEL_ID>.json

ingress:
  - hostname: finance.projdev.site
    service: http://localhost:3000
  - hostname: finance-api.projdev.site
    service: http://localhost:8000
  - service: http_status:404
```

### Gerenciar o serviço Windows (como Administrador)

```powershell
# Ver status
Get-Service Cloudflared

# Iniciar
Start-Service Cloudflared

# Parar
Stop-Service Cloudflared

# Reiniciar
Restart-Service Cloudflared
```

### Reinstalar o serviço com o config correto

Necessário quando o config muda ou o serviço não sobe:

```powershell
& "C:\cloudflared\cloudflared.exe" service uninstall
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\Cloudflared" `
  -Name "ImagePath" `
  -Value '"C:\cloudflared\cloudflared.exe" --config "C:\cloudflared\config\config.yml" tunnel run'
Start-Service Cloudflared
```

### Adicionar novo domínio ao tunnel

```powershell
& "C:\cloudflared\cloudflared.exe" tunnel route dns <TUNNEL_ID> novo.projdev.site
```

Depois adicionar a entrada no `config.yml` e reiniciar o serviço.

---

## Variáveis de Ambiente

Arquivo: `.env.docker` (não commitado no git)

| Variável | Descrição |
|----------|-----------|
| `POSTGRES_USER` | Usuário do banco |
| `POSTGRES_PASSWORD` | Senha do banco |
| `POSTGRES_DB` | Nome do banco |
| `DATABASE_URL` | URL completa de conexão com `?sslmode=disable` |
| `SECRET_KEY` | Chave JWT (gerar com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `VITE_API_URL` | URL da API usada pelo frontend em build time |
| `FRONTEND_URL` | URL do frontend para CORS |
| `ALLOWED_ORIGINS` | Origins permitidas no CORS (separadas por vírgula) |

---

## Problemas Comuns

### SSL error ao conectar no banco

Adicionar `?sslmode=disable` na `DATABASE_URL` e remover `connect_args={"sslmode": "require"}` do `database.py`.

### Frontend usando URL antiga da API

O `VITE_API_URL` é injetado em build time. Rebuild obrigatório:

```powershell
docker compose --env-file .env.docker up -d --build frontend
```

### pg_dump version mismatch

O `pg_dump` local deve ter a mesma versão major do servidor PostgreSQL de origem. Instalar versão correta em `C:\Program Files\PostgreSQL\<versão>\bin`.

### Cloudflared serviço não sobe

Verificar se o `ImagePath` no registro do Windows inclui o `--config`:

```powershell
Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Services\Cloudflared" -Name ImagePath
```

Se não tiver `--config`, corrigir com `Set-ItemProperty` conforme seção acima.

### Encoding quebrado no PowerShell (.ps1)

Reescrever o arquivo via editor ou ferramentas que garantam UTF-8 sem BOM. Evitar `!(expr)` — usar `-not (expr)`.
