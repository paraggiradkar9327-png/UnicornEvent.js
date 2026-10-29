/**
 * UNICORN EVENTS — Cookie consent
 * Banner (Accept / Reject / Choose), preference centre, and gated loading
 * of non-essential tools. Nothing non-essential runs before consent.
 */
(function () {
  "use strict";

  /* ── 1. FILL IN ONLY THE TOOLS YOU REALLY USE ─────────────── */
  var CONFIG = {
    GA4_ID: "", // analytics  e.g. 'G-ABC123XYZ'
    GOOGLE_ADS_ID: "", // marketing  e.g. 'AW-1234567890'
    META_PIXEL_ID: "", // marketing  e.g. '123456789012345'
  };
  var KEY = "ue_cookie_consent";
  var VERSION = 1; // raise this number to ask everyone again (e.g. after adding a new tool)
  var MAX_AGE_DAYS = 365; // ask again after 12 months

  /* ── 2. STORED CHOICE ─────────────────────────────────────── */
  function read() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY));
      if (!c || c.v !== VERSION || Date.now() - c.ts > MAX_AGE_DAYS * 864e5)
        return null;
      return c;
    } catch (e) {
      return null;
    }
  }
  function write(p) {
    var c = {
      v: VERSION,
      ts: Date.now(),
      analytics: !!p.analytics,
      marketing: !!p.marketing,
      functional: !!p.functional,
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(c));
    } catch (e) {}
    return c;
  }

  /* ── 3. GATED LOADERS ─────────────────────────────────────── */
  var loaded = {};
  function loadScript(src) {
    var s = document.createElement("script");
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  }
  function gtagInit() {
    if (loaded.gtag) return;
    var id = CONFIG.GA4_ID || CONFIG.GOOGLE_ADS_ID;
    if (!id) return;
    loaded.gtag = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    loadScript(
      "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id),
    );
  }
  function startAnalytics() {
    if (loaded.analytics || !CONFIG.GA4_ID) return;
    loaded.analytics = true;
    gtagInit();
    window.gtag("config", CONFIG.GA4_ID);
  }
  function startMarketing() {
    if (loaded.marketing) return;
    loaded.marketing = true;
    if (CONFIG.GOOGLE_ADS_ID) {
      gtagInit();
      window.gtag("config", CONFIG.GOOGLE_ADS_ID);
    }
    if (CONFIG.META_PIXEL_ID) {
      var f = (window.fbq = function () {
        f.callMethod
          ? f.callMethod.apply(f, arguments)
          : f.queue.push(arguments);
      });
      f.queue = [];
      f.loaded = true;
      f.version = "2.0";
      f.push = f;
      window._fbq = f;
      loadScript("https://connect.facebook.net/en_US/fbevents.js");
      f("init", CONFIG.META_PIXEL_ID);
      f("track", "PageView");
    }
  }

  /* Any other snippet (chat widget, etc.): in your HTML write
       <script type="text/plain" data-consent="functional" src="..."></script>
     and it is switched on only after that category is allowed. */
  function activateTags(cat) {
    document
      .querySelectorAll('script[type="text/plain"][data-consent="' + cat + '"]')
      .forEach(function (old) {
        var s = document.createElement("script");
        for (var i = 0; i < old.attributes.length; i++) {
          if (old.attributes[i].name !== "type")
            s.setAttribute(old.attributes[i].name, old.attributes[i].value);
        }
        s.text = old.text;
        old.parentNode.replaceChild(s, old);
      });
  }

  /* Embeds (map, video): <iframe data-consent-src="..." data-consent-label="Google Map"> */
  function applyEmbeds(on) {
    document.querySelectorAll("iframe[data-consent-src]").forEach(function (f) {
      var prev = f.previousElementSibling;
      var ph = prev && prev.classList.contains("ck-embed-ph") ? prev : null;
      if (on) {
        if (!f.getAttribute("src")) f.src = f.getAttribute("data-consent-src");
        f.style.display = "";
        if (ph) ph.remove();
      } else if (!ph) {
        f.style.display = "none";
        var d = document.createElement("div");
        d.className = "ck-embed-ph";
        d.innerHTML =
          "<p>" +
          (f.getAttribute("data-consent-label") || "This content") +
          " is provided by a third party and is switched off until you allow it.</p>" +
          '<button type="button" class="ck-btn" data-ck="embed">Allow &amp; load</button>';
        f.parentNode.insertBefore(d, f);
      }
    });
  }

  function apply(c) {
    if (c.analytics) {
      startAnalytics();
      activateTags("analytics");
    }
    if (c.marketing) {
      startMarketing();
      activateTags("marketing");
    }
    if (c.functional) activateTags("functional");
    applyEmbeds(c.functional);
  }

  /* When a visitor withdraws, remove the tools' cookies and reload so nothing keeps running. */
  function clearTrackingCookies() {
    var re = /^(_ga|_gid|_gat|_gcl|_fbp|_fbc|IDE|test_cookie)/;
    var parts = location.hostname.split(".");
    var domains = ["", location.hostname, "." + location.hostname];
    if (parts.length > 2) domains.push("." + parts.slice(-2).join("."));
    document.cookie.split(";").forEach(function (raw) {
      var n = raw.split("=")[0].trim();
      if (!re.test(n)) return;
      domains.forEach(function (d) {
        document.cookie =
          n +
          "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" +
          (d ? "; domain=" + d : "");
      });
    });
  }

  function save(p) {
    var before = read();
    var c = write(p);
    var revoked =
      before &&
      ((before.analytics && !c.analytics) ||
        (before.marketing && !c.marketing) ||
        (before.functional && !c.functional));
    hideBanner();
    closeModal();
    if (revoked) {
      clearTrackingCookies();
      location.reload();
      return;
    }
    apply(c);
    document.dispatchEvent(new CustomEvent("consent:changed", { detail: c }));
  }

  /* ── 4. UI ────────────────────────────────────────────────── */
  var banner, overlay, modal, lastFocus;

  var CSS =
    ".ck-banner[hidden],.ck-overlay[hidden]{display:none!important}" +
    ".ck-banner{position:fixed;left:16px;right:16px;bottom:16px;z-index:9000;max-width:960px;margin:0 auto;display:flex;gap:24px;align-items:center;justify-content:space-between;padding:20px 24px;background:var(--bg2,#111820);color:var(--fg,#ede8df);border:1px solid var(--border,rgba(255,255,255,.12));border-top:2px solid var(--gold,#e6a817);box-shadow:0 12px 40px rgba(0,0,0,.5);font-family:var(--sans,Inter,sans-serif)}" +
    '.ck-text h2{font-family:"Playfair Display",serif;font-size:1.05rem;font-weight:600;margin:0 0 6px}' +
    ".ck-text p{margin:0;font-size:.82rem;line-height:1.6;color:var(--fg2,#a09888)}" +
    ".ck-text a{color:var(--gold,#e6a817);text-decoration:underline}" +
    ".ck-actions{display:flex;gap:10px;flex-shrink:0}" +
    ".ck-btn{min-width:112px;padding:12px 18px;background:transparent;color:var(--fg,#ede8df);border:1px solid var(--gold,#e6a817);font:600 .72rem var(--sans,Inter,sans-serif);letter-spacing:.12em;text-transform:uppercase;cursor:pointer;border-radius:var(--btn-radius,0);transition:background .2s,color .2s}" +
    ".ck-btn:hover,.ck-btn:focus-visible{background:var(--gold,#e6a817);color:#0d1117;outline:none}" +
    ".ck-overlay{position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px}" +
    ".ck-modal{width:100%;max-width:620px;max-height:90vh;overflow:auto;background:var(--bg2,#111820);color:var(--fg,#ede8df);border:1px solid var(--border,rgba(255,255,255,.12));border-top:2px solid var(--gold,#e6a817);padding:28px;font-family:var(--sans,Inter,sans-serif)}" +
    '.ck-modal h2{font-family:"Playfair Display",serif;font-size:1.3rem;margin:0 0 8px}' +
    ".ck-modal>p{font-size:.84rem;line-height:1.6;color:var(--fg2,#a09888);margin:0 0 18px}" +
    ".ck-row{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;padding:16px 0;border-top:1px solid var(--border,rgba(255,255,255,.1))}" +
    ".ck-row strong{font-size:.9rem}" +
    ".ck-row p{margin:4px 0 0;font-size:.78rem;line-height:1.55;color:var(--fg2,#a09888)}" +
    ".ck-always{font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--gold,#e6a817);white-space:nowrap;padding-top:3px}" +
    ".ck-switch{position:relative;width:46px;height:26px;flex-shrink:0}" +
    ".ck-switch input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer}" +
    ".ck-switch span{position:absolute;inset:0;background:#2a3340;border-radius:26px;transition:.2s;pointer-events:none}" +
    '.ck-switch span::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;background:#fff;border-radius:50%;transition:.2s}' +
    ".ck-switch input:checked+span{background:var(--gold,#e6a817)}" +
    ".ck-switch input:checked+span::after{transform:translateX(20px)}" +
    ".ck-switch input:focus-visible+span{outline:2px solid var(--gold,#e6a817);outline-offset:2px}" +
    ".ck-modal .ck-actions{margin-top:20px;border-top:1px solid var(--border,rgba(255,255,255,.1));padding-top:20px}" +
    ".ck-modal .ck-btn{flex:1}" +
    ".ck-embed-ph{display:flex;flex-direction:column;gap:12px;align-items:flex-start;justify-content:center;min-height:160px;padding:18px;background:var(--bg3,#161e28);border:1px dashed var(--border,rgba(255,255,255,.2))}" +
    ".ck-embed-ph p{margin:0;font-size:.78rem;line-height:1.55;color:var(--fg2,#a09888)}" +
    "@media(max-width:700px){.ck-banner{flex-direction:column;align-items:stretch;gap:16px}.ck-actions{flex-direction:column}.ck-modal .ck-actions{flex-direction:column}}";

  function inject() {
    var st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);

    banner = document.createElement("div");
    banner.className = "ck-banner";
    banner.hidden = true;
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Cookie consent");
    banner.innerHTML =
      '<div class="ck-text"><h2>Your privacy choices</h2>' +
      "<p>We use essential cookies to run this site. With your permission we also use analytics, advertising and " +
      "third-party content (maps, video, chat). You can accept, reject or choose, and change your mind at any time. " +
      '<a href="#privacy-policy" data-privacy-open>Privacy Policy</a></p></div>' +
      '<div class="ck-actions">' +
      '<button type="button" class="ck-btn" data-ck="reject">Reject all</button>' +
      '<button type="button" class="ck-btn" data-ck="choose">Choose</button>' +
      '<button type="button" class="ck-btn" data-ck="accept">Accept all</button></div>';

    overlay = document.createElement("div");
    overlay.className = "ck-overlay";
    overlay.id = "ck-modal";
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="ck-modal" role="dialog" aria-modal="true" aria-labelledby="ck-m-title" tabindex="-1">' +
      '<h2 id="ck-m-title">Cookie settings</h2>' +
      "<p>Choose which optional tools we may use. Nothing optional is switched on until you say so, and you can change this any time from “Cookie settings” in the footer.</p>" +
      '<div class="ck-row"><div><strong>Essential</strong><p>Keeps the site working: security, staff login and remembering this choice. Cannot be switched off.</p></div><span class="ck-always">Always on</span></div>' +
      '<div class="ck-row"><div><strong>Analytics</strong><p>Helps us understand how the site is used so we can improve it (Google Analytics).</p></div><label class="ck-switch"><input type="checkbox" id="ck-analytics" aria-label="Analytics"><span></span></label></div>' +
      '<div class="ck-row"><div><strong>Marketing</strong><p>Measures our ads and shows relevant ones (Google Ads, Meta Pixel).</p></div><label class="ck-switch"><input type="checkbox" id="ck-marketing" aria-label="Marketing"><span></span></label></div>' +
      '<div class="ck-row"><div><strong>Embedded content &amp; chat</strong><p>Google Maps, YouTube video and any live-chat widget. These providers may receive your IP address.</p></div><label class="ck-switch"><input type="checkbox" id="ck-functional" aria-label="Embedded content and chat"><span></span></label></div>' +
      '<div class="ck-actions">' +
      '<button type="button" class="ck-btn" data-ck="reject">Reject all</button>' +
      '<button type="button" class="ck-btn" data-ck="save">Save choices</button>' +
      '<button type="button" class="ck-btn" data-ck="accept">Accept all</button></div></div>';

    document.body.appendChild(banner);
    document.body.appendChild(overlay);
    modal = overlay.querySelector(".ck-modal");

    modal.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeModal();
        return;
      }
      if (e.key !== "Tab") return;
      var f = modal.querySelectorAll("button,input");
      var first = f[0],
        last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  function showBanner() {
    banner.hidden = false;
  }
  function hideBanner() {
    banner.hidden = true;
  }

  function openModal() {
    var c = read() || {};
    document.getElementById("ck-analytics").checked = !!c.analytics;
    document.getElementById("ck-marketing").checked = !!c.marketing;
    document.getElementById("ck-functional").checked = !!c.functional;
    lastFocus = document.activeElement;
    overlay.hidden = false;
    modal.focus();
  }
  function closeModal() {
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-ck]");
    if (b) {
      var a = b.getAttribute("data-ck");
      if (a === "accept") save({ analytics: 1, marketing: 1, functional: 1 });
      else if (a === "reject") save({});
      else if (a === "choose") openModal();
      else if (a === "save")
        save({
          analytics: document.getElementById("ck-analytics").checked,
          marketing: document.getElementById("ck-marketing").checked,
          functional: document.getElementById("ck-functional").checked,
        });
      else if (a === "embed") {
        // visitor allowed just the embedded content
        var c = read() || {};
        save({
          analytics: c.analytics,
          marketing: c.marketing,
          functional: true,
        });
      }
      return;
    }
    if (e.target.closest("[data-cookie-settings]")) {
      e.preventDefault();
      openModal();
      return;
    }
    if (e.target === overlay) closeModal();
  });

  /* ── 5. START ─────────────────────────────────────────────── */
  function init() {
    inject();
    var c = read();
    if (c) apply(c);
    else {
      showBanner();
      applyEmbeds(false);
    }
  }

  /* The footer (with the map iframe) is injected by components.js AFTER this
     script may already have run, so re-apply embed consent once it is in the DOM. */
  document.addEventListener("components:loaded", function () {
    var c = read();
    applyEmbeds(c ? !!c.functional : false);
  });

  window.UnicornConsent = {
    get: read,
    open: function () {
      if (overlay) openModal();
    },
  };

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
