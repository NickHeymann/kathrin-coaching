# Content Scheduling & Analytics System - Implementierungsplan

> **Ultrathink-Plan** | Erstellt: 2024-12-10
> Basierend auf: my-second-brain Best Practices, modulare Architektur (<300 Z/Datei)

---

## Executive Summary

Ein integriertes System für:
1. **Content Scheduling** - Kalender-basierte Beitragsplanung mit Entwürfen
2. **Self-Hosted Analytics** - Umami auf Hetzner mit erweiterten Blog-Metriken
3. **Lead Pipeline Integration** - Tracking von Blog → Angebot → Lead

---

## Teil 1: Analytics-System (Umami + Custom Extensions)

### Warum Umami?

| Kriterium | Umami | PostHog | Matomo |
|-----------|-------|---------|--------|
| Script-Größe | ~2KB | ~50KB | ~23KB |
| Self-Host Komplexität | Einfach (Docker) | Komplex (viele Container) | Mittel |
| DSGVO-konform | Ja (cookieless) | Konfigurierbar | Konfigurierbar |
| Custom Events | Ja | Ja | Ja |
| API für Integration | Ja | Ja | Ja |
| Kosten | Kostenlos | Kostenlos (limitiert) | Kostenlos |
| RAM-Bedarf | ~512MB | ~4GB | ~2GB |

**Empfehlung: Umami** - Leichtgewichtig, DSGVO-konform, perfekt für Blog + Website

### Architektur

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         HETZNER SERVER (VPS)                            │
│                         91.99.177.238                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐     │
│  │   Umami         │    │   PostgreSQL    │    │   Node.js API   │     │
│  │   (Analytics)   │◄──►│   (Datenbank)   │◄──►│   (Scheduling)  │     │
│  │   Port 3000     │    │   Port 5432     │    │   Port 3001     │     │
│  └────────┬────────┘    └─────────────────┘    └────────┬────────┘     │
│           │                                              │              │
│  ┌────────▼────────┐                         ┌──────────▼──────────┐   │
│  │   Nginx         │                         │   Cron Service      │   │
│  │   (Reverse      │                         │   (Auto-Publish)    │   │
│  │   Proxy + SSL)  │                         │   Täglich 09:00     │   │
│  └────────┬────────┘                         └─────────────────────┘   │
│           │                                                             │
└───────────┼─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    KATHRIN-COACHING WEBSITE                             │
│                    (GitHub Pages - Static)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐     │
│  │   Analytics     │    │   Blog-Editor   │    │   Analytics     │     │
│  │   Tracker       │    │   + Kalender    │    │   Dashboard     │     │
│  │   (umami.js)    │    │   Scheduling    │    │   (CMS-integ.)  │     │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tracking-Events (Custom)

```javascript
// js/analytics/tracker.js (~150 Zeilen)

const AnalyticsTracker = {
    // Basis-Events (automatisch)
    pageView: () => umami.track(),

    // Blog-spezifisch
    articleRead: (slug, title, category) => umami.track('article_read', { slug, title, category }),
    scrollDepth: (slug, percent) => umami.track('scroll_depth', { slug, percent }),
    readTime: (slug, seconds) => umami.track('read_time', { slug, seconds }),
    articleFinished: (slug) => umami.track('article_finished', { slug }),

    // Lead-Funnel
    ctaClicked: (ctaType, fromPage) => umami.track('cta_click', { type: ctaType, from: fromPage }),
    bookingStarted: (service) => umami.track('booking_started', { service }),
    bookingCompleted: (service) => umami.track('booking_completed', { service }),
    quizStarted: (quizType) => umami.track('quiz_started', { type: quizType }),
    quizCompleted: (quizType, result) => umami.track('quiz_completed', { type: quizType, result }),

    // Newsletter
    newsletterView: (formLocation) => umami.track('newsletter_view', { location: formLocation }),
    newsletterSignup: (formLocation) => umami.track('newsletter_signup', { location: formLocation }),

    // Engagement
    socialShare: (platform, slug) => umami.track('social_share', { platform, slug }),
    relatedPostClick: (fromSlug, toSlug) => umami.track('related_click', { from: fromSlug, to: toSlug }),
    externalLinkClick: (url, fromPage) => umami.track('external_click', { url, from: fromPage })
};
```

### Scroll-Depth Tracking Implementation

