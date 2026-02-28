// auth.js - Global Authentication Manager using Supabase

// Get active session asynchronously
const getActiveUser = async () => {
    try {
        const { data: { session }, error } = await window.supabase.auth.getSession();
        if (error) throw error;
        return session ? session.user : null;
    } catch (error) {
        console.error("Error fetching Supabase session:", error.message);
        return null; // Return null if Supabase isn't configured yet or there's an error
    }
};

const updateHeaderAuth = async () => {
    const authContainer = document.getElementById('auth-links-container');
    if (!authContainer) return;

    const user = await getActiveUser();

    if (user) {
        // Retrieve the user's name from their user metadata
        const fullName = user.user_metadata?.name || 'Usuário';
        const firstName = fullName.split(' ')[0];

        authContainer.innerHTML = `
            <span class="auth-greeting">Olá, ${firstName}</span>
            <span class="auth-separator">|</span>
            <a href="#" id="logout-btn" class="auth-link">Sair</a>
        `;

        document.getElementById('logout-btn').addEventListener('click', async (e) => {
            e.preventDefault();
            await window.supabase.auth.signOut();
            window.location.reload();
        });
    } else {
        authContainer.innerHTML = `
            <a href="login.html" class="auth-link">Login</a>
            <span class="auth-separator">|</span>
            <a href="register.html" class="auth-link">Criar conta</a>
        `;
    }
};

// Initialize auth state and header on load
document.addEventListener('DOMContentLoaded', () => {
    updateHeaderAuth();

    // Listen for auth events (login, logout, token refresh)
    if (window.supabase) {
        window.supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                updateHeaderAuth();
            }
        });
    }
});
