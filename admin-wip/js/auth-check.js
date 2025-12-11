/* auth-check.js
 * Auth-Wrapper für Editoren (CMS, Blog)
 * Lädt bei Supabase-Login den Token automatisch
 */

// Supabase Status
let supabaseReady = false;
let supabaseUser = null;

/**
 * Initialisiert Auth-Check
 * Lädt Token aus Supabase wenn eingeloggt, sonst Fallback auf localStorage
 */
async function initAuthCheck() {
    // Prüfe ob Supabase SDK geladen ist
    if (typeof window.supabase === 'undefined') {
        console.log('Auth: Supabase SDK nicht geladen, nutze lokalen Token');
        return { source: 'local', token: null };
    }

    try {
        // Initialisiere Supabase
        const client = window.supabase.createClient(
            'https://mvioqftcgdtchtykeopc.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12aW9xZnRjZ2R0Y2h0eWtlb3BjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTI3MzAsImV4cCI6MjA4MDk2ODczMH0.X5OlmH6kE-tGZGO8liduQzYNy5cbyLaBoq5PPG2yvUc'
        );

        // Prüfe Session
        const { data: { session } } = await client.auth.getSession();

        if (!session) {
            console.log('Auth: Nicht eingeloggt, nutze lokalen Token');
            return { source: 'local', token: null };
        }

        supabaseReady = true;
        supabaseUser = session.user;
        console.log('Auth: Supabase-Login erkannt:', session.user.email);

        // Lade GitHub Token aus Supabase
        const token = await loadTokenFromSupabase(client, session.user.id);

        if (token) {
            console.log('Auth: GitHub Token aus Supabase geladen');
            return { source: 'supabase', token: token };
        }

        // Kein Token in Supabase, aber eingeloggt
        // Migriere eventuell vorhandenen lokalen Token
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

        // Entschlüsseln
        return decryptKey(data.key_value);
    } catch {
        return null;
    }
}

/**
 * Speichert Token in Supabase
 */
async function saveTokenToSupabase(client, userId, token) {
    try {
        const encrypted = encryptKey(token);
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
    const key = getDeviceKey();
    const encrypted = localStorage.getItem('cms_encrypted_token');

    if (encrypted) {
        try {
            const text = atob(encrypted);
            let result = '';
            for (let i = 0; i < text.length; i++) {
                result += String.fromCharCode(
                    text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
                );
            }
            if (result.startsWith('ghp_') || result.startsWith('github_pat_')) {
                return result;
            }
        } catch {}
    }

    // Fallback alte Speicherorte
    return sessionStorage.getItem('github_token') || localStorage.getItem('github_token');
}

/**
 * Geräte-spezifischer Schlüssel für Verschlüsselung
 */
function getDeviceKey() {
    return [
        navigator.userAgent.slice(0, 30),
        navigator.language,
        screen.width + 'x' + screen.height
    ].join('|');
}

/**
 * Einfache Verschlüsselung
 */
function encryptKey(value) {
    const key = getDeviceKey();
    let result = '';
    for (let i = 0; i < value.length; i++) {
        result += String.fromCharCode(
            value.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
    }
    return btoa(result);
}

/**
 * Einfache Entschlüsselung
 */
function decryptKey(encoded) {
    try {
        const key = getDeviceKey();
        const text = atob(encoded);
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(
                text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
        }
        return result;
    } catch {
        return null;
    }
}

/**
 * Prüft ob User bei Supabase eingeloggt ist
 */
function isSupabaseLoggedIn() {
    return supabaseReady && supabaseUser !== null;
}

/**
 * Holt aktuellen Supabase User
 */
function getSupabaseUser() {
    return supabaseUser;
}

// Export für globalen Zugriff
window.AuthCheck = {
    init: initAuthCheck,
    isSupabaseLoggedIn,
    getSupabaseUser,
    loadLocalToken
};