```javascript
// js/analytics/scroll-tracker.js (~100 Zeilen)

const ScrollTracker = {
    milestones: [25, 50, 75, 100],
    reached: new Set(),
    slug: null,
    startTime: null,

    init(articleSlug) {
        this.slug = articleSlug;
        this.startTime = Date.now();
        this.reached.clear();
        window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
        window.addEventListener('beforeunload', this.sendReadTime.bind(this));
    },

    handleScroll() {
        const scrollPercent = Math.round(
            (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100
        );

        this.milestones.forEach(milestone => {
            if (scrollPercent >= milestone && !this.reached.has(milestone)) {
                this.reached.add(milestone);
                AnalyticsTracker.scrollDepth(this.slug, milestone);

                if (milestone === 100) {
                    AnalyticsTracker.articleFinished(this.slug);
                }
            }
        });
    },

    sendReadTime() {
        const seconds = Math.round((Date.now() - this.startTime) / 1000);
        if (seconds > 5) { // Nur wenn mehr als 5 Sekunden
            AnalyticsTracker.readTime(this.slug, seconds);
        }
    }
};
```

### Dateien für Analytics-Integration

```
js/analytics/                     # Analytics-Module (~100-150 Z/Datei)
├── config.js                     # Umami Config (Site ID, API URL)
├── tracker.js                    # Custom Event Tracking
├── scroll-tracker.js             # Scroll-Depth Logic
├── lead-funnel.js                # CTA & Conversion Tracking
└── dashboard-api.js              # API Client für Dashboard

cms/js/
├── analytics-dashboard.js        # Dashboard UI Integration
└── analytics-charts.js           # Chart.js Visualisierungen
```

---

## Teil 2: Content Scheduling System

### Datenmodell

```typescript
// types/scheduling.ts

interface ScheduledPost {
    id: string;                    // UUID
    title: string;
    slug: string;
    status: 'draft' | 'scheduled' | 'published' | 'failed';
    scheduledFor: Date | null;     // null = Entwurf
    content: {
        blocks: Block[];
        excerpt: string;
        categories: string[];
        featuredImage: string;
    };
    metadata: {
        createdAt: Date;
        updatedAt: Date;
        publishedAt: Date | null;
        authorNotes: string;       // Private Notizen
    };
    analytics?: {
        estimatedReadTime: number;  // Minuten
        targetAudience: string[];
    };
}

interface CalendarEvent {
    id: string;
    postId: string;
    date: Date;
    type: 'scheduled' | 'draft' | 'idea';
    color: string;                 // Visuell unterscheiden
    title: string;
}
```

### Kalender-UI Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📅 Content-Kalender                    [< Dezember 2024 >]  [Heute]    │
├─────────────────────────────────────────────────────────────────────────┤
│  Mo      Di      Mi      Do      Fr      Sa      So                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  25      26      27      28      29      30      1                      │
│                                  ┌────────────┐                         │
│                                  │ 🟢 Achtsamkeit │                     │
│                                  │ im Alltag     │                      │
│                                  └────────────┘                         │
│                                                                         │
│  2       3       4       5       6       7       8                      │
│  ┌────────────┐                          ┌────────────┐                 │
│  │ 🟡 Entwurf: │                         │ 🟢 Scheduled:│                │
│  │ Beziehung  │                          │ Selbstliebe │                │
│  └────────────┘                          └────────────┘                 │
│                                                                         │
│  9       10      11      12      13      14      15                     │
│          ┌────────────┐                                                 │
│          │ 🔵 Idee:   │                                                 │
│          │ Pferde     │                                                 │
│          └────────────┘                                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

Legende:
🟢 Scheduled (wird automatisch veröffentlicht)
🟡 Entwurf (fertig, wartet auf Termin)
🔵 Idee/Notiz (noch nicht geschrieben)
```

### Kalender-Komponente

```javascript
// js/scheduling/calendar.js (~250 Zeilen)

