# Deploy DigitalOcean (Ubuntu 24.04)

## 1) Hardening básico

```bash
adduser deploy
usermod -aG sudo deploy
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw enable
sudo apt update && sudo apt upgrade -y
```

## 2) Node + pnpm + PostgreSQL client

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential postgresql-client
corepack enable
corepack prepare pnpm@9.12.1 --activate
```

## 3) Aplicação

```bash
git clone <repo>
cd BELEZAFOCO
cp .env.example .env
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm build
```

## 4) systemd service

`/etc/systemd/system/belezafoco-api.service`

```ini
[Unit]
Description=BELEZAFOCO API
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/home/deploy/BELEZAFOCO
EnvironmentFile=/home/deploy/BELEZAFOCO/.env
ExecStart=/usr/bin/node /home/deploy/BELEZAFOCO/apps/api/dist/src/server.js
Restart=always

[Install]
WantedBy=multi-user.target
```

## 5) Timers (jobs)

Crie services/timers para:

- reminders a cada 5 minutos
- reconcile a cada 10 minutos
- cleanup diariamente

Exemplo `belezafoco-reminders.service`:

```ini
[Service]
Type=oneshot
User=deploy
WorkingDirectory=/home/deploy/BELEZAFOCO
ExecStart=/usr/bin/node apps/api/dist/src/jobs/sendReminders.js
```

## 6) Caddy + SSL

```bash
sudo apt install -y caddy
sudo cp Caddyfile /etc/caddy/Caddyfile
sudo systemctl restart caddy
```

## 7) Backup PostgreSQL

```bash
./scripts/backup_postgres.sh "$DATABASE_URL" /home/deploy/backups
```

Restore:

```bash
./scripts/restore_postgres.sh /home/deploy/backups/belezafoco-AAAAMMDD-HHMMSS.dump "$DATABASE_URL"
```

## 8) Estratégia de update

1. `git pull`
2. `pnpm install --frozen-lockfile`
3. `pnpm prisma:generate`
4. `pnpm prisma:migrate`
5. `pnpm build`
6. `sudo systemctl restart belezafoco-api`
