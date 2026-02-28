function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('vvribeiro_cart')) || [];
    const badges = document.querySelectorAll('.cart-badge');
    const count = cart.length;
    badges.forEach(badge => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    });
}

document.addEventListener('DOMContentLoaded', updateCartBadge);
