// auth.js - Global Authentication Manager using localStorage

const initAuth = () => {
    // Ensure usersDB exists
    if (!localStorage.getItem('usersDB')) {
        localStorage.setItem('usersDB', JSON.stringify([]));
    }
};

const getActiveUser = () => {
    const user = localStorage.getItem('activeUser');
    return user ? JSON.parse(user) : null;
};

const updateHeaderAuth = () => {
    const authContainer = document.getElementById('auth-links-container');
    if (!authContainer) return;

    const user = getActiveUser();
    if (user) {
        // Assume user has a name property
        const firstName = user.name ? user.name.split(' ')[0] : 'Usuário';
        authContainer.innerHTML = `
            <span class="auth-greeting">Olá, ${firstName}</span>
            <span class="auth-separator">|</span>
            <a href="#" id="logout-btn" class="auth-link">Sair</a>
        `;

        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('activeUser');
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
    initAuth();
    updateHeaderAuth();
});
