# Kathrin Coaching - Server Deployment

## Quick Start (Hetzner)

### 1. Dateien auf Server kopieren

```bash
# Vom lokalen Rechner:
scp -r server/ root@91.99.177.238:/opt/kathrin-analytics/
```

### 2. Auf Server: Environment einrichten

```bash
ssh root@91.99.177.238
cd /opt/kathrin-analytics

# .env erstellen
cp .env.example .env
nano .env

# Werte eintragen:
# DB_PASSWORD=<sicheres_passwort>
# APP_SECRET=<zufälliger_string_32_zeichen>
# GITHUB_TOKEN=<github_personal_access_token>
```

### 3. Docker starten

```bash
# Beim ersten Mal:
docker-compose up -d

# Logs prüfen:
docker-compose logs -f

# Status:
docker-compose ps
```

### 4. Nginx konfigurieren

```bash
# Neue Site erstellen:
nano /etc/nginx/sites-available/analytics.kathrinstahl.com
```

```nginx
server {
    listen 443 ssl http2;
    server_name analytics.kathrinstahl.com;

    ssl_certificate /etc/letsencrypt/live/kathrinstahl.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kathrinstahl.com/privkey.pem;

    # Umami Dashboard
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Scheduling API
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name analytics.kathrinstahl.com;
    return 301 https://$server_name$request_uri;
}
```

```bash
# Aktivieren:
ln -s /etc/nginx/sites-available/analytics.kathrinstahl.com /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 5. SSL Zertifikat (falls nötig)

```bash
certbot --nginx -d analytics.kathrinstahl.com
```

## Umami Setup

1. Öffne https://analytics.kathrinstahl.com
2. Erstelle Admin-Account (erster Login)
3. Füge Website hinzu: "Kathrin Coaching"
4. Kopiere Website-ID
5. Trage ID ein in:
   - `js/analytics/config.js` → `websiteId`
   - `js/analytics/init.js` → `data-website-id`

## Commands

```bash
# Logs
docker-compose logs -f umami
docker-compose logs -f scheduling-api

# Neustart
docker-compose restart

# Update
docker-compose pull
docker-compose up -d

# Stop
docker-compose down
```

## Ports

| Service | Port | URL |
|---------|------|-----|
| Umami | 3000 | analytics.kathrinstahl.com |
| Scheduling API | 3001 | analytics.kathrinstahl.com/api |
| PostgreSQL | 5432 | (intern) |

## Troubleshooting

**Umami startet nicht:**
```bash
docker-compose logs postgres  # DB-Fehler?
docker-compose down -v        # Volumes löschen
docker-compose up -d          # Neu starten
```

**API 500 Error:**
```bash
docker-compose exec scheduling-api sh
cat /app/.env  # ENV prüfen
```