const ContentCalendar = {
    currentDate: new Date(),
    events: [],

    async init(container) {
        this.container = document.getElementById(container);
        this.events = await this.loadEvents();
        this.render();
    },

    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Header
        let html = `
            <div class="calendar-header">
                <button onclick="ContentCalendar.prevMonth()">◀</button>
                <h3>${this.getMonthName(month)} ${year}</h3>
                <button onclick="ContentCalendar.nextMonth()">▶</button>
                <button class="btn-today" onclick="ContentCalendar.goToToday()">Heute</button>
            </div>
            <div class="calendar-weekdays">
                <div>Mo</div><div>Di</div><div>Mi</div><div>Do</div><div>Fr</div><div>Sa</div><div>So</div>
            </div>
            <div class="calendar-grid">
        `;

        // Leere Zellen vor dem 1.
        const startDay = (firstDay.getDay() + 6) % 7; // Montag = 0
        for (let i = 0; i < startDay; i++) {
            html += `<div class="calendar-cell empty"></div>`;
        }

        // Tage
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            const dayEvents = this.getEventsForDate(date);
            const isToday = this.isToday(date);

            html += `
                <div class="calendar-cell ${isToday ? 'today' : ''}"
                     onclick="ContentCalendar.openDay('${date.toISOString()}')"
                     ondrop="ContentCalendar.handleDrop(event, '${date.toISOString()}')"
                     ondragover="event.preventDefault()">
                    <span class="day-number">${day}</span>
                    ${dayEvents.map(e => this.renderEvent(e)).join('')}
                </div>
            `;
        }

        html += '</div>';
        this.container.innerHTML = html;
    },

    renderEvent(event) {
        const colors = {
            scheduled: '#22c55e',  // Grün
            draft: '#eab308',      // Gelb
            idea: '#3b82f6'        // Blau
        };
        return `
            <div class="calendar-event"
                 style="background: ${colors[event.type]}"
                 draggable="true"
                 ondragstart="ContentCalendar.handleDragStart(event, '${event.id}')"
                 onclick="ContentCalendar.openEvent('${event.id}', event)">
                ${event.title.slice(0, 20)}${event.title.length > 20 ? '...' : ''}
            </div>
        `;
    },

    async schedulePost(postId, date) {
        // API Call zum Scheduling-Server
        const response = await fetch(`${CONFIG.schedulingAPI}/schedule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId, scheduledFor: date.toISOString() })
        });

        if (response.ok) {
            this.events = await this.loadEvents();
            this.render();
            showToast('Beitrag geplant', 'success');
        }
    }
};
```

### Backend-API (Hetzner)

```javascript
// server/scheduling-api.js (Node.js auf Hetzner)

const express = require('express');
const { Pool } = require('pg');
const cron = require('node-cron');
const { Octokit } = require('@octokit/rest');

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Endpunkte
app.post('/api/schedule', async (req, res) => {
    const { postId, scheduledFor, content, title, slug } = req.body;

    await pool.query(`
        INSERT INTO scheduled_posts (id, title, slug, content, scheduled_for, status)
        VALUES ($1, $2, $3, $4, $5, 'scheduled')
        ON CONFLICT (id) DO UPDATE SET
            scheduled_for = $5,
            status = 'scheduled',
            updated_at = NOW()
    `, [postId, title, slug, JSON.stringify(content), scheduledFor]);

    res.json({ success: true });
});

app.get('/api/calendar', async (req, res) => {
    const { month, year } = req.query;
    const result = await pool.query(`
        SELECT id, title, slug, scheduled_for, status
        FROM scheduled_posts
        WHERE EXTRACT(MONTH FROM scheduled_for) = $1
          AND EXTRACT(YEAR FROM scheduled_for) = $2
        ORDER BY scheduled_for
    `, [month, year]);

    res.json(result.rows);
});

// Cron Job: Täglich um 09:00 Uhr veröffentlichen
cron.schedule('0 9 * * *', async () => {
    const due = await pool.query(`
        SELECT * FROM scheduled_posts
        WHERE status = 'scheduled'
          AND scheduled_for <= NOW()
    `);

    for (const post of due.rows) {
        await publishToGitHub(post);
    }
});

async function publishToGitHub(post) {
    try {
        const content = generateBlogHTML(post);

        await octokit.repos.createOrUpdateFileContents({
            owner: 'nickheymann',
            repo: 'kathrin-coaching',
            path: `${post.slug}.html`,
            message: `📝 Automatisch veröffentlicht: ${post.title}`,
            content: Buffer.from(content).toString('base64'),
            branch: 'main'
        });

        await pool.query(`
            UPDATE scheduled_posts
            SET status = 'published', published_at = NOW()
            WHERE id = $1
        `, [post.id]);

        console.log(`✅ Veröffentlicht: ${post.title}`);
    } catch (error) {
        console.error(`❌ Fehler: ${post.title}`, error);
        await pool.query(`
            UPDATE scheduled_posts
            SET status = 'failed', error_message = $2
            WHERE id = $1
        `, [post.id, error.message]);
    }
}
```

### Dateien für Scheduling

```
js/scheduling/                    # Frontend (~100-200 Z/Datei)
├── config.js                     # API URLs, Konstanten
├── calendar.js                   # Kalender-UI
├── calendar-events.js            # Event-Handling
├── scheduler-api.js              # API Client
├── draft-manager.js              # Entwürfe verwalten
└── calendar.css                  # Kalender Styles

server/                           # Backend auf Hetzner
├── index.js                      # Express Server Entry
├── routes/
│   ├── scheduling.js             # /api/schedule, /api/calendar
│   ├── analytics.js              # /api/analytics (Umami proxy)
│   └── health.js                 # /api/health
├── services/
│   ├── publisher.js              # GitHub Publishing Logic
│   ├── cron.js                   # Scheduled Jobs
│   └── umami-api.js              # Umami API Integration
├── db/
│   └── migrations/               # SQL Migrations
└── docker-compose.yml            # Umami + PostgreSQL + API
```

---

## Teil 3: Analytics Dashboard

### Dashboard-Seiten

```
cms/analytics/                    # Neuer Bereich im CMS
├── index.html                    # Dashboard Übersicht
├── blog.html                     # Blog-spezifische Analytics
├── funnel.html                   # Lead-Funnel Analyse
└── export.html                   # Daten exportieren
```

### Dashboard-Metriken

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📊 Analytics Dashboard                      [Letzte 30 Tage ▼] [↻]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │   2.847      │  │   1.234      │  │   4:23       │  │   67%        ││
│  │   Besucher   │  │   Seitenauf- │  │   Ø Lesezeit │  │   Scroll >75%││
│  │   ↑ 12%      │  │   rufe ↑ 8%  │  │   ↑ 0:45     │  │   ↓ 3%       ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘│
│                                                                         │
│  ┌─────────────────────────────────────┐  ┌───────────────────────────┐│
│  │  📈 Traffic-Verlauf                 │  │  🔥 Top Blog-Artikel      ││
│  │  [Graph: Besucher über Zeit]        │  │                           ││
│  │                                     │  │  1. Warum Loslassen...    ││
│  │                                     │  │     432 Aufrufe, 78% Scroll││
│  │                                     │  │                           ││
│  │                                     │  │  2. Die Angst vor Power   ││
│  │                                     │  │     387 Aufrufe, 65% Scroll││
│  │                                     │  │                           ││
│  │                                     │  │  3. Gehen oder Bleiben    ││
│  └─────────────────────────────────────┘  │     298 Aufrufe, 82% Scroll││
│                                           └───────────────────────────┘│
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  🎯 Lead-Funnel                                                     ││
│  │                                                                     ││
│  │  Blog gelesen ──► CTA geklickt ──► Quiz gestartet ──► Kontakt      ││
│  │     2.847          │   423 (14.9%)    │   156 (36.9%)  │  23 (14.7%)││
│  │                    ▼                  ▼                ▼            ││
│  │               Conversion-Rate: 0.8% (Blog → Kontakt)                ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ┌─────────────────────────────────────┐  ┌───────────────────────────┐│
│  │  📍 Traffic-Quellen                 │  │  📱 Geräte                ││
│  │                                     │  │                           ││
│  │  🔍 Google        45%  ████████░░  │  │  💻 Desktop    52%        ││
│  │  📱 Instagram     23%  ████░░░░░░  │  │  📱 Mobile     41%        ││
│  │  👤 Direkt        18%  ███░░░░░░░  │  │  📟 Tablet      7%        ││
│  │  📧 Newsletter    12%  ██░░░░░░░░  │  │                           ││
│  │  🔗 Sonstige       2%  ░░░░░░░░░░  │  │                           ││
│  └─────────────────────────────────────┘  └───────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Teil 4: Deployment auf Hetzner

### Server-Setup

```bash
# 1. Docker installieren (falls nicht vorhanden)
curl -fsSL https://get.docker.com | sh

# 2. Docker Compose
mkdir -p /opt/kathrin-analytics
cd /opt/kathrin-analytics

# 3. docker-compose.yml erstellen
```

### Docker Compose

```yaml
# docker-compose.yml

version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: kathrin_analytics
      POSTGRES_USER: kathrin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  umami:
    image: ghcr.io/umami-software/umami:postgresql-latest
    environment:
      DATABASE_URL: postgresql://kathrin:${DB_PASSWORD}@postgres:5432/kathrin_analytics
      DATABASE_TYPE: postgresql
      HASH_SALT: ${HASH_SALT}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    restart: unless-stopped

  scheduling-api:
    build: ./server
    environment:
      DATABASE_URL: postgresql://kathrin:${DB_PASSWORD}@postgres:5432/kathrin_analytics
      GITHUB_TOKEN: ${GITHUB_TOKEN}
      PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  postgres_data:
```

### Nginx Konfiguration

```nginx
# /etc/nginx/sites-available/analytics.kathrinstahl.com

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
    }

    # Umami Tracking Script (öffentlich)
    location /script.js {
        proxy_pass http://localhost:3000/script.js;
        add_header Cache-Control "public, max-age=86400";
    }

    # Scheduling API
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Teil 5: Implementierungs-Reihenfolge

### Phase 1: Analytics-Grundlage (Tag 1-2)
1. Umami auf Hetzner deployen (docker-compose)
2. Tracking-Script in Website einbinden
3. Custom Events für Blog definieren
4. Scroll-Depth Tracking implementieren

### Phase 2: Scheduling-Backend (Tag 3-4)
1. PostgreSQL Tabellen für Scheduling
2. Node.js API für Calendar-Endpoints
3. Cron-Job für Auto-Publishing
4. GitHub Publishing Integration

### Phase 3: Calendar-UI (Tag 5-6)
1. Kalender-Komponente (vanilla JS)
2. Drag & Drop Scheduling
3. Integration in Blog-Editor
4. Mobile-responsive Design

### Phase 4: Analytics-Dashboard (Tag 7-8)
1. Dashboard-Seite im CMS
2. Umami API Integration
3. Custom Metrics (Scroll, Funnel)
4. Chart.js Visualisierungen

### Phase 5: Lead-Pipeline (Tag 9-10)
1. CTA-Tracking auf allen Seiten
2. Quiz-Conversion Tracking
3. Newsletter-Signup Tracking
4. Funnel-Visualisierung

---

## Datei-Übersicht (Modular <300 Z/Datei)

```
# Frontend (kathrin-coaching Repository)

js/analytics/
├── config.js              # 30 Z  - Umami Config
├── tracker.js             # 150 Z - Custom Event Tracking
├── scroll-tracker.js      # 100 Z - Scroll-Depth Logic
├── lead-funnel.js         # 120 Z - CTA Tracking
└── dashboard-api.js       # 100 Z - API Client

js/scheduling/
├── config.js              # 30 Z  - API URLs
├── calendar.js            # 250 Z - Kalender-UI
├── calendar-events.js     # 150 Z - Event-Handling
├── scheduler-api.js       # 100 Z - API Client
└── draft-manager.js       # 150 Z - Entwürfe

css/scheduling/
├── calendar.css           # 200 Z - Kalender Styles
└── dashboard.css          # 150 Z - Dashboard Styles

cms/
├── analytics.html         # 200 Z - Dashboard UI
└── js/
    ├── analytics-dashboard.js  # 200 Z - Dashboard Logic
    └── analytics-charts.js     # 150 Z - Chart.js


# Backend (Hetzner Server)

server/
├── index.js               # 50 Z  - Entry Point
├── routes/
│   ├── scheduling.js      # 150 Z - Schedule Endpoints
│   ├── analytics.js       # 100 Z - Analytics Proxy
│   └── health.js          # 30 Z  - Health Check
├── services/
│   ├── publisher.js       # 150 Z - GitHub Publish
│   ├── cron.js            # 80 Z  - Scheduled Jobs
│   └── umami-api.js       # 100 Z - Umami Integration
├── db/
│   └── migrations/
│       └── 001_init.sql   # 50 Z  - Schema
├── docker-compose.yml     # 50 Z  - Services
└── Dockerfile             # 20 Z  - API Container
```

---

## Kosten

| Service | Kosten |
|---------|--------|
| Hetzner VPS (CX11) | ~€4/Monat (bereits vorhanden) |
| Umami | Kostenlos (Self-hosted) |
| PostgreSQL | Kostenlos (im Container) |
| Domain/SSL | Bereits vorhanden |

**Gesamt: €0 zusätzlich** (vorhandene Infrastruktur nutzen)

---

---

## Teil 6: UI-Modernisierung (Blog-Editor & CMS v2.0)

### Design-Richtung: Glassmorphism + Soft Shadows

**Warum Glassmorphism?**
- Modern, 2025-ready Look
- Perfekt für Dashboard/Editor UIs
- Gute Lesbarkeit durch Kontraste
- CSS `backdrop-filter` hat jetzt breite Browser-Unterstützung

### Aktueller vs. Neuer Look

```
AKTUELL (altbacken):                    NEU (modern):
┌─────────────────────────┐             ┌─────────────────────────┐
│  Flache Toolbar         │             │  ░░░ Glassmorphism ░░░  │
│  ──────────────────     │    →        │  ╭───────────────────╮  │
│  [Button] [Button]      │             │  │ Soft Shadows      │  │
│  Harter Rand            │             │  │ Subtle Gradients  │  │
│  Keine Tiefe            │             │  ╰───────────────────╯  │
└─────────────────────────┘             └─────────────────────────┘
```

### Neue CSS Design Tokens

```css
/* css/editor-modern.css - Design System Variables */
:root {
    /* === Glassmorphism Basics === */
    --glass-bg: rgba(255, 255, 255, 0.15);
    --glass-border: rgba(255, 255, 255, 0.2);
    --glass-blur: blur(12px);
    --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

    /* === Updated Color Palette === */
    --primary: #2C4A47;
    --primary-light: #3d6360;
    --primary-dark: #1e3533;
    --accent: #D4A574;
    --accent-light: #e6c09a;
    --accent-glow: rgba(212, 165, 116, 0.3);

    /* === Surface Colors (Light Mode) === */
    --surface-1: #ffffff;
    --surface-2: #f8f9fa;
    --surface-3: #f1f3f5;
    --surface-elevated: rgba(255, 255, 255, 0.95);

    /* === Surface Colors (Dark Mode) === */
    --surface-dark-1: #1a1d21;
    --surface-dark-2: #22262b;
    --surface-dark-3: #2a2f35;
    --surface-dark-glass: rgba(30, 34, 40, 0.85);

    /* === Shadows (Soft UI) === */
    --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
    --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
    --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.12);
    --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.15);
    --shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.06);
    --shadow-glow: 0 0 20px var(--accent-glow);

    /* === Border Radius (Smooth) === */
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 24px;
    --radius-full: 9999px;

    /* === Transitions (Smooth) === */
    --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
    --duration-fast: 150ms;
    --duration-normal: 250ms;
    --duration-slow: 400ms;

    /* === Typography === */
    --font-display: 'Inter', system-ui, -apple-system, sans-serif;
    --font-body: 'Inter', system-ui, sans-serif;
    --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

