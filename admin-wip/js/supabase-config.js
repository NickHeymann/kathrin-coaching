/* supabase-config.js
 * Supabase Client Configuration
 * Zentrale Auth-Konfiguration für alle Admin-Tools
 */

const SUPABASE_URL = 'https://mvioqftcgdtchtykeopc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12aW9xZnRjZ2R0Y2h0eWtlb3BjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTI3MzAsImV4cCI6MjA4MDk2ODczMH0.X5OlmH6kE-tGZGO8liduQzYNy5cbyLaBoq5PPG2yvUc';

// Supabase Client initialisieren (verwendet CDN-Version)
let supabase = null;

function initSupabase() {
    if (supabase) return supabase;

    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.error('Supabase SDK nicht geladen');
    }
    return supabase;
}

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initSupabase, SUPABASE_URL, SUPABASE_ANON_KEY };
}
