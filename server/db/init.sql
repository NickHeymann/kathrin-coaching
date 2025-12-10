-- Kathrin Coaching - Database Schema
-- Wird automatisch beim ersten Start von PostgreSQL ausgeführt

-- Scheduled Posts Tabelle
CREATE TABLE IF NOT EXISTS scheduled_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content JSONB NOT NULL,
    excerpt TEXT,
    categories TEXT[] DEFAULT '{}',
    featured_image VARCHAR(500),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    author_notes TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index für schnelle Abfragen nach Datum
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_date
ON scheduled_posts(scheduled_for)
WHERE status = 'scheduled';

-- Index für Kalender-Abfragen (Monat/Jahr)
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_calendar
ON scheduled_posts(EXTRACT(YEAR FROM scheduled_for), EXTRACT(MONTH FROM scheduled_for));

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_updated_at
BEFORE UPDATE ON scheduled_posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Kommentar für Dokumentation
COMMENT ON TABLE scheduled_posts IS 'Blog-Beiträge mit Scheduling-Funktionalität';