### Moderne Toolbar (Glassmorphism)

```css
/* css/components/toolbar-modern.css */

.toolbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.5rem;
    z-index: 1000;

    /* Glassmorphism */
    background: linear-gradient(
        135deg,
        rgba(44, 74, 71, 0.95) 0%,
        rgba(44, 74, 71, 0.85) 100%
    );
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow:
        0 4px 24px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.toolbar-logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 700;
    font-size: 1rem;
    letter-spacing: -0.02em;
}

.toolbar-logo::before {
    content: '';
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-sm);
}
```

### Moderne Buttons

```css
/* css/components/buttons-modern.css */

.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    letter-spacing: -0.01em;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-smooth);
    white-space: nowrap;
}

/* Ghost Button - Glassmorphism */
.btn-ghost {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(8px);
}

.btn-ghost:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.25);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
}

/* Primary Button - Soft Glow */
.btn-primary {
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);
    color: white;
    box-shadow:
        var(--shadow-sm),
        0 0 0 1px rgba(212, 165, 116, 0.3);
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow:
        var(--shadow-md),
        var(--shadow-glow);
}

.btn-primary:active {
    transform: translateY(0);
}

/* Success Button */
.btn-success {
    background: linear-gradient(135deg, #22c55e 0%, #4ade80 100%);
    color: white;
    box-shadow:
        var(--shadow-sm),
        0 0 0 1px rgba(34, 197, 94, 0.3);
}

.btn-success:hover {
    transform: translateY(-2px);
    box-shadow:
        var(--shadow-md),
        0 0 20px rgba(34, 197, 94, 0.3);
}
```

