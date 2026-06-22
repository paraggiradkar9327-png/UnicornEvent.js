/**
 * UNICORN EVENTS — Main Site JavaScript
 * Handles: navbar scroll, mobile menu, scroll animations,
 *          animated counters, active nav highlighting, contact form.
 */

(function () {
  'use strict';

  // ─── NAVBAR SCROLL EFFECT ─────────────────────────────────
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    // Use classList.toggle with a boolean to replace the if/else
    function onScroll() {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ─── MOBILE MENU ─────────────────────────────────────────
  function initMobileMenu() {
    document.addEventListener('click', function (e) {
      const hamburger = e.target.closest('#hamburger');

      if (hamburger) {
        const mobileMenu = document.getElementById('mobile-menu');

        hamburger.classList.toggle('open');
        mobileMenu.classList.toggle('open');
        return;
      }

      if (e.target.closest('#mobile-menu a')) {
        document.getElementById('hamburger')?.classList.remove('open');
        document.getElementById('mobile-menu')?.classList.remove('open');
      }
    });
  }


  // ─── SCROLL-TRIGGERED FADE-IN ANIMATIONS ─────────────────
  function initScrollAnimations() {
    const elements = document.querySelectorAll('.fade-in');
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        // Read the delay that was set below, defaulting to 0
        const delay = entry.target.dataset.delay | 0;
        setTimeout(() => entry.target.classList.add('visible'), delay);
        // Unobserve once animated — no reason to keep watching
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    elements.forEach((el, i) => {
      el.dataset.delay = (i % 6) * 90;
      observer.observe(el);
    });
  }

  // ─── ANIMATED STAT COUNTERS ───────────────────────────────
  function animateCounter(el, target, suffix) {
    // Use requestAnimationFrame instead of setInterval for smoother,
    // frame-rate-aware animation that auto-cleans up.
    const duration = 1400;
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = Math.floor(progress * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function initCounters() {
    const statsSection = document.querySelector('.about-stats');
    if (!statsSection) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll('[data-count]').forEach(el => {
          animateCounter(el, +el.dataset.count, el.dataset.suffix || '');
        });
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.3 });

    observer.observe(statsSection);
  }

  // ─── ACTIVE NAV LINK ON SCROLL ───────────────────────────
  function initActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');
    if (!sections.length || !navLinks.length) return;

    // Cache section offsets and only recalculate on resize
    let sectionOffsets = [];
    function cacheOffsets() {
      sectionOffsets = Array.from(sections).map(sec => ({
        id: sec.id,
        top: sec.offsetTop,
      }));
    }

    function highlightNav() {
      let current = '';
      const scrollY = window.scrollY;
      for (const sec of sectionOffsets) {
        if (scrollY >= sec.top - 140) current = sec.id;
      }
      navLinks.forEach(a => {
        a.style.color = a.getAttribute('href') === '#' + current ? 'var(--gold)' : '';
      });
    }

    cacheOffsets();
    window.addEventListener('scroll', highlightNav, { passive: true });
    window.addEventListener('resize', cacheOffsets, { passive: true });
    highlightNav();
  }


  // ─── INIT ALL ────────────────────────────────────────────
  function initAll() {
    initNavbar();
    initMobileMenu();
    initScrollAnimations();
    initCounters();
    initActiveNav();
  }

  // 'components:loaded' is fired by components.js after all shared HTML
  // is injected. Guard against double-init if both events happen to fire.
  let initialised = false;
  function safeInit() {
    if (initialised) return;
    initialised = true;
    initAll();
  }

  document.addEventListener('components:loaded', safeInit);
  document.addEventListener('DOMContentLoaded', () => {
    // Fallback: if components.js didn't fire within one frame, run anyway.
    setTimeout(() => { if (!initialised) safeInit(); }, 50);
  });

})();