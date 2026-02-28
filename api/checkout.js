const { MercadoPagoConfig, Preference } = require('mercadopago');

module.exports = async (req, res) => {
    // Only allow POST requests locally and on Vercel
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // Initialize the client using the private token securely stored in Vercel Environment Variables
        const client = new MercadoPagoConfig({
            accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
        });

        const preference = new Preference(client);

        // Destructure payload from frontend
        const { cartItems, shippingCost, customer, baseURL } = req.body;

        // Map the cart.js format into Mercado Pago's strict API requirements
        const items = cartItems.map(item => ({
            title: `Arte: ${item.title} (${item.size.toUpperCase()})`,
            description: `Moldura: ${item.frame}${item.passepartout ? ' + Passepartout' : ''}`,
            quantity: 1,
            unit_price: Number(item.price),
            currency_id: 'BRL',
        }));

        // Append the simulated shipping cost as its own item if applicable
        if (shippingCost && Number(shippingCost) > 0) {
            items.push({
                title: 'Frete (Correios/Transportadora)',
                quantity: 1,
                unit_price: Number(shippingCost),
                currency_id: 'BRL',
            });
        }

        // Generate the preference object in Mercado Pago
        const response = await preference.create({
            body: {
                items: items,
                payer: {
                    name: customer.name,
                    email: customer.email,
                    phone: {
                        number: customer.phone
                    },
                    address: {
                        zip_code: customer.cep,
                        street_name: customer.street,
                        street_number: customer.number || 'S/N'
                    }
                },
                shipments: {
                    cost: Number(shippingCost) || 0,
                    mode: "not_specified",
                    receiver_address: {
                        zip_code: customer.cep,
                        state_name: customer.state,
                        city_name: customer.city,
                        street_name: customer.street,
                        street_number: customer.number || 'S/N',
                        apartment: customer.complement || ''
                    }
                },
                back_urls: {
                    success: `https://vvribeiro.com/gallery.html?payment=success`,
                    failure: `https://vvribeiro.com/cart.html?payment=failure`,
                    pending: `https://vvribeiro.com/cart.html?payment=pending`,
                },
                auto_return: 'approved',
                statement_descriptor: "VICTOR RIBEIRO",
                notification_url: "https://vvribeiro.com/api/webhook"
            }
        });

        // Send back both the Preference ID (if using custom checkout UI) and the direct init_point URL
        res.status(200).json({
            id: response.id,
            init_point: response.init_point
        });

    } catch (error) {
        console.error('Mercado Pago Error:', error);
        res.status(500).json({
            error: 'Erro interno ao tentar gerar o link de pagamento. Por favor, tente novamente.'
        });
    }
};