### Moderne Sidebar

```css
/* css/components/sidebar-modern.css */

.sidebar {
    width: 280px;
    height: calc(100vh - 56px);
    position: fixed;
    top: 56px;
    left: 0;
    display: flex;
    flex-direction: column;

    /* Glassmorphism (dunkel) */
    background: linear-gradient(
        180deg,
        rgba(26, 29, 33, 0.98) 0%,
        rgba(26, 29, 33, 0.95) 100%
    );
    backdrop-filter: blur(20px);
    border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.sidebar-header {
    padding: 1.25rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.sidebar-header h2 {
    font-size: 0.875rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.sidebar-tabs {
    display: flex;
    gap: 0.25rem;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.2);
}

.sidebar-tab {
    flex: 1;
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-smooth);
}

.sidebar-tab:hover {
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.05);
}

.sidebar-tab.active {
    color: white;
    background: rgba(255, 255, 255, 0.1);
    box-shadow: var(--shadow-inner);
}
```

### Moderne Cards

```css
/* css/components/cards-modern.css */

.card {
    background: var(--surface-1);
    border-radius: var(--radius-lg);
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: var(--shadow-sm);
    transition: all var(--duration-normal) var(--ease-smooth);
    overflow: hidden;
}

.card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
    border-color: rgba(0, 0, 0, 0.08);
}

.card-glass {
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    box-shadow: var(--glass-shadow);
}

/* Post Card in Sidebar */
.post-card {
    margin: 0.5rem 0.75rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-smooth);
}

.post-card:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.1);
    transform: translateX(4px);
}

.post-card.active {
    background: rgba(212, 165, 116, 0.1);
    border-color: rgba(212, 165, 116, 0.3);
    box-shadow: inset 3px 0 0 var(--accent);
}
```

