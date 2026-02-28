document.addEventListener('DOMContentLoaded', () => {
    const step1Form = document.getElementById('step1Form');
    const step2Form = document.getElementById('step2Form');
    const step3Form = document.getElementById('step3Form');

    const forgotErrorMsg = document.getElementById('forgotErrorMsg');
    const forgotSuccessMsg = document.getElementById('forgotSuccessMsg');

    const newPasswordError = document.getElementById('newPasswordError');
    const newPasswordInput = document.getElementById('newPassword');

    let activeEmailForReset = null;
    let expectedCode = null;

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

    function validatePassword(password) {
        const errors = [];
        if (password.length < 8) errors.push('Mínimo 8 caracteres');
        if (!/\d/.test(password)) errors.push('Pelo menos 1 número');
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Pelo menos 1 símbolo (!@#...)');
        return errors;
    }

    newPasswordInput.addEventListener('input', (e) => {
        const errors = validatePassword(e.target.value);
        if (errors.length > 0 && e.target.value.length > 0) {
            newPasswordError.style.display = 'block';
            newPasswordError.innerHTML = errors.join('<br>');
        } else {
            newPasswordError.style.display = 'none';
        }
    });

    // Step 1: Request Code
    step1Form.addEventListener('submit', (e) => {
        e.preventDefault();
        forgotErrorMsg.style.display = 'none';

        const email = document.getElementById('forgotEmail').value.trim();
        const usersDB = JSON.parse(localStorage.getItem('usersDB') || '[]');
        const userFound = usersDB.find(u => u.email === email);

        if (!userFound) {
            showError('Conta não encontrada. Verifique o e-mail digitado.');
            return;
        }

        activeEmailForReset = email;
        expectedCode = Math.floor(1000 + Math.random() * 9000).toString(); // Generate 4 digit code

        // Display simulated code for testing purposes using an alert
        alert(`SUCESSO - E-mail de Recuperação Enviado!\n(Simulação) Seu código é: ${expectedCode}`);

        showSuccess('Código enviado para o seu e-mail!');

        step1Form.style.display = 'none';
        step2Form.style.display = 'flex';
    });

    // Step 2: Verify Code
    step2Form.addEventListener('submit', (e) => {
        e.preventDefault();
        forgotErrorMsg.style.display = 'none';

        const inputCode = document.getElementById('recoveryCode').value.trim();

        if (inputCode !== expectedCode) {
            showError('Código incorreto. Tente novamente.');
            return;
        }

        forgotSuccessMsg.style.display = 'none';
        step2Form.style.display = 'none';
        step3Form.style.display = 'flex';
    });

    // Step 3: Set New Password
    step3Form.addEventListener('submit', (e) => {
        e.preventDefault();
        forgotErrorMsg.style.display = 'none';

        const password = newPasswordInput.value;
        const passwordErrors = validatePassword(password);

        if (passwordErrors.length > 0) {
            newPasswordInput.focus();
            return;
        }

        const usersDB = JSON.parse(localStorage.getItem('usersDB') || '[]');
        const userIndex = usersDB.findIndex(u => u.email === activeEmailForReset);

        if (userIndex === -1) {
            showError('Erro crítico. Usuário não encontrado no banco de dados.');
            return;
        }

        // Update password and discard the old one
        usersDB[userIndex].password = password;
        localStorage.setItem('usersDB', JSON.stringify(usersDB));

        alert('Senha redefinida com sucesso! Você já pode fazer login com a nova senha.');
        window.location.href = 'login.html';
    });
});
