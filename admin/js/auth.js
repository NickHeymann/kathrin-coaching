/* auth.js
 * Authentication Functions für Supabase
 * Verwendet von: Login-Seite, Dashboard, CMS, Blog-Editor
 */

const auth = {
    // Registrierung (falls später benötigt)
    async signUp(email, password) {
        const client = initSupabase();
        const { data, error } = await client.auth.signUp({
            email,
            password
        });
        if (error) throw error;
        return data;
    },

    // Login
    async signIn(email, password) {
        const client = initSupabase();
        const { data, error } = await client.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    },

    // Logout
    async signOut() {
        const client = initSupabase();
        const { error } = await client.auth.signOut();
        if (error) throw error;
    },

    // Passwort-Reset Email senden
    async resetPassword(email) {
        const client = initSupabase();
        const redirectUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/reset-password.html');
        const { data, error } = await client.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl
        });
        if (error) throw error;
        return data;
    },

    // Neues Passwort setzen (nach Reset-Link)
    async updatePassword(newPassword) {
        const client = initSupabase();
        const { data, error } = await client.auth.updateUser({
            password: newPassword
        });
        if (error) throw error;
        return data;
    },

    // Aktueller User
    async getUser() {
        const client = initSupabase();
        const { data: { user } } = await client.auth.getUser();
        return user;
    },

    // Session prüfen
    async getSession() {
        const client = initSupabase();
        const { data: { session } } = await client.auth.getSession();
        return session;
    },

    // Auth-Schutz: Redirect zu Login wenn nicht eingeloggt
    async requireAuth(redirectUrl = null) {
        const session = await this.getSession();
        if (!session) {
            if (redirectUrl) {
                sessionStorage.setItem('auth_redirect', redirectUrl);
            } else {
                sessionStorage.setItem('auth_redirect', window.location.href);
            }
            window.location.href = './';
            return false;
        }
        return true;
    },

    // Nach Login: Redirect zur ursprünglichen Seite
    getRedirectUrl() {
        const redirect = sessionStorage.getItem('auth_redirect');
        sessionStorage.removeItem('auth_redirect');
        return redirect;
    },

    // Auth State Listener
    onAuthStateChange(callback) {
        const client = initSupabase();
        return client.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
    }
};

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = auth;
}