### Moderner Editor-Bereich

```css
/* css/components/editor-modern.css */

.editor-container {
    flex: 1;
    padding: 2rem;
    max-width: 900px;
    margin: 0 auto;
}

.editor-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 1rem;
    margin-bottom: 1.5rem;

    /* Floating Toolbar */
    background: var(--surface-elevated);
    border-radius: var(--radius-lg);
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: var(--shadow-md);
    position: sticky;
    top: 72px;
    z-index: 100;
}

.toolbar-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    color: var(--text-light);
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-smooth);
}

.toolbar-btn:hover {
    background: var(--surface-3);
    color: var(--primary);
}

.toolbar-btn.active {
    background: var(--primary);
    color: white;
}

.toolbar-divider {
    width: 1px;
    height: 24px;
    background: rgba(0, 0, 0, 0.1);
    margin: 0 0.25rem;
}
```

### Moderne Modals

```css
/* css/components/modals-modern.css */

.modal-bg {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    opacity: 0;
    visibility: hidden;
    transition: all var(--duration-normal) var(--ease-smooth);
}

.modal-bg.active {
    opacity: 1;
    visibility: visible;
}

.modal {
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 1.5rem;

    /* Glassmorphism Modal */
    background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.95) 0%,
        rgba(255, 255, 255, 0.9) 100%
    );
    backdrop-filter: blur(20px);
    border-radius: var(--radius-xl);
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow:
        var(--shadow-xl),
        inset 0 1px 0 rgba(255, 255, 255, 0.5);

    transform: scale(0.95) translateY(10px);
    transition: transform var(--duration-normal) var(--ease-smooth);
}

.modal-bg.active .modal {
    transform: scale(1) translateY(0);
}

.modal h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--primary);
    margin-bottom: 1rem;
    letter-spacing: -0.02em;
}
```

