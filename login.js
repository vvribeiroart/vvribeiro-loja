document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginErrorMsg = document.getElementById('loginErrorMsg');
    const passwordErrorMsg = document.getElementById('passwordErrorMsg');
    const submitBtn = document.getElementById('submitLoginBtn');

    // Redirect if already logged in via Supabase
    window.supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            window.location.href = 'cart.html';
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        loginErrorMsg.style.display = 'none';
        passwordErrorMsg.style.display = 'none';

        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Autenticando...';

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        try {
            const { data, error } = await window.supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                // Supabase returns standard error messages we can parse
                if (error.message.includes('Invalid login credentials')) {
                    passwordErrorMsg.textContent = 'E-mail ou senha incorretos.';
                    passwordErrorMsg.style.display = 'block';
                } else if (error.message.includes('Email not confirmed')) {
                    loginErrorMsg.textContent = 'Confirme o e-mail na sua caixa de entrada antes de fazer login.';
                    loginErrorMsg.style.display = 'block';
                } else {
                    loginErrorMsg.textContent = 'Erro de autenticação: ' + error.message;
                    loginErrorMsg.style.display = 'block';
                }
                throw error;
            }

            // Login successful through Supabase, redirect to cart
            window.location.href = 'cart.html';

        } catch (error) {
            console.error('Login Error:', error);
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
});
