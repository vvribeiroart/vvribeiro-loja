const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve the static frontend files (HTML, CSS, JS, Images) from the current directory
app.use(express.static(__dirname));

// Map the Vercel-style /api/checkout route to our local handler
app.post('/api/checkout', async (req, res) => {
    try {
        // Dynamically load the Vercel serverless function
        const checkoutHandler = require('./api/checkout.js');
        // Execute it, passing in the express req and res objects (which are compatible)
        await checkoutHandler(req, res);
    } catch (error) {
        console.error('Local Server Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Map the Vercel-style /api/webhook route to simulate Mercado Pago Instant Payment Notifications
app.post('/api/webhook', async (req, res) => {
    try {
        const webhookHandler = require('./api/webhook.js');
        await webhookHandler(req, res);
    } catch (error) {
        console.error('Local Server Error (Webhook):', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`\n=========================================`);
    console.log(`🚀 SERVIDOR LOCAL DE TESTE INICIADO!`);
    console.log(`=========================================`);
    console.log(`Abra seu navegador em: http://localhost:${PORT}/gallery.html`);
    console.log(`Para parar o servidor, pressione: CTRL + C`);
    console.log(`=========================================\n`);

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
        console.log(`⚠️  AVISO: MERCADOPAGO_ACCESS_TOKEN não está definido no arquivo .env!`);
        console.log(`O checkout falhará até que você adicione esta chave.\n`);
    }
});
