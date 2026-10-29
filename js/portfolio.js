/**
 * UNICORN EVENTS — Portfolio Page Logic
 * Loads the portfolio image list (assets/portfolio-manifest.json)
 * via UnicornAPI.getPortfolio() and shows it in a filterable grid.
 * Images are display-only: clicking them does nothing.
 */
(function () {
  "use strict";

  const portfolioGrid = document.getElementById("portfolioGrid");
  const filterBtns = document.querySelectorAll(".filter-btn");

  let activeFilter = "all";
  let items = [];

  function render() {
    if (!portfolioGrid) return;

    const filtered =
      activeFilter === "all"
        ? items
        : items.filter((item) => item.category === activeFilter);

    if (!filtered.length) {
      portfolioGrid.innerHTML =
        '<p style="opacity:.6;padding:2rem 0;">No items found.</p>';
      return;
    }

    portfolioGrid.innerHTML = filtered
      .map(
        (item) => `
            <div class="portfolio-item" data-category="${item.category}">
                <img src="${item.src}" alt="${item.alt || item.category}" loading="lazy" draggable="false">
            </div>
        `,
      )
      .join("");
  }

  function initFilters() {
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeFilter = btn.dataset.filter;
        render();
      });
    });
  }

  async function init() {
    initFilters();
    try {
      items = await window.UnicornAPI.getPortfolio();
    } catch (err) {
      console.error("[Portfolio] Failed to load images:", err);
      items = [];
    }
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