### Status-Indikatoren (Animated)

```css
/* css/components/status-modern.css */

.autosave-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.75rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-full);
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.8);
}

.autosave-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.9); }
}

.status-badge {
    padding: 0.375rem 0.75rem;
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    display: flex;
    align-items: center;
    gap: 0.375rem;
}

.status-saved {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
}

.status-unsaved {
    background: rgba(234, 179, 8, 0.15);
    color: #eab308;
}

.status-saving {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
}

.status-saving::before {
    content: '';
    width: 12px;
    height: 12px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
```

### Kalender-Styles (Modern)

```css
/* css/scheduling/calendar-modern.css */

.calendar-container {
    background: var(--surface-1);
    border-radius: var(--radius-xl);
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
}

.calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    background: linear-gradient(
        135deg,
        var(--primary) 0%,
        var(--primary-light) 100%
    );
    color: white;
}

.calendar-header h3 {
    font-size: 1.125rem;
    font-weight: 600;
    letter-spacing: -0.02em;
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    background: rgba(0, 0, 0, 0.06);
}

.calendar-cell {
    min-height: 100px;
    padding: 0.5rem;
    background: var(--surface-1);
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-smooth);
}

.calendar-cell:hover {
    background: var(--surface-2);
}

.calendar-cell.today {
    background: rgba(212, 165, 116, 0.1);
}

.calendar-cell.today .day-number {
    background: var(--accent);
    color: white;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.calendar-event {
    margin-top: 0.25rem;
    padding: 0.375rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: var(--radius-sm);
    color: white;
    cursor: grab;
    transition: all var(--duration-fast) var(--ease-smooth);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.calendar-event:hover {
    transform: scale(1.02);
    box-shadow: var(--shadow-sm);
}

.calendar-event.scheduled { background: #22c55e; }
.calendar-event.draft { background: #eab308; }
.calendar-event.idea { background: #3b82f6; }
```

