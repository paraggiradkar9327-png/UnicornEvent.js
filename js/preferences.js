(async function () {
  const params = new URLSearchParams(location.search);
  const token = params.get("t");
  const who = document.getElementById("pref-who");
  const list = document.getElementById("pref-list");
  const status = document.getElementById("pref-status");
  const UUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!token || !UUID.test(token)) {
    who.textContent =
      "This link is invalid or incomplete. Please use the link from our most recent message, or email narendra@unicornevent.com.";
    return;
  }

  let state;
  try {
    state = await window.UnicornAPI.getConsentStatus(token);
  } catch (e) {
    state = null;
  }
  if (!state) {
    who.textContent =
      "We could not find your preferences. The link may be old. Please email narendra@unicornevent.com and we will update them for you.";
    return;
  }

  who.textContent = "Preferences for " + state.email;
  list.hidden = false;

  const boxes = list.querySelectorAll("input[data-purpose]");
  boxes.forEach((cb) => {
    cb.checked = !!state.purposes[cb.dataset.purpose];
  });

  // ?unsub=email or ?unsub=whatsapp → one-click withdrawal straight from an email link
  const unsub = params.get("unsub");
  const unsubMap = { email: "marketing_email", whatsapp: "marketing_whatsapp" };
  if (unsubMap[unsub]) {
    const cb = list.querySelector(`[data-purpose="${unsubMap[unsub]}"]`);
    if (cb && cb.checked) {
      cb.checked = false;
      await save(cb, "unsubscribe_link");
    }
  }

  boxes.forEach((cb) =>
    cb.addEventListener("change", () => save(cb, "preference_page")),
  );

  async function save(cb, source) {
    cb.disabled = true;
    status.textContent = "Saving…";
    try {
      await window.UnicornAPI.updateConsent({
        token,
        purpose: cb.dataset.purpose,
        grant: cb.checked,
        source,
        policyVersion: window.UnicornConsent.POLICY_VERSION,
        text: cb.checked ? cb.dataset.text : "Withdrawn: " + cb.dataset.text,
        userAgent: navigator.userAgent,
      });
      status.textContent = cb.checked
        ? "Saved. You will receive these."
        : "Saved. We will not contact you for this.";
    } catch (e) {
      cb.checked = !cb.checked;
      status.textContent = "Could not save. Please try again.";
    } finally {
      cb.disabled = false;
    }
  }
})();
