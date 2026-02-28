const { MercadoPagoConfig, Payment } = require('mercadopago');
const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
    // 1. Immediately return 200 OK so Mercado Pago doesn't retry the webhook infinitely
    res.status(200).send('OK');

    try {
        const { type, data, action } = req.body;

        // 2. Validate that this webhook is actually regarding a payment update
        if (type !== 'payment' && req.body.topic !== 'payment') {
            return;
        }

        const paymentId = data?.id || req.body.resource?.split('/').pop();
        if (!paymentId) {
            console.error('Webhook received payment event but no ID was found.');
            return;
        }

        // 3. Initialize MP SDK securely to fetch the ground-truth payment data
        const client = new MercadoPagoConfig({
            accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
        });
        const paymentClient = new Payment(client);

        // Query the official Payment object directly from MP servers to prevent spoofing
        const paymentInfo = await paymentClient.get({ id: paymentId });

        // 4. Do nothing if the payment isn't fully approved/paid yet.
        // We do not want to annoy the artist with pending boleto emails.
        if (paymentInfo.status !== 'approved') {
            console.log(`Payment ${paymentId} received update but status is: ${paymentInfo.status}`);
            return;
        }

        const { payer, additional_info, transaction_amount } = paymentInfo;

        // 5. Initialize Nodemailer using the Vercel app password
        if (!process.env.GMAIL_APP_PASSWORD || !process.env.GMAIL_USER) {
            console.warn('WARNING: GMAIL_APP_PASSWORD is not set in Vercel. Sale was approved, but confirmation email cannot be dispatched.');
            return;
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        // 6. Format the payload into a clean HTML email receipt
        let itemsHtml = '<ul style="list-style: none; padding-left: 0;">';
        if (additional_info && additional_info.items) {
            additional_info.items.forEach(item => {
                itemsHtml += `<li style="margin-bottom: 5px;"><strong>${item.quantity}x</strong> ${item.title} - R$ ${Number(item.unit_price).toFixed(2)}</li>`;
            });
        }
        itemsHtml += '</ul>';

        // Extract contact info
        const name = payer?.first_name || payer?.name || 'Cliente';
        const email = payer?.email || 'N/A';
        const phone = (payer?.phone && payer.phone.number) ? payer.phone.number : 'N/A';

        // Extract shipping info. We injected this heavily during checkout so it should exist.
        let addressStr = 'Endereço não detalhado';
        const addr = payer?.address;
        if (addr) {
            addressStr = `${addr.street_name || ''}, ${addr.street_number || 'S/N'} <br/> CEP: ${addr.zip_code || ''}`;
        }

        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: 'vvribeiro.art@gmail.com', // Delivering directly to the artist
            subject: `🎉 Venda Confirmada! Pagamento #${paymentId}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #ea580c; color: white; padding: 20px; text-align: center;">
                        <h2 style="margin: 0;">Pagamento Aprovado!</h2>
                    </div>
                    
                    <div style="padding: 20px;">
                        <p style="font-size: 1.1em; text-align: center;">Você acaba de realizar uma venda no valor de <strong>R$ ${Number(transaction_amount).toFixed(2)}</strong>.</p>
                        
                        <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px; margin-top: 30px;">Itens do Pedido</h3>
                        ${itemsHtml}

                        <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px; margin-top: 30px;">Dados do Cliente</h3>
                        <p><strong>Nome:</strong> ${name}</p>
                        <p><strong>E-mail:</strong> ${email}</p>
                        <p><strong>WhatsApp/Telefone:</strong> ${phone}</p>
                        
                        <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px; margin-top: 30px;">Endereço de Entrega</h3>
                        <p>${addressStr}</p>
                    </div>

                    <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 0.8em; color: #666; border-top: 1px solid #ddd;">
                        Mercado Pago ID: ${paymentId} <br>
                        Verifique o status da entrega no seu painel do Mercado Pago.
                    </div>
                </div>
            `
        };

        // 7. Dispatch!
        console.log(`Dispatching approval email for payment ${paymentId}...`);
        await transporter.sendMail(mailOptions);
        console.log(`Email dispatched successfully!`);

    } catch (error) {
        // Since we already returned 200 OK, this is mostly for Vercel logging
        console.error('Webhook execution failed:', error);
    }
};
