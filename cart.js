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

            // Auto-fill address fields from ViaCEP
            if (!data.erro) {
                document.getElementById('addrStreet').value = data.logradouro || '';
                document.getElementById('addrCity').value = data.localidade || '';
                document.getElementById('addrState').value = data.uf || '';
                // Set focus to the number input since street is filled
                if(data.logradouro) document.getElementById('addrNumber').focus();
            }

            // Activate the checkout button now that shipping is verified
            const checkoutCompleteBtn = document.getElementById('checkoutCompleteBtn');
            checkoutCompleteBtn.disabled = false;
            checkoutCompleteBtn.style.opacity = '1';
            checkoutCompleteBtn.style.cursor = 'pointer';

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

    // Lock checkout initially until shipping calculates
    checkoutCompleteBtn.disabled = true;
    checkoutCompleteBtn.style.opacity = '0.5';
    checkoutCompleteBtn.style.cursor = 'not-allowed';

    checkoutCompleteBtn.addEventListener('click', async () => {
        if (cart.length === 0) return;

        // Extract customer payload from the form
        const customerDetails = {
            name: document.getElementById('customerName').value.trim(),
            email: document.getElementById('customerEmail').value.trim(),
            phone: document.getElementById('customerPhone').value.trim(),
            cep: cepInput.value.replace(/\D/g, ''),
            street: document.getElementById('addrStreet').value.trim(),
            number: document.getElementById('addrNumber').value.trim(),
            complement: document.getElementById('addrComplement').value.trim(),
            city: document.getElementById('addrCity').value.trim(),
            state: document.getElementById('addrState').value.trim()
        };
        
        // Basic validation
        if(!customerDetails.name || !customerDetails.phone || !customerDetails.street || !customerDetails.number || !customerDetails.cep) {
            alert('Por favor, preencha todos os campos obrigatórios de entrega (Nome, Telefone e Endereço).');
            return;
        }

        checkoutCompleteBtn.disabled = true;
        const originalText = checkoutCompleteBtn.textContent;
        checkoutCompleteBtn.textContent = 'Redirecionando para o WhatsApp...';

        try {
            // Build the WhatsApp message
            const phoneNumber = '5511999999999'; // Replace with the actual WhatsApp number
            
            let message = `*Novo Pedido - lemmeknow*\n\n`;
            message += `*Cliente:* ${customerDetails.name}\n`;
            message += `*Email:* ${customerDetails.email}\n`;
            message += `*Telefone:* ${customerDetails.phone}\n\n`;
            
            message += `*Itens do Pedido:*\n`;
            
            cart.forEach((item, index) => {
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
                
                message += `${index + 1}. ${item.title} (${sizeLabels[item.size] || item.size})\n`;
                message += `   Estilo: ${frameLabels[item.frame] || item.frame}\n`;
                if(item.passepartout) {
                    message += `   Borda: Com Passepartout (5cm)\n`;
                }
                message += `   Preço: ${formatBRL(item.price)}\n\n`;
            });

            const subtotal = cart.reduce((acc, item) => acc + item.price, 0);
            
            message += `*Subtotal:* ${formatBRL(subtotal)}\n`;
            message += `*Frete:* ${formatBRL(currentShippingCost)}\n`;
            message += `*Total Final:* ${formatBRL(subtotal + currentShippingCost)}\n\n`;
            
            message += `*Endereço de Entrega:*\n`;
            message += `CEP: ${customerDetails.cep}\n`;
            message += `${customerDetails.street}, ${customerDetails.number || 'S/N'}\n`;
            if (customerDetails.complement) {
                message += `${customerDetails.complement}\n`;
            }
            message += `${customerDetails.city} - ${customerDetails.state}\n`;

            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

            // Redirect user directly to WhatsApp
            window.location.href = whatsappUrl;

        } catch (error) {
            console.error('Checkout Error:', error);
            alert('Houve um problema ao processar o pedido. Por favor, tente novamente ou contate nossa equipe.');
            checkoutCompleteBtn.disabled = false;
            checkoutCompleteBtn.textContent = originalText;
        }
    });
});
