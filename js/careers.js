(() => {
  "use strict";

  /* ───────────────── HELPERS ───────────────── */
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const typeMap = {
    "full-time": "Full-Time",
    "part-time": "Part-Time",
    freelance: "Freelance",
    internship: "Internship",
  };
  const typeLabel = (type) => typeMap[type] || type;

  /* ───────────────── STATE ───────────────── */
  let jobs = [];
  let activeFilter = "all";

  /* ───────────────── SERVER API ───────────────── */
  async function fetchJobs() {
    try {
      jobs = await window.UnicornAPI.getJobs();
      renderJobs();
    } catch (err) {
      console.warn("[Careers] Could not load jobs:", err);
    }
  }

  /* ───────────────── TEMPLATE HELPERS ───────────────── */
  const icon = {
    location: `<svg viewBox="0 0 24 24"><path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>`,
    clock: `<svg viewBox="0 0 24 24"><path d="M12 6v6h4.5"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    money: `<svg viewBox="0 0 24 24"><path d="M12 6v12"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  };

  const createTag = (svg, text) => `<span class="job-tag">${svg}${text}</span>`;

  // Always show LPA suffix, never doubled
  const formatSalary = (salary) => {
    const s = salary.trim();
    if (/lpa$/i.test(s)) return s;
    return s + " LPA";
  };

  // Always show years suffix, never doubled
  const formatExperience = (exp) => {
    const s = exp.trim();
    if (/years?$/i.test(s)) return s;
    return s + " years";
  };

  /* ───────────────── RENDER JOBS ───────────────── */
  function renderJobs() {
    const jobsGrid = $("#jobs-grid");
    if (!jobsGrid) return;

    const filtered =
      activeFilter === "all"
        ? jobs
        : jobs.filter((job) => job.type === activeFilter);

    if (!filtered.length) {
      jobsGrid.innerHTML = `<div class="no-jobs"><p>No openings right now. Check back soon.</p></div>`;
      return;
    }

    jobsGrid.innerHTML = filtered
      .map(
        (job) => `
            <article class="job-card fade-in">
                <div class="job-top">
                    <div>
                        <h3>${job.title}</h3>
                        <p class="job-dept">${job.dept}</p>
                    </div>
                    <span class="job-badge ${job.urgent ? "urgent" : ""}">
                        ${job.urgent ? "Urgent" : typeLabel(job.type)}
                    </span>
                </div>
                <p class="job-desc">${job.desc}</p>
                ${
                  job.skills && job.skills.length
                    ? `
                <div class="job-skills">
                    ${job.skills.map((skill) => `<span class="skill-pill">${skill}</span>`).join("")}
                </div>`
                    : ""
                }
                <div class="job-meta">
                    ${createTag(icon.location, job.location)}
                    ${createTag(icon.clock, typeLabel(job.type))}
                    ${job.experience ? createTag(icon.clock, formatExperience(job.experience)) : ""}
                    ${job.salary ? createTag(icon.money, formatSalary(job.salary)) : ""}
                </div>
                <div class="job-apply-row">
                    <p>Apply: <a href="mailto:narendra@unicornevent.com?subject=${encodeURIComponent(`Application: ${job.title}`)}">narendra@unicornevent.com</a></p>
                </div>
            </article>
        `,
      )
      .join("");

    animateCards();
  }

  /* ───────────────── ANIMATIONS ───────────────── */
  function animateCards() {
    requestAnimationFrame(() => {
      $$("#jobs-grid .fade-in").forEach((card, index) => {
        setTimeout(() => card.classList.add("visible"), index * 60);
      });
    });
  }

  /* ───────────────── INIT (runs after DOM ready) ───────────────── */
  document.addEventListener("DOMContentLoaded", () => {
    // Load jobs from server
    fetchJobs();

    // ── Filters ──
    $$(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        $$(".filter-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeFilter = btn.dataset.filter;
        renderJobs();
      });
    });
    $$(".fade-in").forEach((el) => observer.observe(el));
  });
})();
