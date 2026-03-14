document.addEventListener('DOMContentLoaded', () => {
    const cartItemsList = document.getElementById('cartItemsList');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    const cartContent = document.getElementById('cartContent');
    const subtotalDisplay = document.getElementById('subtotalDisplay');
    const grandTotalDisplay = document.getElementById('grandTotalDisplay');

    const cepInput = document.getElementById('cepInput');

    let cart = JSON.parse(localStorage.getItem('vvribeiro_cart')) || [];

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
        updateGrandTotal(subtotal);
    };

    const updateGrandTotal = (sub) => {
        grandTotalDisplay.textContent = formatBRL(sub);
    };

    // Global expose for inline onclick handler
    window.removeItem = (index) => {
        cart.splice(index, 1);
        localStorage.setItem('vvribeiro_cart', JSON.stringify(cart));

        if (cart.length === 0) {
            cepInput.value = '';
        }

        renderCart();
    };

    // Auto-fetch address when CEP completes
    cepInput.addEventListener('input', async (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 5) {
            val = val.replace(/^(\d{5})(\d)/, '$1-$2');
        }
        e.target.value = val;

        let cep = val.replace(/\D/g, '');
        
        if (cep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await response.json();

                if (!data.erro) {
                    const streetInput = document.getElementById('addrStreet');
                    streetInput.value = data.logradouro || '';
                    document.getElementById('addrCity').value = data.localidade || '';
                    document.getElementById('addrState').value = data.uf || '';
                    
                    // Specific logic for generic city CEPs (no street returned)
                    if (data.logradouro) {
                        streetInput.setAttribute('readonly', true);
                        streetInput.style.opacity = '0.7';
                        document.getElementById('addrNumber').focus();
                    } else {
                        // Unlock street field so user can type it
                        streetInput.removeAttribute('readonly');
                        streetInput.style.opacity = '1';
                        streetInput.focus();
                    }
                }
            } catch (error) {
                console.error('Error fetching CEP:', error);
            }
        }
    });

    // Initial render
    renderCart();

    const checkoutCompleteBtn = document.getElementById('checkoutCompleteBtn');

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
            const phoneNumber = '5521999698170'; // User's actual WhatsApp number
            
            let message = `*Novo Pedido - Victor Ribeiro Fotografia*\n\n`;
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
            
            message += `*Total Final:* ${formatBRL(subtotal)}\n\n`;
            
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
