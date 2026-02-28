document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginErrorMsg = document.getElementById('loginErrorMsg');
    const passwordErrorMsg = document.getElementById('passwordErrorMsg');

    // Redirect if already logged in
    if (localStorage.getItem('activeUser')) {
        window.location.href = 'cart.html';
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        loginErrorMsg.style.display = 'none';
        passwordErrorMsg.style.display = 'none';

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        const usersDB = JSON.parse(localStorage.getItem('usersDB') || '[]');
        const userFound = usersDB.find(u => u.email === email);

        if (!userFound) {
            loginErrorMsg.style.display = 'block';
            return;
        }

        if (userFound.password !== password) {
            passwordErrorMsg.style.display = 'block';
            return;
        }

        // Login successful
        const sessionPayload = { ...userFound };
        delete sessionPayload.password;
        localStorage.setItem('activeUser', JSON.stringify(sessionPayload));

        // Redirect to cart because login is mostly used during checkout flow
        window.location.href = 'cart.html';
    });
});
