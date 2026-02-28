document.addEventListener('DOMContentLoaded', () => {
    const step1Form = document.getElementById('step1Form');
    const step2Form = document.getElementById('step2Form');
    const step3Form = document.getElementById('step3Form');

    const forgotErrorMsg = document.getElementById('forgotErrorMsg');
    const forgotSuccessMsg = document.getElementById('forgotSuccessMsg');

    const submitBtn = document.getElementById('btnSendCode'); // Will add ID to button in HTML

    const showError = (msg) => {
        forgotErrorMsg.textContent = msg;
        forgotErrorMsg.style.display = 'block';
        forgotSuccessMsg.style.display = 'none';
    };

    const showSuccess = (msg) => {
        forgotSuccessMsg.textContent = msg;
        forgotSuccessMsg.style.display = 'block';
        forgotErrorMsg.style.display = 'none';
    };

    // Step 1: Request Password Reset Link (Supabase Magic Link)
    step1Form.addEventListener('submit', async (e) => {
        e.preventDefault();
        forgotErrorMsg.style.display = 'none';

        const button = step1Form.querySelector('button[type="submit"]');
        button.disabled = true;
        const originalText = button.textContent;
        button.textContent = 'Enviando...';

        const email = document.getElementById('forgotEmail').value.trim();

        try {
            // Native Supabase API to trigger standard reset email
            const { data, error } = await window.supabase.auth.resetPasswordForEmail(email, {
                // Where Supabase returns the user after they click the email link
                redirectTo: window.location.origin + '/gallery.html',
            });

            if (error) {
                showError('Não conseguimos enviar o link. Erro: ' + error.message);
                throw error;
            }

            // In a real Supabase flow, we don't ask for a 4 digit code.
            // Rather, Supabase emails them a magic link that automatically logs them in.
            // So we just tell them to check their email!
            showSuccess('Um e-mail foi enviado para você! Clique no link dentro do e-mail para redefinir sua senha.');

            // Hide form to prevent re-submits
            step1Form.style.display = 'none';

            // We NO LONGER NEED Step 2 and Step 3 locally, because Supabase handles the session natively via email link!

        } catch (error) {
            console.error(error);
            button.disabled = false;
            button.textContent = originalText;
        }
    });

});
