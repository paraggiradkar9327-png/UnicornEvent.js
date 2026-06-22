/**
 * UNICORN EVENTS — Portfolio Page Logic
 * Loads the real portfolio image list (assets/portfolio-manifest.json,
 * generated from the actual files in assets/portfolio/*) via
 * UnicornAPI.getPortfolio(), replacing the old PHP server-side glob().
 */
(function () {
    'use strict';

    const portfolioGrid = document.getElementById('portfolioGrid');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const imagePopup = document.getElementById('imagePopup');
    const popupImage = document.getElementById('popupImage');
    const closePopup = document.querySelector('.close-popup');

    let activeFilter = 'all';
    let items = [];

    function render() {
        if (!portfolioGrid) return;

        const filtered = activeFilter === 'all'
            ? items
            : items.filter(item => item.category === activeFilter);

        if (!filtered.length) {
            portfolioGrid.innerHTML = '<p style="opacity:.6;padding:2rem 0;">No items found.</p>';
            return;
        }

        portfolioGrid.innerHTML = filtered.map(item => `
            <div class="portfolio-item" data-category="${item.category}">
                <img src="${item.src}" alt="${item.alt || item.category}" loading="lazy">
            </div>
        `).join('');

        bindImageClicks();
    }

    function bindImageClicks() {
        portfolioGrid.querySelectorAll('.portfolio-item img').forEach(img => {
            img.addEventListener('click', () => {
                if (imagePopup && popupImage) {
                    imagePopup.classList.add('active');
                    popupImage.src = img.src;
                }
            });
        });
    }

    function initFilters() {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeFilter = btn.dataset.filter;
                render();
            });
        });
    }

    function initPopup() {
        if (!imagePopup) return;
        if (closePopup) {
            closePopup.addEventListener('click', () => imagePopup.classList.remove('active'));
        }
        imagePopup.addEventListener('click', (e) => {
            if (e.target === imagePopup) imagePopup.classList.remove('active');
        });
    }

    async function init() {
        initFilters();
        initPopup();
        try {
            items = await window.UnicornAPI.getPortfolio();
        } catch (err) {
            console.error('[Portfolio] Failed to load images:', err);
            items = [];
        }
        render();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