### Dark Mode Support

```css
/* css/utilities/dark-mode.css */

@media (prefers-color-scheme: dark) {
    :root {
        --surface-1: var(--surface-dark-1);
        --surface-2: var(--surface-dark-2);
        --surface-3: var(--surface-dark-3);
        --surface-elevated: var(--surface-dark-glass);
        --text: #f1f5f9;
        --text-light: #94a3b8;
    }

    .editor-toolbar,
    .modal,
    .card {
        background: var(--surface-dark-glass);
        border-color: rgba(255, 255, 255, 0.06);
    }

    .calendar-cell {
        background: var(--surface-dark-1);
    }

    .calendar-cell:hover {
        background: var(--surface-dark-2);
    }
}

/* Manual Toggle Class */
.dark-theme {
    --surface-1: var(--surface-dark-1);
    --surface-2: var(--surface-dark-2);
    --surface-3: var(--surface-dark-3);
}
```

### Dateien für UI-Modernisierung

```
css/
├── editor-modern/                # Neue moderne Styles
│   ├── variables.css             # Design Tokens (~100 Z)
│   ├── toolbar.css               # Glassmorphism Toolbar (~80 Z)
│   ├── sidebar.css               # Modern Sidebar (~100 Z)
│   ├── buttons.css               # Soft Buttons (~120 Z)
│   ├── cards.css                 # Card Components (~80 Z)
│   ├── modals.css                # Glass Modals (~100 Z)
│   ├── forms.css                 # Input Fields (~80 Z)
│   ├── status.css                # Animated Status (~60 Z)
│   └── dark-mode.css             # Dark Theme (~50 Z)
│
├── scheduling/
│   ├── calendar.css              # Calendar Styles (~200 Z)
│   └── dashboard.css             # Analytics Dashboard (~150 Z)
```

### Implementation-Reihenfolge (UI)

1. **Design Tokens** - Variables für konsistentes Design
2. **Toolbar** - Glassmorphism Header
3. **Sidebar** - Dark Glass Look
4. **Buttons** - Soft Shadows & Glow
5. **Cards & Modals** - Glass Effects
6. **Status-Indikatoren** - Animationen
7. **Dark Mode** - Theme Toggle

---

## Quellen

### Analytics
- [Umami Documentation](https://umami.is/docs)
- [Umami API Reference](https://umami.is/docs/api)
- [umami-kit (Scroll Tracking)](https://www.rhelmer.org/blog/automatic-event-tracking-with-umami-kit/)
- [PostHog Scroll Depth Tutorial](https://posthog.com/tutorials/scroll-depth)
- [OpenPanel Analytics Comparison](https://openpanel.dev/articles/open-source-web-analytics)

### Scheduling
- [DayPilot Lite (Calendar)](https://javascript.daypilot.org/open-source/)
- [react-big-calendar](https://github.com/jquense/react-big-calendar)

### UI Design 2025
- [Glassmorphism UI Trend 2025](https://www.designstudiouiux.com/blog/what-is-glassmorphism-ui-trend/)
- [Neumorphism vs Glassmorphism 2025](https://redliodesigns.com/blog/neumorphism-vs-glassmorphism-2025-ui-trends)
- [Top 10 UI Trends 2025](https://dev.to/ananiket/top-10-ui-trends-in-2025-you-must-follow-3l64)
- [Apple Liquid Glass Design](https://www.everydayux.net/glassmorphism-apple-liquid-glass-interface-design/)
