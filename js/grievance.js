document.addEventListener("components:loaded", function () {
  const form = document.getElementById("grievance-form");
  const success = document.getElementById("gr-success");
  const slaHint = document.getElementById("gr-sla");
  if (!form || !success) return;
  const submitBtn = form.querySelector(".ct-submit-btn");

  const rules = {
    name: /^[A-Za-z\s.'-]{2,}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[0-9]{10}$/,
  };

  const slaText = {
    data_privacy:
      "Acknowledged within 48 hours. Resolved within 90 days at the latest.",
    online_order: "Acknowledged within 48 hours. Resolved within 1 month.",
    service: "Acknowledged within 48 hours. Resolved within 1 month.",
    other: "Acknowledged within 48 hours. Resolved within 1 month.",
  };

  form.category.addEventListener("change", function () {
    slaHint.textContent = slaText[this.value] || "";
  });

  const fmt = (d) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    let valid = true;

    form.querySelectorAll("[required]").forEach((f) => {
      f.classList.remove("ct-field-error");
      const empty = f.type === "checkbox" ? !f.checked : !f.value.trim();
      if (empty) {
        f.classList.add("ct-field-error");
        valid = false;
      }
    });

    Object.keys(rules).forEach((name) => {
      const f = form.querySelector(`[name="${name}"]`);
      const v = f.value.trim();
      if (!v) return;
      f.classList.remove("ct-field-error");
      if (!rules[name].test(v)) {
        f.classList.add("ct-field-error");
        valid = false;
      }
    });

    if (!valid) return;

    // Honeypot: bots fill this; show a fake success and stop
    if (form.website.value) {
      success.style.display = "flex";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.querySelector(".ct-submit-text").textContent = "Submitting…";

    try {
      const res = await window.UnicornAPI.submitGrievance({
        category: form.category.value,
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        reference: form.reference.value.trim(),
        details: form.details.value.trim(),
      });

      document.getElementById("gr-ticket").textContent = res.ticket_no;
      document.getElementById("gr-ack").textContent = fmt(res.ack_due);
      document.getElementById("gr-due").textContent = fmt(res.resolve_by);

      form
        .querySelectorAll(".ct-field, .ct-form-row, .ct-submit-btn")
        .forEach((el) => (el.style.display = "none"));
      success.style.display = "flex";
      success.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      alert(
        "Sorry, we could not register your complaint. Please try again or email narendra@unicornevent.com.",
      );
      submitBtn.disabled = false;
      submitBtn.querySelector(".ct-submit-text").textContent =
        "Submit Complaint";
    }
  });
});
