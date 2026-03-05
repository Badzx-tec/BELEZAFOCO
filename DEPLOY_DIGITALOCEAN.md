# Deploy DigitalOcean (Ubuntu 24.04)

## 1) Hardening básico
```bash
adduser deploy
usermod -aG sudo deploy
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw enable
sudo apt update && sudo apt upgrade -y
```

## 2) Node + pnpm
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential sqlite3
corepack enable
corepack prepare pnpm@9.12.1 --activate
```

## 3) App
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
`/etc/systemd/system/belezafoco.service`
```ini
[Unit]
Description=BELEZAFOCO API
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/home/deploy/BELEZAFOCO
EnvironmentFile=/home/deploy/BELEZAFOCO/.env
ExecStart=/usr/bin/node /home/deploy/BELEZAFOCO/apps/api/dist/server.js
Restart=always

[Install]
WantedBy=multi-user.target
```

## 5) Timers (jobs)
Crie services/timers para reminders (5 min), reconcile (10 min), cleanup (daily).

Exemplo `belezafoco-reminders.service`:
```ini
[Service]
Type=oneshot
User=deploy
WorkingDirectory=/home/deploy/BELEZAFOCO
ExecStart=/usr/bin/node apps/api/dist/jobs/sendReminders.js
```

Exemplo `belezafoco-reminders.timer`:
```ini
[Timer]
OnBootSec=2min
OnUnitActiveSec=5min
Unit=belezafoco-reminders.service
```

## 6) Caddy + SSL
```bash
sudo apt install -y caddy
sudo cp Caddyfile /etc/caddy/Caddyfile
sudo systemctl restart caddy
```

## 7) Backup SQLite
```bash
./scripts/backup_sqlite.sh apps/api/prisma/dev.db /home/deploy/backups
```
Use cron diário e retenção 7 dias já inclusa no script.

Restore:
```bash
./scripts/restore_sqlite.sh /home/deploy/backups/belezafoco-AAAAMMDD-HHMMSS.db apps/api/prisma/dev.db
```

## 8) Estratégia de update
1. `git pull`
2. `pnpm install --frozen-lockfile`
3. `pnpm prisma:migrate`
4. `pnpm build`
5. `sudo systemctl restart belezafoco`
