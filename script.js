// Pricing Structure
const pricing = {
    base: {
        a4: 300,
        a3: 500,
        a2: 650,
        a1: 850
    },
    frame: {
        /* Additional cost for frame based on size */
        a4: 200,
        a3: 350,
        a2: 600,
        a1: 1050
    },
    passepartout: {
        a4: 100,
        a3: 100,
        a2: 100,
        a1: 100
    }
};

const artworks = {
    'images/landscape.png': {
        title: 'Highland Dawn',
        artist: 'por Victor Ribeiro',
        description: 'Uma impressionante fotografia de paisagem fine-art capturando montanhas enevoadas ao nascer do sol, em filme 35mm.'
    },
    'images/architecture.png': {
        title: 'Concrete Zenith',
        artist: 'por Victor Ribeiro',
        description: 'Uma fotografia arquitetônica fine-art marcante de um edifício brutalista moderno com sombras geométricas nítidas.'
    },
    'images/abstract.png': {
        title: 'Neon Genesis',
        artist: 'por Victor Ribeiro',
        description: 'Uma fotografia macro abstrata vibrante de dinâmica de fluidos rodopiantes e iridescentes em um fundo preto profundo.'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const mainArtwork = document.getElementById('mainArtwork');
    const thumbnails = document.querySelectorAll('.thumbnail');
    // Removed dynamic text elements as per new design

    const sizeRadios = document.querySelectorAll('input[name="size"]');
    const frameRadios = document.querySelectorAll('input[name="frame"]');
    const passepartoutToggle = document.getElementById('passepartoutToggle');

    const frameContainer = document.getElementById('frameContainer');
    const passepartoutLayer = document.getElementById('passepartoutLayer');

    const totalPriceEl = document.getElementById('totalPrice');
    const priceDetailsEl = document.getElementById('priceDetails');
    const checkoutBtn = document.querySelector('.btn-checkout');

    // State
    let currentState = {
        size: 'a4',
        frame: 'none',
        passepartout: false,
        imageSrc: 'images/landscape.png',
        price: 0
    };

    // Check URL parameters for dynamic image loading from gallery or cart edit
    const urlParams = new URLSearchParams(window.location.search);
    const passedImg = urlParams.get('img');
    const editIndex = urlParams.get('editIndex');

    if (editIndex !== null) {
        checkoutBtn.innerHTML = `Atualizar item <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>`;
    }

    if (passedImg) {
        // Override state and DOM with URL params
        currentState.imageSrc = passedImg;
        mainArtwork.src = passedImg;

        // Hide the gallery thumbnails since the user came from the main gallery
        const thumbnailsContainer = document.querySelector('.gallery-thumbnails');
        if (thumbnailsContainer) {
            thumbnailsContainer.style.display = 'none';
        }
    }
    // Initialize Event Listeners
    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', (e) => {
            thumbnails.forEach(t => t.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');

            const newSrc = target.getAttribute('data-image');

            // Fade out, change source, fade in
            mainArtwork.style.opacity = 0;
            setTimeout(() => {
                currentState.imageSrc = newSrc;
                mainArtwork.src = newSrc;

                // Removed dynamic text update for thumbnails

                mainArtwork.style.opacity = 1;
            }, 300);
        });
    });

    sizeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentState.size = e.target.value;
            updateVisuals();
            updatePrice();
        });
    });

    frameRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentState.frame = e.target.value;
            updateVisuals();
            updatePrice();
        });
    });

    passepartoutToggle.addEventListener('change', (e) => {
        currentState.passepartout = e.target.checked;
        updateVisuals();
        updatePrice();
    });

    function updateVisuals() {
        // Size logic
        const artArea = document.querySelector('.mockup-art-area');
        if (artArea) {
            artArea.className = `mockup-art-area mockup-size-${currentState.size}`;
        }

        // Frame logic
        frameContainer.className = 'frame-container'; // reset
        if (currentState.frame !== 'none') {
            frameContainer.classList.add('framed', `frame-${currentState.frame}`);
            passepartoutToggle.disabled = false;
        } else {
            // Cannot have passepartout without a frame
            passepartoutToggle.disabled = true;
            passepartoutToggle.checked = false;
            currentState.passepartout = false;
        }

        // Passepartout logic
        if (currentState.passepartout) {
            passepartoutLayer.classList.add('active');
        } else {
            passepartoutLayer.classList.remove('active');
        }
    }

    function updatePrice() {
        const size = currentState.size;
        let total = pricing.base[size];
        let detailText = `Impressão Base ${size.toUpperCase()}`;

        if (currentState.frame !== 'none') {
            const frameCost = pricing.frame[size];
            total += frameCost;

            // Map frame to portuguese
            const frameMap = { 'black': 'Preta', 'wood': 'Madeira', 'white': 'Branca' };
            const frameStr = frameMap[currentState.frame] || '';
            detailText += ` + Moldura ${frameStr}`;
        }

        if (currentState.passepartout) {
            const passepartoutCost = pricing.passepartout[size];
            total += passepartoutCost;
            detailText += ` + Passepartout`;
        }

        currentState.price = total;

        // Animate price change slightly
        totalPriceEl.style.transform = 'translateY(-10px)';
        totalPriceEl.style.opacity = '0';

        setTimeout(() => {
            totalPriceEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
            priceDetailsEl.textContent = detailText;

            totalPriceEl.style.transform = 'translateY(0)';
            totalPriceEl.style.opacity = '1';
            totalPriceEl.style.transition = 'all 0.3s ease';
        }, 150);
    }

    // Add to Cart Logic
    checkoutBtn.addEventListener('click', () => {
        let cart = JSON.parse(localStorage.getItem('vvribeiro_cart')) || [];

        const photoInfo = artworks[currentState.imageSrc] || { title: 'Fotografia Fine Art' };

        const cartItem = {
            img: currentState.imageSrc,
            title: photoInfo.title,
            size: currentState.size,
            frame: currentState.frame,
            passepartout: currentState.passepartout,
            price: currentState.price
        };

        if (editIndex !== null && editIndex >= 0 && editIndex < cart.length) {
            // Update existing item
            cart[editIndex] = cartItem;
            localStorage.setItem('vvribeiro_cart', JSON.stringify(cart));
            window.location.href = 'cart.html';
        } else {
            // Add new item
            cart.push(cartItem);
            localStorage.setItem('vvribeiro_cart', JSON.stringify(cart));

            // Show Modal and update badge immediately
            if (typeof updateCartBadge === 'function') updateCartBadge();

            const modal = document.getElementById('addToCartModal');
            modal.style.display = 'flex';
            // Force reflow
            void modal.offsetWidth;
            modal.classList.add('show');

            // Setup listeners for modal buttons
            document.getElementById('btnContinueShopping').onclick = () => window.location.href = 'gallery.html';
            document.getElementById('btnGoToCart').onclick = () => window.location.href = 'cart.html';
        }
    });

    // Initial setup
    updateVisuals();
    updatePrice();
});
