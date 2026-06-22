/**
 * UNICORN EVENTS — Component Loader
 * ─────────────────────────────────
 * Fetches shared HTML components (navbar, footer) and injects them
 * into every page at the matching placeholder elements.
 *
 * Usage in any HTML page:
 *   <div data-component="navbar"></div>
 *   <div data-component="footer"></div>
 *   <script src="js/components.js"></script>
 *
 * After all components load, it:
 *   • Sets the footer year
 *   • Marks the current page's nav link as active
 *   • Adds "scrolled" class to navbar on inner pages
 */

(function () {
  'use strict';

  /* ── Helpers ─────────────────────────────────────────── */

  /** Derive the base page name from the URL (e.g. "about", "contact", "index") */
  function currentPage() {
    const path = window.location.pathname.split('/').pop() || 'index.php';

    return path
      .replace('.html', '')
      .replace('.php', '') || 'index';
  }

  /** Fetch an HTML fragment and return its text */
  async function fetchComponent(name) {
    const base = document.querySelector('meta[name="base-path"]')?.content || '';
    const res = await fetch(`${base}components/${name}.html`);
    if (!res.ok) throw new Error(`Component "${name}" not found (${res.status})`);
    return res.text();
  }

  /** Mark the matching nav link(s) as active */
  function setActiveNav() {
    const page = currentPage();

    // Highlight <a data-page="..."> links in desktop nav
    document.querySelectorAll('.nav-links [data-page]').forEach(el => {
      const pages = el.getAttribute('data-page').split(' ');
      if (pages.includes(page)) {
        el.classList.add('active-link');
        // If it's inside a dropdown parent, highlight parent too
        const parentLi = el.closest('li.has-dropdown');
        if (parentLi) parentLi.classList.add('active-link');
      }
    });

    // Highlight dropdown items
    document.querySelectorAll('.nav-dropdown [data-page]').forEach(el => {
      if (el.getAttribute('data-page') === page) {
        el.style.color = 'var(--gold)';
      }
    });
  }

  /** On inner pages, start the navbar already in "scrolled" state */
  function initNavbarState() {
    const page = currentPage();
    if (page !== 'index') {
      const nav = document.getElementById('navbar');
      if (nav) nav.classList.add('scrolled');
    }
  }

  /** Set the copyright year in the footer */
  function setFooterYear() {
    const el = document.getElementById('footer-year');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ── Main loader ─────────────────────────────────────── */

  async function loadComponents() {
    const placeholders = document.querySelectorAll('[data-component]');
    if (!placeholders.length) return;

    const loads = Array.from(placeholders).map(async placeholder => {
      const name = placeholder.getAttribute('data-component');
      try {
        const html = await fetchComponent(name);
        // Replace the placeholder <div> with the actual component markup
        placeholder.outerHTML = html;
      } catch (err) {
        console.error(`[components.js] Failed to load component "${name}":`, err);
      }
    });

    await Promise.all(loads);

    // Run post-load setup
    setFooterYear();
    setActiveNav();
    initNavbarState();

    // Fire a custom event so main.js can re-init things that depend on the DOM
    document.dispatchEvent(new CustomEvent('components:loaded'));
  }

  // Load as soon as the DOM is parsed (before images etc.)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadComponents);
  } else {
    loadComponents();
  }
})();
