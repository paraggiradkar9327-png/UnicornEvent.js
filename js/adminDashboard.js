class AdminDashboard {
  constructor() {
    this.contactEnquiries = [];
    this.weddingEnquiries = [];
    this.currentSection = "dashboard";

    this.init();
  }

  /** Initialize Dashboard */
  async init() {
    this.setupEventListeners();
    await this.loadData();
    this.renderDashboard();
  }

  /** Load data from Supabase (via UnicornAPI) */
  async loadData() {
    try {
      const { contact, wedding } = await UnicornAPI.getLeads();
      this.contactEnquiries = (contact || []).map(this.mapContactRow);
      this.weddingEnquiries = (wedding || []).map(this.mapWeddingRow);
    } catch (error) {
      console.error("Error loading data from Supabase:", error);
      this.showNotification("Failed to load data from server!", true);
      this.contactEnquiries = [];
      this.weddingEnquiries = [];
    }
  }

  /** Map a contact_leads DB row → the shape the UI expects */
  mapContactRow(row) {
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name || "",
      email: row.email,
      phone: row.phone || "",
      service: row.service || "",
      eventDate: row.event_date || "",
      location: row.event_location || "",
      message: row.message || "",
      status: row.status || "new",
      createdAt: row.submitted_at || row.created_at || new Date().toISOString(),
    };
  }

  /** Map a wedding_leads DB row → the shape the UI expects */
  mapWeddingRow(row) {
    const budgetValue =
      Number(String(row.budget || "0").replace(/[^\d]/g, "")) || 0;
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.mobile || "",
      brideName: row.bride_name || "",
      groomName: row.groom_name || "",
      weddingDate: row.wedding_date,
      guestCount: row.guests || "",
      budget: row.budget || "0",
      venueLocation: row.venue_location || "",
      venueType: row.venue_type || "",
      eventTypes: row.theme || "",
      specialRequirements: row.special || "",
      status: row.status || "new",
      createdAt: row.submitted_at || row.created_at || new Date().toISOString(),
    };
  }

  /** Setup Event Listeners */
  setupEventListeners() {
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        this.navigateToSection(e.target.closest(".nav-link").dataset.section);
      });
    });

    document
      .getElementById("contactSort")
      ?.addEventListener("change", () => this.renderContactTable());
    document
      .getElementById("contactSearch")
      ?.addEventListener("input", () => this.renderContactTable());

    document
      .getElementById("weddingSort")
      ?.addEventListener("change", () => this.renderWeddingCards());
    document
      .getElementById("weddingSearch")
      ?.addEventListener("input", () => this.renderWeddingCards());

    document
      .getElementById("exportBtn")
      ?.addEventListener("click", () => this.exportData());
    document
      .getElementById("ytSaveBtn")
      ?.addEventListener("click", () => this.saveYoutubeVideo());
    document.getElementById("ytUrlInput")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.saveYoutubeVideo();
    });
    document
      .getElementById("cj-post-btn")
      ?.addEventListener("click", () => this.postJob());
    document
      .getElementById("cj-clear-btn")
      ?.addEventListener("click", () => this.clearJobForm());
    document.getElementById("cj-list")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".cj-del-btn");
      if (btn) this.deleteJob(Number(btn.dataset.id));
    });
    document
      .getElementById("modalClose")
      ?.addEventListener("click", () => this.closeModal());
    document
      .getElementById("modalOverlay")
      ?.addEventListener("click", () => this.closeModal());
  }

  /** Navigate to Section */
  navigateToSection(section) {
    document
      .querySelectorAll(".section")
      .forEach((sec) => sec.classList.remove("active"));
    const selectedSection = document.getElementById(section);
    if (selectedSection) selectedSection.classList.add("active");

    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active");
      if (link.dataset.section === section) link.classList.add("active");
    });

    const titles = {
      dashboard: "Dashboard",
      "contact-enquiries": "Contact Enquiries",
      "wedding-enquiries": "Wedding Enquiries",
      "hero-video": "Hero Video",
      careers: "Careers",
    };

    document.getElementById("pageTitle").textContent =
      titles[section] || "Dashboard";
    document.getElementById("pageSubtitle").textContent =
      section === "dashboard"
        ? "Welcome back to your admin panel"
        : section === "hero-video"
          ? "Update the homepage background video"
          : section === "careers"
            ? "Post and manage job openings"
            : "Manage your enquiries";

    this.currentSection = section;

    if (section === "contact-enquiries") this.renderContactTable();
    else if (section === "wedding-enquiries") this.renderWeddingCards();
    else if (section === "hero-video") this.loadHeroVideo();
    else if (section === "careers") this.loadJobs();
  }

  /* ── HERO VIDEO (YouTube link) ─────────────────────────── */
  extractYtId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
      /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  }

  async loadHeroVideo() {
    const preview = document.getElementById("ytPreview");
    if (!preview) return;
    try {
      const cfg = await UnicornAPI.getVideoConfig();
      if (cfg.type === "youtube" && cfg.videoId) {
        preview.innerHTML = `<iframe src="https://www.youtube.com/embed/${cfg.videoId}" title="Current hero video" allowfullscreen></iframe>`;
        const input = document.getElementById("ytUrlInput");
        if (input && !input.value)
          input.value = `https://www.youtube.com/watch?v=${cfg.videoId}`;
      } else if (cfg.type === "file") {
        preview.innerHTML =
          '<p class="empty-state">An uploaded video file is currently set. Saving a YouTube link will replace it.</p>';
      } else {
        preview.innerHTML = '<p class="empty-state">No video set yet</p>';
      }
    } catch (err) {
      console.error("Could not load hero video config:", err);
      preview.innerHTML =
        '<p class="empty-state">Could not load current video</p>';
    }
  }

  async saveYoutubeVideo() {
    const input = document.getElementById("ytUrlInput");
    const error = document.getElementById("ytUrlError");
    const btn = document.getElementById("ytSaveBtn");
    const videoId = this.extractYtId(input.value.trim());

    if (!videoId) {
      error.textContent = "Please enter a valid YouTube URL.";
      return;
    }
    error.textContent = "";
    btn.disabled = true;
    btn.textContent = "Saving...";

    try {
      await UnicornAPI.setYoutubeVideo(videoId);
      this.showNotification("YouTube video updated on homepage!");
      await this.loadHeroVideo();
    } catch (err) {
      console.error("Failed to save YouTube video:", err);
      error.textContent = "Failed to save. Please try again.";
    } finally {
      btn.disabled = false;
      btn.textContent = "Set YouTube Video";
    }
  }

  /* ── CAREERS ───────────────────────────────────────────── */
  escHtml(str) {
    return String(str ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }

  jobTypeLabel(type) {
    return (
      {
        "full-time": "Full-Time",
        "part-time": "Part-Time",
        freelance: "Freelance",
        internship: "Internship",
      }[type] || type
    );
  }

  async loadJobs() {
    try {
      this.jobs = await UnicornAPI.getJobs();
    } catch (err) {
      console.error("Could not load jobs:", err);
      this.jobs = [];
      this.showNotification("Failed to load jobs from server!", true);
    }
    this.renderJobsList();
  }

  renderJobsList() {
    const list = document.getElementById("cj-list");
    if (!list) return;

    if (!this.jobs || !this.jobs.length) {
      list.innerHTML = '<p class="empty-state">No listings yet</p>';
      return;
    }

    list.innerHTML = this.jobs
      .map(
        (job) => `
        <div class="cj-item">
            <div class="cj-item-info">
                <div class="cj-item-title">
                    ${this.escHtml(job.title)}
                    ${job.urgent ? '<span class="status-badge status-pending">urgent</span>' : ""}
                </div>
                <div class="cj-item-meta">
                    ${this.escHtml(job.dept)} · ${this.escHtml(this.jobTypeLabel(job.type))} · ${this.escHtml(job.location)}
                </div>
            </div>
            <button class="cj-del-btn" data-id="${job.id}" title="Delete listing">&times;</button>
        </div>
    `,
      )
      .join("");
  }

  async postJob() {
    const val = (id) => document.getElementById(id)?.value.trim() || "";
    const error = document.getElementById("cj-error");
    const btn = document.getElementById("cj-post-btn");

    const data = {
      title: val("cj-title"),
      dept: document.getElementById("cj-dept").value,
      type: document.getElementById("cj-type").value,
      location: val("cj-location"),
      experience: val("cj-experience"),
      salary: val("cj-salary"),
      desc: val("cj-desc"),
      skills: val("cj-skills")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      urgent: document.getElementById("cj-urgent").value === "true",
    };

    if (
      !data.title ||
      !data.dept ||
      !data.type ||
      !data.location ||
      !data.desc
    ) {
      error.textContent = "Please fill all required fields.";
      return;
    }
    error.textContent = "";
    btn.disabled = true;
    btn.textContent = "Publishing...";

    try {
      const result = await UnicornAPI.createJob(data);
      this.jobs = [result.job, ...(this.jobs || [])];
      this.renderJobsList();
      this.clearJobForm();
      this.showNotification("Job posted! It is now live on the careers page.");
    } catch (err) {
      console.error("Failed to post job:", err);
      error.textContent = "Failed to save job. Please try again.";
    } finally {
      btn.disabled = false;
      btn.textContent = "Publish Job Listing";
    }
  }

  clearJobForm() {
    [
      "cj-title",
      "cj-location",
      "cj-experience",
      "cj-salary",
      "cj-desc",
      "cj-skills",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    document.getElementById("cj-dept").value = "";
    document.getElementById("cj-type").value = "";
    document.getElementById("cj-urgent").value = "false";
    document.getElementById("cj-error").textContent = "";
  }

  async deleteJob(id) {
    if (
      !confirm(
        "Delete this job listing? It will be removed from the careers page.",
      )
    )
      return;
    try {
      await UnicornAPI.deleteJob(id);
      this.jobs = this.jobs.filter((j) => j.id !== id);
      this.renderJobsList();
      this.showNotification("Job listing deleted.");
    } catch (err) {
      console.error("Failed to delete job:", err);
      this.showNotification("Failed to delete job. Please try again.", true);
    }
  }

  /** Render Dashboard */
  renderDashboard() {
    this.updateStats();
    this.renderRecentEnquiries();
    if (this.currentSection === "contact-enquiries") this.renderContactTable();
    if (this.currentSection === "wedding-enquiries") this.renderWeddingCards();
  }

  /** Update Statistics */
  updateStats() {
    const contactCount = this.contactEnquiries.length;
    const weddingCount = this.weddingEnquiries.length;
    const pendingCount =
      this.contactEnquiries.filter((c) => c.status === "pending").length +
      this.weddingEnquiries.filter((w) => w.status === "pending").length;

    const totalBudget = this.weddingEnquiries.reduce(
      (sum, w) => sum + (w.budgetValue || 0),
      0,
    );

    // Optional chaining via getElementById null-check: if an element is
    // missing from the HTML, this skips it instead of throwing and
    // halting the entire render chain (this was the original bug).
    const contactEl = document.getElementById("contactCount");
    const weddingEl = document.getElementById("weddingCount");
    const pendingEl = document.getElementById("pendingCount");
    const budgetEl = document.getElementById("totalBudget");

    if (contactEl) contactEl.textContent = contactCount;
    if (weddingEl) weddingEl.textContent = weddingCount;
    if (pendingEl) pendingEl.textContent = pendingCount;
    if (budgetEl) budgetEl.textContent = "₹" + this.formatNumber(totalBudget);

    const badge = document.getElementById("notificationBadge");
    if (badge) badge.textContent = pendingCount;
  }

  /** Render Recent Enquiries */
  renderRecentEnquiries() {
    const container = document.getElementById("recentEnquiries");
    if (!container) return;

    const allEnquiries = [
      ...this.contactEnquiries.map((c) => ({ ...c, type: "contact" })),
      ...this.weddingEnquiries.map((w) => ({ ...w, type: "wedding" })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    if (allEnquiries.length === 0) {
      container.innerHTML = '<p class="empty-state">No enquiries yet</p>';
      return;
    }

    container.innerHTML = allEnquiries
      .map(
        (item) => `
            <div class="recent-item" onclick="dashboard.showDetails('${item.type}', ${item.id})">
                <div class="recent-item-title">
                    ${item.type === "contact" ? item.firstName + " " + item.lastName : item.name}
                    <span class="status-badge status-${item.status}">${item.status}</span>
                </div>
                <div class="recent-item-meta">
                    <span>${item.type === "contact" ? item.service : item.eventTypes || "Wedding"}</span>
                    <span>${this.formatDate(item.createdAt)}</span>
                </div>
            </div>
        `,
      )
      .join("");
  }

  /** Render Contact Table */
  renderContactTable() {
    const tbody = document.getElementById("contactTable");
    if (!tbody) return;

    let data = [...this.contactEnquiries];

    const searchInput = document.getElementById("contactSearch");
    if (searchInput && searchInput.value) {
      const query = searchInput.value.toLowerCase();
      data = data.filter(
        (item) =>
          item.firstName.toLowerCase().includes(query) ||
          item.lastName.toLowerCase().includes(query) ||
          item.email.toLowerCase().includes(query),
      );
    }

    const sortSelect = document.getElementById("contactSort");
    const sortValue = sortSelect?.value || "newest";

    switch (sortValue) {
      case "oldest":
        data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "name":
        data.sort((a, b) =>
          (a.firstName + a.lastName).localeCompare(b.firstName + b.lastName),
        );
        break;
      case "newest":
      default:
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    if (data.length === 0) {
      tbody.innerHTML =
        '<tr class="empty-row"><td colspan="7" class="empty-message">No contact enquiries found</td></tr>';
      return;
    }

    tbody.innerHTML = data
      .map(
        (item) => `
            <tr>
                <td class="col-name">${item.firstName} ${item.lastName}</td>
                <td class="col-email">${item.email}</td>
                <td class="col-phone">${item.phone}</td>
                <td class="col-service">${item.service}</td>
                <td class="col-date">${this.formatDate(item.createdAt)}</td>
                <td class="col-status">
                    <span class="status-badge status-${item.status}">${item.status}</span>
                </td>
                <td class="col-actions">
                    <div class="action-buttons">
                        <button class="action-btn" onclick="dashboard.showContactDetails(${item.id})">View</button>
                        <button class="action-btn" onclick="dashboard.deleteContact(${item.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `,
      )
      .join("");
  }

  /** Render Wedding Cards */
  renderWeddingCards() {
    const container = document.getElementById("weddingCards");
    if (!container) return;

    let data = [...this.weddingEnquiries];

    const searchInput = document.getElementById("weddingSearch");
    if (searchInput && searchInput.value) {
      const query = searchInput.value.toLowerCase();
      data = data.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.email.toLowerCase().includes(query) ||
          item.brideName.toLowerCase().includes(query),
      );
    }

    const sortSelect = document.getElementById("weddingSort");
    const sortValue = sortSelect?.value || "newest";

    switch (sortValue) {
      case "date":
        data.sort((a, b) => new Date(a.weddingDate) - new Date(b.weddingDate));
        break;
      case "budget":
        data.sort((a, b) => b.budgetValue - a.budgetValue);
        break;
      case "newest":
      default:
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    if (data.length === 0) {
      container.innerHTML =
        '<p class="empty-state">No wedding enquiries found</p>';
      return;
    }

    container.innerHTML = data
      .map(
        (item) => `
            <div class="enquiry-card">
                <div class="card-header">
                    <h3 class="card-title">${item.brideName} & ${item.groomName}</h3>
                    <span class="card-badge">💍 ${item.status}</span>
                </div>
                <div class="card-field">
                    <span class="card-label">Contact Name</span>
                    <div class="card-value">${item.name}</div>
                </div>
                <div class="card-field">
                    <span class="card-label">Contact Email & Phone</span>
                    <div class="card-value">${item.email} | ${item.phone}</div>
                </div>
                <div class="card-field">
                    <span class="card-label">Wedding Date & Location</span>
                    <div class="card-value">${this.formatDate(item.weddingDate)} | ${item.venueLocation}</div>
                </div>
                <div class="card-field">
                    <span class="card-label">Guest Count & Venue Type</span>
                    <div class="card-value">${item.guestCount} Guests | ${item.venueType}</div>
                </div>
                <div class="card-budget">Budget: ₹${item.budget}</div>
                <div class="card-field">
                    <span class="card-label">Events & Special Requirements</span>
                    <div class="card-value">${item.eventTypes}</div>
                    <div class="card-value" style="font-size: 0.9rem; color: var(--fg2); margin-top: 5px;">
                        ${item.specialRequirements}
                    </div>
                </div>
                <div class="card-actions">
                    <button class="card-action-btn" onclick="dashboard.showWeddingDetails(${item.id})">View Full</button>
                    <button class="card-action-btn" onclick="dashboard.deleteWedding(${item.id})">Delete</button>
                </div>
            </div>
        `,
      )
      .join("");
  }

  /** Show Contact Details in Modal */
  showContactDetails(id) {
    const contact = this.contactEnquiries.find((c) => c.id === id);
    if (!contact) return;

    const modalBody = document.getElementById("modalBody");
    modalBody.innerHTML = `
            <h2>Contact Enquiry Details</h2>
            <div class="modal-detail-item">
                <div class="modal-detail-label">Name</div>
                <div class="modal-detail-value">${contact.firstName} ${contact.lastName}</div>
            </div>
            <div class="modal-detail-item">
                <div class="modal-detail-label">Email</div>
                <div class="modal-detail-value">${contact.email}</div>
            </div>
            <div class="modal-detail-item">
                <div class="modal-detail-label">Phone</div>
                <div class="modal-detail-value">${contact.phone}</div>
            </div>
            <div class="modal-detail-item">
                <div class="modal-detail-label">Service</div>
                <div class="modal-detail-value">${contact.service}</div>
            </div>
            <div class="modal-detail-item">
                <div class="modal-detail-label">Event Date</div>
                <div class="modal-detail-value">${this.formatDate(contact.eventDate)}</div>
            </div>
            <div class="modal-detail-item">
                <div class="modal-detail-label">Location</div>
                <div class="modal-detail-value">${contact.location}</div>
            </div>
            <div class="modal-detail-item">
                <div class="modal-detail-label">Message</div>
                <div class="modal-detail-value">${contact.message}</div>
            </div>
            <div class="modal-detail-item">
                <div class="modal-detail-label">Status</div>
                <div class="modal-detail-value">
                    <span class="status-badge status-${contact.status}">${contact.status}</span>
                </div>
            </div>
            <div class="modal-detail-item">
                <div class="modal-detail-label">Received On</div>
                <div class="modal-detail-value">${new Date(contact.createdAt).toLocaleString()}</div>
            </div>
            <div class="modal-actions">
                <button class="modal-action-btn" onclick="dashboard.updateContactStatus(${id}, 'responded')">Mark Responded</button>
                <button class="modal-action-btn" onclick="dashboard.updateContactStatus(${id}, 'archived')">Archive</button>
            </div>
        `;

    this.openModal();
  }

  /** Show Wedding Details in Modal */
  showWeddingDetails(id) {
    const wedding = this.weddingEnquiries.find((w) => w.id === id);
    if (!wedding) return;

    const modalBody = document.getElementById("modalBody");
    modalBody.innerHTML = `
            <h2>${wedding.brideName} & ${wedding.groomName}'s Wedding</h2>
            <div class="modal-detail-item">
                <div class="modal-detail-label">Contact Person</div>
                <div class="modal-detail-value">${wedding.name}</div>
            </div>
            <div class="modal-detail-item">
                <div class="modal-detail-label">Email & Phone</div>
                <div class="modal-detail-value">${wedding.email} | ${wedding.phone}</div>
            </div>
            <div class="modal-detail-item">
                <div class="modal-detail-label">Bride & Groom</div>
                <div class="modal-detail-value">${wedding.brideName} & ${wedding.groomName}</div>
            </div>
            <div class="modal-detail-item">
                <div class="modal-detail-label">Wedding Date</div>
                <div class="modal-detail-value">${this.formatDate(wedding.weddingDate)}</div>
            </div>
            <div class="modal-detail-item">
                <div class="modal-detail-label">Venue Location & Type</div>
                <div class="modal-detail-value">${wedding.venueLocation} | ${wedding.venueType}</div>
            </div>
            <div class="modal-detail-item">
                <div class="modal-detail-label">Guest Count</div>
                <div class="modal-detail-value">${wedding.guestCount}</div>
            </div>
            <div class="modal-detail-item">
                <div class="modal-detail-label">Budget</div>
                <div class="modal-detail-value" style="color: var(--gold); font-weight: 600;">₹${wedding.budget}</div>
            </div>
            <div class="modal-detail-item">
                <div class="modal-detail-label">Event Types</div>
                <div class="modal-detail-value">${wedding.eventTypes}</div>
            </div>
            <div class="modal-detail-item">
                <div class="modal-detail-label">Special Requirements</div>
                <div class="modal-detail-value">${wedding.specialRequirements}</div>
            </div>
            <div class="modal-detail-item">
                <div class="modal-detail-label">Status</div>
                <div class="modal-detail-value">
                    <span class="status-badge status-${wedding.status}">${wedding.status}</span>
                </div>
            </div>
            <div class="modal-detail-item">
                <div class="modal-detail-label">Enquiry Date</div>
                <div class="modal-detail-value">${new Date(wedding.createdAt).toLocaleString()}</div>
            </div>
            <div class="modal-actions">
                <button class="modal-action-btn" onclick="dashboard.updateWeddingStatus(${id}, 'responded')">Mark Responded</button>
                <button class="modal-action-btn" onclick="dashboard.updateWeddingStatus(${id}, 'archived')">Archive</button>
            </div>
        `;

    this.openModal();
  }

  /** Show Details (Generic) */
  showDetails(type, id) {
    if (type === "contact") this.showContactDetails(id);
    else this.showWeddingDetails(id);
  }

  /** Update Contact Status — persists to Supabase */
  async updateContactStatus(id, status) {
    try {
      await UnicornAPI.updateContactStatus(id, status);
      const contact = this.contactEnquiries.find((c) => c.id === id);
      if (contact) contact.status = status;
      this.renderContactTable();
      this.updateStats();
      this.renderRecentEnquiries();
      this.closeModal();
      this.showNotification(`Contact marked as ${status}!`);
    } catch (error) {
      console.error("Error updating contact status:", error);
      this.showNotification("Failed to update status on server!", true);
    }
  }

  /** Update Wedding Status — persists to Supabase */
  async updateWeddingStatus(id, status) {
    try {
      await UnicornAPI.updateWeddingStatus(id, status);
      const wedding = this.weddingEnquiries.find((w) => w.id === id);
      if (wedding) wedding.status = status;
      this.renderWeddingCards();
      this.updateStats();
      this.renderRecentEnquiries();
      this.closeModal();
      this.showNotification(`Wedding marked as ${status}!`);
    } catch (error) {
      console.error("Error updating wedding status:", error);
      this.showNotification("Failed to update status on server!", true);
    }
  }

  /** Delete Contact — removes from Supabase, then from local UI */
  async deleteContact(id) {
    if (!confirm("Are you sure you want to delete this contact enquiry?"))
      return;
    try {
      await UnicornAPI.deleteContactLead(id);
      this.contactEnquiries = this.contactEnquiries.filter((c) => c.id !== id);
      this.renderContactTable();
      this.updateStats();
      this.renderRecentEnquiries();
      this.showNotification("Contact enquiry deleted!");
    } catch (error) {
      console.error("Error deleting contact lead:", error);
      this.showNotification("Failed to delete from server!", true);
    }
  }

  /** Delete Wedding — removes from Supabase, then from local UI */
  async deleteWedding(id) {
    if (!confirm("Are you sure you want to delete this wedding enquiry?"))
      return;
    try {
      await UnicornAPI.deleteWeddingLead(id);
      this.weddingEnquiries = this.weddingEnquiries.filter((w) => w.id !== id);
      this.renderWeddingCards();
      this.updateStats();
      this.renderRecentEnquiries();
      this.showNotification("Wedding enquiry deleted!");
    } catch (error) {
      console.error("Error deleting wedding lead:", error);
      this.showNotification("Failed to delete from server!", true);
    }
  }

  /** Export Data (still useful as a local backup) */

  formatWeddingForExport(rows) {
    return rows.map((row, index) => ({
      "Sr.No": index + 1,
      Name: row.name,
      Email: row.email,
      Phone: row.phone,
      "Bride Name": row.brideName,
      "Groom Name": row.groomName,
      "Wedding Date": row.weddingDate,
      "Guest Count": row.guestCount,
      Budget: row.budget,
      "Venue Location": row.venueLocation,
      "Venue Type": row.venueType,
      "Event Types": row.eventTypes,
      "Special Requirements": row.specialRequirements,
      Status: row.status,
    }));
  }

  formatContactForExport(rows) {
    return rows.map((row, index) => ({
      "Sr.No": index + 1,
      "First Name": row.firstName,
      "Last Name": row.lastName,
      Email: row.email,
      Phone: row.phone,
      Service: row.service,
      "Event Date": row.eventDate,
      Message: row.message,
      Status: row.status,
    }));
  }
  exportData() {
    const contactSheet = XLSX.utils.json_to_sheet(
      this.formatContactForExport(this.contactEnquiries), // if you want the same for contacts
    );
    const weddingSheet = XLSX.utils.json_to_sheet(
      this.formatWeddingForExport(this.weddingEnquiries),
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, contactSheet, "Contact Enquiries");
    XLSX.utils.book_append_sheet(workbook, weddingSheet, "Wedding Enquiries");

    const fileName = `unicorn_enquiries_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    this.showNotification("Data exported successfully!");
  }

  openModal() {
    document.getElementById("detailsModal").classList.add("active");
    document.getElementById("modalOverlay").classList.add("active");
  }

  closeModal() {
    document.getElementById("detailsModal").classList.remove("active");
    document.getElementById("modalOverlay").classList.remove("active");
  }

  showNotification(message, isError = false) {
    const notification = document.createElement("div");
    notification.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: ${isError ? "#ef4444" : "#4ade80"};
            color: white; padding: 15px 20px; border-radius: 8px;
            font-weight: 600; z-index: 2000; animation: slideIn 0.3s ease;
        `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  formatDate(dateStr) {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
}

// Initialize Dashboard
let dashboard;
document.addEventListener("DOMContentLoaded", () => {
  if (typeof UnicornAPI === "undefined") {
    console.error(
      '[admin.js] UnicornAPI is not loaded! Make sure <script src="js/api.js"> is included BEFORE admin.js in your HTML.',
    );
    alert(
      "Error: UnicornAPI is not available.\n\nMake sure js/api.js is loaded before js/admin.js in your HTML <script> tags.",
    );
    return;
  }
  dashboard = new AdminDashboard();
});

// Notification animations
const style = document.createElement("style");
style.textContent = `
    @keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }
`;
document.head.appendChild(style);
