document.addEventListener('DOMContentLoaded', () => {
    const calcCepBtn = document.getElementById('regCalcCepBtn');
    const cepInput = document.getElementById('regCep');
    const cepMessage = document.getElementById('regCepMessage');
    const passwordInput = document.getElementById('regPassword');
    const passwordError = document.getElementById('passwordError');
    const registerForm = document.getElementById('registerForm');
    const submitBtn = document.getElementById('submitRegisterBtn');

    // CEP input formatter mask
    cepInput.addEventListener('input', function (e) {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 5) {
            val = val.replace(/^(\d{5})(\d)/, '$1-$2');
        }
        e.target.value = val;
    });

    // Shipping Calculator via ViaCEP
    calcCepBtn.addEventListener('click', async () => {
        let cep = cepInput.value.replace(/\D/g, '');

        if (cep.length !== 8) {
            cepMessage.textContent = 'CEP inválido. Digite 8 números.';
            cepMessage.style.color = '#ff6b6b';
            return;
        }

        cepMessage.textContent = 'Buscando endereço...';
        cepMessage.style.color = 'var(--text-secondary)';
        calcCepBtn.disabled = true;

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (data.erro) {
                throw new Error('CEP não encontrado');
            }

            // Auto-fill the customer address form fields instantly
            document.getElementById('regStreet').value = data.logradouro || '';
            document.getElementById('regDistrict').value = data.bairro || '';
            document.getElementById('regCity').value = data.localidade || '';
            document.getElementById('regState').value = data.uf || '';

            cepMessage.textContent = 'Endereço encontrado!';
            cepMessage.style.color = '#51cf66';

            // Focus on number input after auto-fill
            document.getElementById('regNumber').focus();

        } catch (error) {
            cepMessage.textContent = 'Não foi possível encontrar o CEP.';
            cepMessage.style.color = '#ff6b6b';
        } finally {
            calcCepBtn.disabled = false;
        }
    });

    // Password Validation Logic
    function validatePassword(password) {
        const errors = [];
        if (password.length < 8) errors.push('Mínimo 8 caracteres');
        if (!/\d/.test(password)) errors.push('Pelo menos 1 número');
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Pelo menos 1 símbolo (!@#...)');
        return errors;
    }

    passwordInput.addEventListener('input', (e) => {
        const errors = validatePassword(e.target.value);
        if (errors.length > 0 && e.target.value.length > 0) {
            passwordError.style.display = 'block';
            passwordError.innerHTML = errors.join('<br>');
        } else {
            passwordError.style.display = 'none';
        }
    });

    // Form Submission Override
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = passwordInput.value;
        const passwordErrors = validatePassword(password);

        if (passwordErrors.length > 0) {
            passwordInput.focus();
            return;
        }

        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Criando Conta...';

        const customerPayload = {
            name: document.getElementById('regName').value.trim(),
            email: document.getElementById('regEmail').value.trim(),
            phone: document.getElementById('regPhone').value.trim(),
            password: password,
            cep: document.getElementById('regCep').value.replace(/\D/g, ''),
            street: document.getElementById('regStreet').value.trim(),
            number: document.getElementById('regNumber').value.trim(),
            complement: document.getElementById('regComplement').value.trim(),
            district: document.getElementById('regDistrict').value.trim(),
            city: document.getElementById('regCity').value.trim(),
            state: document.getElementById('regState').value.trim().toUpperCase()
        };

        // Success! Save customer details locally to bypass the register screen later
        // We deliberately DO NOT save the password to localStorage for security
        const safePayload = { ...customerPayload };
        delete safePayload.password;

        localStorage.setItem('registeredUser', JSON.stringify(safePayload));

        // Redirect smoothly back to the cart to finalize the Mercado Pago checkout
        window.location.href = 'cart.html';
    });
});
