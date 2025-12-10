# Kathrin Coaching - API Server

Backend für Content Scheduling, Analytics und AI-Proxy.

## Architektur

```
server/
├── index.js              # Entry Point (~80 Z.)
├── middleware/           # Security Middleware
│   ├── auth.js           # API-Authentifizierung
│   ├── validate.js       # Input-Validierung
│   └── rate-limit.js     # Request Throttling
├── routes/               # API Endpoints
│   ├── health.js         # Health Check
│   ├── scheduling.js     # Blog Scheduling
│   ├── analytics.js      # Umami Proxy
│   └── ai-proxy.js       # Groq AI Proxy
├── services/             # Business Logic
│   └── publisher.js      # GitHub Publisher
├── db/                   # Database
│   └── init.sql          # Schema
└── __tests__/            # Unit & Integration Tests
```

## Quick Start

```bash
# Dependencies installieren
cd server
npm install

# Environment einrichten
cp .env.example .env
# .env bearbeiten

# Development
npm run dev

# Tests
npm test
npm run test:coverage
```

## Environment Variables

| Variable | Beschreibung | Required |
|----------|-------------|----------|
| `PORT` | Server Port (default: 3001) | Nein |
| `DATABASE_URL` | PostgreSQL Connection String | Ja |
| `API_SECRET_TOKEN` | Token für Auth-Middleware | Ja |
| `GITHUB_TOKEN` | GitHub PAT für Auto-Publish | Ja |
| `GROQ_API_KEY` | Groq AI API Key | Ja |
| `UMAMI_API_URL` | Umami API Endpoint | Ja |
| `UMAMI_TOKEN` | Umami API Token | Ja |

---

## API Dokumentation

### Authentication

Geschützte Endpoints erfordern:
```
Authorization: Bearer <API_SECRET_TOKEN>
```

### Rate Limits

| Endpoint-Typ | Limit | Fenster |
|--------------|-------|---------|
| Standard | 100 req | 15 min |
| Auth | 10 req | 15 min |
| Write (POST/PUT/DELETE) | 30 req | 15 min |
| AI Proxy | 5 req | 1 min |

Headers in Response:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

---

### Endpoints

#### Health

```
GET /api/health
```
Response:
```json
{
  "status": "ok",
  "timestamp": "2024-12-11T10:00:00.000Z",
  "version": "1.1.0"
}
```

---

#### Scheduling

**Kalender-Events abrufen:**
```
GET /api/calendar?month=12&year=2024
```

Response:
```json
[
  {
    "id": "abc-123",
    "title": "Mein Blog Post",
    "slug": "mein-blog-post",
    "scheduled_for": "2024-12-15T09:00:00.000Z",
    "status": "scheduled"
  }
]
```

**Post schedulen:** (Auth required)
```
POST /api/schedule
Authorization: Bearer <token>
Content-Type: application/json

{
  "postId": "abc-123",
  "title": "Mein Blog Post",
  "slug": "mein-blog-post",
  "content": { "blocks": [...] },
  "scheduledFor": "2024-12-15T09:00:00.000Z"
}
```

**Post aktualisieren:** (Auth required)
```
PUT /api/posts/:id
```

**Post löschen:** (Auth required)
```
DELETE /api/posts/:id
```

---

#### Analytics (Umami Proxy)

```
GET /api/analytics/stats?start=2024-12-01&end=2024-12-31
```

Response:
```json
{
  "visitors": 2847,
  "pageviews": 4523,
  "avgReadTime": 263,
  "scrollDepth75": 67
}
```

```
GET /api/analytics/pages?start=...&end=...&limit=10
GET /api/analytics/referrers?start=...&end=...
GET /api/analytics/events?start=...&end=...
```

---

#### AI Proxy (Groq)

**Chat Completion:** (Auth required)
```
POST /api/ai/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "Schreibe eine Überschrift für..." }
  ],
  "model": "llama-3.1-70b-versatile",
  "temperature": 0.7,
  "max_tokens": 2048
}
```

**Transcription:** (Auth required)
```
POST /api/ai/transcribe
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <audio-file>
model: whisper-large-v3
```

---

## Security Features

### 1. Input-Validierung

Alle Inputs werden validiert:
- Query-Parameter (month, year, limit, dates)
- Body-Parameter (title, slug, content)
- URL-Parameter (id, postId)

### 2. Rate-Limiting

In-Memory Rate Limiter (für Production: Redis empfohlen)

### 3. Auth-Middleware

- Timing-safe Token-Vergleich
- Schutz gegen Timing Attacks

### 4. Security Headers (Helmet)

- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security

### 5. CORS

Whitelist-basiert:
- kathrinstahl.com
- nickheymann.github.io
- localhost (dev)

---

## Testing

```bash
# Alle Tests
npm test

# Mit Watch-Mode
npm run test:watch

# Coverage Report
npm run test:coverage
```

Test-Dateien:
- `__tests__/validate.test.js` - Input-Validierung
- `__tests__/rate-limit.test.js` - Rate Limiter
- `__tests__/api.test.js` - API Integration

---

## Deployment (Hetzner)

### 1. Dateien kopieren
```bash
scp -r server/ root@91.99.177.238:/opt/kathrin-analytics/
```

### 2. Environment einrichten
```bash
ssh root@91.99.177.238
cd /opt/kathrin-analytics
cp .env.example .env
nano .env
```

### 3. Docker starten
```bash
docker-compose up -d
docker-compose logs -f
```

### 4. Nginx konfigurieren
```nginx
server {
    listen 443 ssl http2;
    server_name analytics.kathrinstahl.com;

    # Umami Dashboard
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Commands

```bash
# Logs
docker-compose logs -f scheduling-api

# Neustart
docker-compose restart scheduling-api

# Update
docker-compose pull && docker-compose up -d

# DB Migration
docker-compose exec postgres psql -U kathrin -d kathrin_analytics -f /docker-entrypoint-initdb.d/init.sql
```

---

## Troubleshooting

**401 Unauthorized:**
- API_SECRET_TOKEN in .env prüfen
- Authorization Header korrekt?

**429 Too Many Requests:**
- Rate Limit erreicht, warten oder von anderer IP

**500 Internal Server Error:**
```bash
docker-compose logs scheduling-api
# Prüfe: DATABASE_URL, GROQ_API_KEY, GITHUB_TOKEN
```

**CORS Error:**
- Domain in CORS Whitelist in index.js?
