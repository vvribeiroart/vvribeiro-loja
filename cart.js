document.addEventListener('DOMContentLoaded', () => {
    const cartItemsList = document.getElementById('cartItemsList');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    const cartContent = document.getElementById('cartContent');
    const subtotalDisplay = document.getElementById('subtotalDisplay');
    const shippingDisplay = document.getElementById('shippingDisplay');
    const grandTotalDisplay = document.getElementById('grandTotalDisplay');

    const cepInput = document.getElementById('cepInput');
    const calcShippingBtn = document.getElementById('calcShippingBtn');
    const shippingMessage = document.getElementById('shippingMessage');

    let cart = JSON.parse(localStorage.getItem('vvribeiro_cart')) || [];
    let currentShippingCost = 0;

    // Currency Formatter
    const formatBRL = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const renderCart = () => {
        cartItemsList.innerHTML = '';
        let subtotal = 0;

        if (cart.length === 0) {
            emptyCartMessage.style.display = 'block';
            cartContent.style.display = 'none';
            return;
        }

        emptyCartMessage.style.display = 'none';
        cartContent.style.display = 'grid';

        cart.forEach((item, index) => {
            subtotal += item.price;

            const sizeLabels = {
                'a4': 'A4 (20x30cm)',
                'a3': 'A3 (30x40cm)',
                'a2': 'A2 (40x60cm)',
                'a1': 'A1 (60x85cm)'
            };

            const frameLabels = {
                'none': 'Sem Moldura',
                'black': 'Moldura Preta',
                'wood': 'Moldura Madeira',
                'white': 'Moldura Branca'
            };

            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';

            // Generate query string for editing
            const editParams = new URLSearchParams({
                img: item.img,
                title: item.title,
                artist: item.artist,
                desc: item.desc,
                editIndex: index // Important: pass the index to override
            }).toString();

            itemDiv.innerHTML = `
                <img src="${item.img}" alt="${item.title}" class="item-thumbnail">
                <div class="item-details">
                    <div class="item-top">
                        <div>
                            <div class="item-title">${item.title}</div>
                            <div class="item-specs">
                                <span>Tamanho: ${sizeLabels[item.size] || item.size}</span>
                                <span>Estilo: ${frameLabels[item.frame] || item.frame}</span>
                                ${item.passepartout ? '<span>Borda: Com Passepartout (5cm)</span>' : ''}
                            </div>
                        </div>
                        <div class="item-price">${formatBRL(item.price)}</div>
                    </div>
                    <div class="item-actions">
                        <button class="action-btn" onclick="window.location.href='index.html?${editParams}'">Editar</button>
                        <button class="action-btn remove" onclick="removeItem(${index})">Remover</button>
                    </div>
                </div>
            `;
            cartItemsList.appendChild(itemDiv);
        });

        // Update Totals
        subtotalDisplay.textContent = formatBRL(subtotal);
        updateGrandTotal(subtotal, currentShippingCost);
    };

    const updateGrandTotal = (sub, ship) => {
        grandTotalDisplay.textContent = formatBRL(sub + ship);
    };

    // Global expose for inline onclick handler
    window.removeItem = (index) => {
        cart.splice(index, 1);
        localStorage.setItem('vvribeiro_cart', JSON.stringify(cart));

        // Reset shipping if cart is empty
        if (cart.length === 0) {
            currentShippingCost = 0;
            shippingDisplay.textContent = 'R$ 0,00';
            shippingMessage.textContent = '';
            cepInput.value = '';
        }

        renderCart();
    };

    // Shipping Calculator via ViaCEP
    calcShippingBtn.addEventListener('click', async () => {
        let cep = cepInput.value.replace(/\D/g, ''); // Remove non-digits

        if (cep.length !== 8) {
            shippingMessage.textContent = 'CEP inválido. Digite 8 números.';
            shippingMessage.className = 'shipping-msg error';
            return;
        }

        shippingMessage.textContent = 'Calculando...';
        shippingMessage.className = 'shipping-msg';
        calcShippingBtn.disabled = true;

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (data.erro) {
                throw new Error('CEP não encontrado');
            }

            // Mocked Freight Logic by State (UF) - Dispatching from Itu, SP
            const uf = data.uf;
            const localidade = data.localidade;
            let cost = 0;
            let locationName = `${localidade}, ${uf}`;

            // Priority 1: Customer is in Itu, SP (Local delivery)
            if (localidade === 'Itu' && uf === 'SP') {
                cost = 15; // Extremely cheap local courier
            }
            // Priority 2: Customer is elsewhere in the state of São Paulo
            else if (uf === 'SP') {
                cost = 25; // Standard SP flat rate
            }
            // Priority 3: Neighboring states (Sudeste + PR)
            else if (['RJ', 'MG', 'PR'].includes(uf)) {
                cost = 45;
            }
            // Priority 4: Extended South/MidWest/ES
            else if (['ES', 'SC', 'RS', 'MS', 'GO', 'DF'].includes(uf)) {
                cost = 65;
            }
            // Priority 5: Far regions (Norte, Nordeste, MT)
            else {
                cost = 95;
            }

            // Add base cost + R$10 per extra item due to weight/volume packed
            if (cart.length > 1) {
                cost += (cart.length - 1) * 15;
            }

            currentShippingCost = cost;
            shippingDisplay.textContent = formatBRL(currentShippingCost);
            shippingMessage.textContent = `Frete (Correios) para ${locationName}`;
            shippingMessage.className = 'shipping-msg';

            // Trigger recalculation of total
            const subtotal = cart.reduce((acc, item) => acc + item.price, 0);
            updateGrandTotal(subtotal, currentShippingCost);

        } catch (error) {
            shippingMessage.textContent = 'Não foi possível calcular o frete para este CEP.';
            shippingMessage.className = 'shipping-msg error';
            currentShippingCost = 0;
            shippingDisplay.textContent = 'R$ 0,00';
            const subtotal = cart.reduce((acc, item) => acc + item.price, 0);
            updateGrandTotal(subtotal, currentShippingCost);
        } finally {
            calcShippingBtn.disabled = false;
        }
    });

    // Initial render
    renderCart();

    // Auto-calculate shipping for returning registered users
    const storedUser = localStorage.getItem('registeredUser');
    if (storedUser && cart.length > 0) {
        try {
            const userParams = JSON.parse(storedUser);
            if (userParams.cep) {
                cepInput.value = userParams.cep;
                // Programmatically execute the freight fetch
                calcShippingBtn.click();
            }
        } catch (e) {
            console.error('Failed to restore user shipping data', e);
        }
    }

    // CEP input formatter mask
    cepInput.addEventListener('input', function (e) {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 5) {
            val = val.replace(/^(\d{5})(\d)/, '$1-$2');
        }
        e.target.value = val;
    });

    // Enhanced Mercado Pago / Serverless Checkout Redirect
    const checkoutCompleteBtn = document.getElementById('checkoutCompleteBtn');
    checkoutCompleteBtn.addEventListener('click', async () => {
        if (cart.length === 0) return;

        // CHECK LOGIN STATE: If no registered user exists in localStorage, divert to Registration Flow
        const storedUser = localStorage.getItem('registeredUser');
        if (!storedUser) {
            window.location.href = 'register.html';
            return;
        }

        const customerDetails = JSON.parse(storedUser);

        checkoutCompleteBtn.disabled = true;
        const originalText = checkoutCompleteBtn.textContent;
        checkoutCompleteBtn.textContent = 'Gerando Pagamento...';

        try {
            // Send the cart data AND cached customer payload to our secure Vercel Serverless Function
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cartItems: cart,
                    shippingCost: currentShippingCost,
                    customer: customerDetails,
                    baseURL: window.location.origin
                })
            });

            if (!response.ok) {
                throw new Error('Falha ao comunicar com o servidor de pagamento.');
            }

            const data = await response.json();

            // Redirect user directly to the securely generated Mercado Pago checkout screen
            if (data.init_point) {
                window.location.href = data.init_point;
            } else {
                throw new Error('URL de pagamento não gerada.');
            }

        } catch (error) {
            console.error('Checkout Error:', error);
            alert('Houve um problema ao iniciar o pagamento. Por favor, tente novamente ou contate nossa equipe.');
            checkoutCompleteBtn.disabled = false;
            checkoutCompleteBtn.textContent = originalText;
        }
    });
});
