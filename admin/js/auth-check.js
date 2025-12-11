/* auth-check.js
 * Auth-Wrapper für Editoren (CMS, Blog)
 * Lädt bei Supabase-Login den Token automatisch
 * Nutzt CryptoUtils für Verschlüsselung (crypto-utils.js muss zuerst geladen werden)
 */

// Supabase Status
let supabaseReady = false;
let supabaseUser = null;

// Helper: CryptoUtils wrapper mit Fallback
function encrypt(value) {
    if (window.CryptoUtils) return window.CryptoUtils.encrypt(value);
    console.warn('CryptoUtils nicht geladen');
    return btoa(value);
}

function decrypt(encoded) {
    if (window.CryptoUtils) return window.CryptoUtils.decrypt(encoded);
    try { return atob(encoded); } catch { return null; }
}

/**
 * Initialisiert Auth-Check
 * Lädt Token aus Supabase wenn eingeloggt, sonst Fallback auf localStorage
 */
async function initAuthCheck() {
    if (typeof window.supabase === 'undefined') {
        console.log('Auth: Supabase SDK nicht geladen, nutze lokalen Token');
        return { source: 'local', token: null };
    }

    try {
        const client = window.supabase.createClient(
            'https://mvioqftcgdtchtykeopc.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12aW9xZnRjZ2R0Y2h0eWtlb3BjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTI3MzAsImV4cCI6MjA4MDk2ODczMH0.X5OlmH6kE-tGZGO8liduQzYNy5cbyLaBoq5PPG2yvUc'
        );

        const { data: { session } } = await client.auth.getSession();

        if (!session) {
            console.log('Auth: Nicht eingeloggt, nutze lokalen Token');
            return { source: 'local', token: null };
        }

        supabaseReady = true;
        supabaseUser = session.user;
        console.log('Auth: Supabase-Login erkannt:', session.user.email);

        const token = await loadTokenFromSupabase(client, session.user.id);

        if (token) {
            console.log('Auth: GitHub Token aus Supabase geladen');
            return { source: 'supabase', token: token };
        }

        const localToken = loadLocalToken();
        if (localToken) {
            console.log('Auth: Migriere lokalen Token zu Supabase');
            await saveTokenToSupabase(client, session.user.id, localToken);
            return { source: 'migrated', token: localToken };
        }

        return { source: 'supabase', token: null };

    } catch (e) {
        console.warn('Auth: Supabase-Fehler, nutze Fallback:', e);
        return { source: 'local', token: null };
    }
}

/**
 * Lädt Token aus Supabase api_keys Tabelle
 */
async function loadTokenFromSupabase(client, userId) {
    try {
        const { data, error } = await client
            .from('api_keys')
            .select('key_value')
            .eq('user_id', userId)
            .eq('key_name', 'github_token')
            .single();

        if (error || !data) return null;

        return decrypt(data.key_value);
    } catch {
        return null;
    }
}

/**
 * Speichert Token in Supabase
 */
async function saveTokenToSupabase(client, userId, token) {
    try {
        const encrypted = encrypt(token);
        await client
            .from('api_keys')
            .upsert({
                user_id: userId,
                key_name: 'github_token',
                key_value: encrypted
            }, {
                onConflict: 'user_id,key_name'
            });
    } catch (e) {
        console.warn('Token-Speicherung fehlgeschlagen:', e);
    }
}

/**
 * Lädt Token aus lokalem Storage (Fallback)
 */
function loadLocalToken() {
    const encrypted = localStorage.getItem('cms_encrypted_token');

    if (encrypted) {
        const result = decrypt(encrypted);
        if (result && (result.startsWith('ghp_') || result.startsWith('github_pat_'))) {
            return result;
        }
    }

    return sessionStorage.getItem('github_token') || localStorage.getItem('github_token');
}

function isSupabaseLoggedIn() {
    return supabaseReady && supabaseUser !== null;
}

function getSupabaseUser() {
    return supabaseUser;
}

/**
 * Globale Funktion für Editoren: Lädt GitHub Token
 * WICHTIG: Diese Funktion wird von cms/js/storage.js und js/blog-editor-github.js erwartet!
 */
async function loadGithubToken() {
    const result = await initAuthCheck();
    return result.token;
}

// Export für globalen Zugriff
window.loadGithubToken = loadGithubToken;
window.AuthCheck = {
    init: initAuthCheck,
    isSupabaseLoggedIn,
    getSupabaseUser,
    loadLocalToken,
    loadGithubToken
};
