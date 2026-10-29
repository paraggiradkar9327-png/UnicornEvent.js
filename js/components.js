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
  "use strict";

  /* ── Helpers ─────────────────────────────────────────── */

  /** Derive the base page name from the URL (e.g. "about", "contact", "index") */
  function currentPage() {
    const path = window.location.pathname.split("/").pop() || "index.php";

    return path.replace(".html", "").replace(".php", "") || "index";
  }

  /** Fetch an HTML fragment and return its text */
  async function fetchComponent(name) {
    const base =
      document.querySelector('meta[name="base-path"]')?.content || "";
    const res = await fetch(`${base}components/${name}.html`);
    if (!res.ok)
      throw new Error(`Component "${name}" not found (${res.status})`);
    return res.text();
  }

  /** Mark the matching nav link(s) as active */
  function setActiveNav() {
    const page = currentPage();

    // Highlight <a data-page="..."> links in desktop nav
    document.querySelectorAll(".nav-links [data-page]").forEach((el) => {
      const pages = el.getAttribute("data-page").split(" ");
      if (pages.includes(page)) {
        el.classList.add("active-link");
        // If it's inside a dropdown parent, highlight parent too
        const parentLi = el.closest("li.has-dropdown");
        if (parentLi) parentLi.classList.add("active-link");
      }
    });

    // Highlight dropdown items
    document.querySelectorAll(".nav-dropdown [data-page]").forEach((el) => {
      if (el.getAttribute("data-page") === page) {
        el.style.color = "var(--gold)";
      }
    });
  }

  /** On inner pages, start the navbar already in "scrolled" state */
  function initNavbarState() {
    const page = currentPage();
    if (page !== "index") {
      const nav = document.getElementById("navbar");
      if (nav) nav.classList.add("scrolled");
    }
  }

  /** Set the copyright year in the footer */
  function setFooterYear() {
    const el = document.getElementById("footer-year");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ── Privacy Policy popup ────────────────────────────── */
  // Works with links injected later (footer) via event delegation.
  // Any element with [data-privacy-open] opens it; [data-privacy-close] closes it.

  let ppLastFocus = null;

  function ppEl() {
    return document.getElementById("privacy-policy");
  }

  function openPrivacy() {
    const overlay = ppEl();
    if (!overlay) return;
    ppLastFocus = document.activeElement;
    overlay.hidden = false;
    document.body.classList.add("pp-lock");
    // next frame so the fade/slide transition runs
    requestAnimationFrame(() => overlay.classList.add("is-open"));
    const body = overlay.querySelector(".pp-body");
    if (body) body.scrollTo({ top: 0, behavior: "instant" });
    const modal = overlay.querySelector(".pp-modal");
    if (modal) modal.focus();
    if (location.hash !== "#privacy-policy")
      history.replaceState(null, "", "#privacy-policy");
  }

  function closePrivacy() {
    const overlay = ppEl();
    if (!overlay || overlay.hidden) return;
    overlay.classList.remove("is-open");
    document.body.classList.remove("pp-lock");
    setTimeout(() => {
      overlay.hidden = true;
    }, 220);
    if (location.hash === "#privacy-policy") {
      history.replaceState(null, "", location.pathname + location.search);
    }
    if (ppLastFocus && ppLastFocus.focus) ppLastFocus.focus();
  }

  document.addEventListener("click", function (e) {
    const opener = e.target.closest("[data-privacy-open]");
    if (opener) {
      e.preventDefault();
      openPrivacy();
      return;
    }
    if (
      e.target.closest("[data-privacy-close]") ||
      e.target.classList.contains("pp-overlay")
    ) {
      closePrivacy();
      return;
    }
    const jump = e.target.closest("[data-pp-jump]");
    if (jump) {
      e.preventDefault();
      const target = document.getElementById(
        jump.getAttribute("href").slice(1),
      );
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  document.addEventListener("keydown", function (e) {
    const overlay = ppEl();
    if (!overlay || overlay.hidden) return;
    if (e.key === "Escape") {
      closePrivacy();
      return;
    }
    // keep keyboard focus inside the popup
    if (e.key === "Tab") {
      const items = overlay.querySelectorAll("a[href], button:not([disabled])");
      if (!items.length) return;
      const first = items[0],
        last = items[items.length - 1];
      if (
        e.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === overlay.querySelector(".pp-modal"))
      ) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Open straight away if someone visits  page.html#privacy-policy
  document.addEventListener("components:loaded", function () {
    if (location.hash === "#privacy-policy") openPrivacy();
  });

  /* ── Main loader ─────────────────────────────────────── */

  async function loadComponents() {
    const placeholders = document.querySelectorAll("[data-component]");
    if (!placeholders.length) return;

    const loads = Array.from(placeholders).map(async (placeholder) => {
      const name = placeholder.getAttribute("data-component");
      try {
        const html = await fetchComponent(name);
        // Replace the placeholder <div> with the actual component markup
        placeholder.outerHTML = html;
      } catch (err) {
        console.error(
          `[components.js] Failed to load component "${name}":`,
          err,
        );
      }
    });

    await Promise.all(loads);

    // The privacy-policy popup lives in its own file; add it once the footer is on the page
    if (
      document.querySelector(".footer-bottom-links [data-privacy-open]") &&
      !document.getElementById("privacy-policy")
    ) {
      try {
        document.body.insertAdjacentHTML(
          "beforeend",
          await fetchComponent("privacy-policy"),
        );
      } catch (err) {
        console.error(
          "[components.js] Failed to load privacy-policy popup:",
          err,
        );
      }
    }

    // Run post-load setup
    setFooterYear();
    setActiveNav();
    initNavbarState();

    // Cookie consent (banner + settings): load once per page
    if (!window.UnicornConsent && !document.getElementById("ck-script")) {
      const s = document.createElement("script");
      s.id = "ck-script";
      s.src =
        (document.querySelector('meta[name="base-path"]')?.content || "") +
        "js/consent.js";
      document.body.appendChild(s);
    }

    // Fire a custom event so main.js can re-init things that depend on the DOM
    document.dispatchEvent(new CustomEvent("components:loaded"));
  }

  // Load as soon as the DOM is parsed (before images etc.)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadComponents);
  } else {
    loadComponents();
  }
})();
