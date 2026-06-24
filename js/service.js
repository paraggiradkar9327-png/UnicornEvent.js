(function () {
  const tabs = document.querySelectorAll('.service-tab');
  const panels = document.querySelectorAll('.service-panel');

  // Support deep-linking via hash: services.html#activation
  function activateTab(panelId) {
    tabs.forEach(t => {
      const isActive = t.dataset.panel === panelId;
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', isActive);
    });
    panels.forEach(p => {
      p.classList.toggle('active', p.id === 'panel-' + panelId);
    });
    // Re-run fade-in for newly visible panel
    document.querySelectorAll('#panel-' + panelId + ' .fade-in').forEach((el, i) => {
      el.classList.remove('visible');
      setTimeout(() => el.classList.add('visible'), i * 60 + 80);
    });
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      activateTab(tab.dataset.panel);
      history.replaceState(null, '', '#' + tab.dataset.panel);
      // Scroll to tabs
      document.querySelector('.service-tabs-wrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Handle hash on page load — default to "events" when there's no
  // valid #hash, instead of activating an empty/invalid panel id
  // (which previously hid every panel on a normal page visit).
  // Accepts both "#branding" and "#panel-branding" formats, since
  // footer links use the latter.
  const hash = window.location.hash.replace('#', '').replace(/^panel-/, '');
  const valid = ['events', 'activation', 'wedding', 'branding'];
  activateTab(valid.includes(hash) ? hash : 'events');
})();