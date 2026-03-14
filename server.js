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

// Start the server
app.listen(PORT, () => {
    console.log(`\n=========================================`);
    console.log(`🚀 SERVIDOR LOCAL DE TESTE INICIADO!`);
    console.log(`=========================================`);
    console.log(`Abra seu navegador em: http://localhost:${PORT}/gallery.html`);
    console.log(`Para parar o servidor, pressione: CTRL + C`);
    console.log(`=========================================\n`);
});
