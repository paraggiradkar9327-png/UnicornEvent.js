/**
 * Admin Dashboard — Supabase Edition
 * ───────────────────────────────────────────────────────────────
 * Pulls Contact Enquiries and Wedding Enquiries directly from your
 * Supabase project (via js/api.js → UnicornAPI.getLeads()) instead
 * of localStorage. Layout/markup/IDs are untouched — this file only
 * wires the existing HTML to live Supabase data.
 *
 * NOTE on "status": contact_leads / wedding_leads tables don't have
 * a status column, so statuses (new / pending / responded / archived)
 * are tracked locally per-browser in localStorage under
 * "ue_admin_lead_status" — purely a UI convenience layer on top of
 * the real Supabase records. Deleting a record removes it from
 * Supabase for everyone.
 */

class AdminDashboard {
    constructor() {
        this.contactEnquiries = [];
        this.weddingEnquiries = [];
        this.currentSection = 'dashboard';
        this.statusMap = this.loadStatusMap();

        this.init();
    }

    /* ════════════════════ INIT ════════════════════ */

    async init() {
        this.setupEventListeners();
        await this.loadData();
        this.renderDashboard();
    }

    /**
     * Load Contact + Wedding leads from Supabase.
     */
    async loadData() {
        try {
            this.setLoading(true);
            const { contact, wedding } = await UnicornAPI.getLeads();

            this.contactEnquiries = (contact || []).map(row => this.rowToContact(row));
            this.weddingEnquiries = (wedding || []).map(row => this.rowToWedding(row));
        } catch (error) {
            console.error('[AdminDashboard] Failed to load leads from Supabase:', error);
            this.showNotification('Could not load data from Supabase. Check your connection.', true);
            this.contactEnquiries = [];
            this.weddingEnquiries = [];
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(isLoading) {
        const subtitle = document.getElementById('pageSubtitle');
        if (!subtitle) return;
        if (isLoading) {
            this._prevSubtitle = subtitle.textContent;
            subtitle.textContent = 'Loading data from Supabase…';
        } else if (this._prevSubtitle !== undefined) {
            subtitle.textContent = this._prevSubtitle;
        }
    }

    /* ════════════════ ROW MAPPERS (Supabase → UI shape) ════════════════ */

    rowToContact(row) {
        return {
            id: row.id,
            firstName: row.first_name || '',
            lastName: row.last_name || '',
            email: row.email || '',
            phone: row.phone || '',
            service: row.service || '—',
            eventDate: row.event_date || '',
            location: row.event_location || '',
            message: row.message || '',
            status: this.statusMap['contact_' + row.id] || 'new',
            createdAt: row.submitted_at || new Date().toISOString()
        };
    }

    rowToWedding(row) {
        const budgetValue = this.parseBudgetValue(row.budget);
        return {
            id: row.id,
            name: row.name || '',
            email: row.email || '',
            phone: row.mobile || '',
            city: row.city || '',
            brideName: row.bride_name || '',
            groomName: row.groom_name || '',
            weddingDate: row.wedding_date || '',
            guestCount: row.guests || '',
            budget: row.budget || '0',
            budgetValue,
            venueLocation: row.venue_location || '',
            venueType: row.venue_type || '',
            eventTypes: row.theme || 'Wedding',
            specialRequirements: row.special || '',
            status: this.statusMap['wedding_' + row.id] || 'new',
            createdAt: row.submitted_at || new Date().toISOString()
        };
    }

    /** Pulls a numeric value (in rupees) out of a free-text budget string. */
    parseBudgetValue(budget) {
        if (!budget) return 0;
        const digits = String(budget).replace(/[^0-9.]/g, '');
        const num = parseFloat(digits);
        return isNaN(num) ? 0 : num;
    }

    /* ════════════════ STATUS MAP (localStorage UI layer) ════════════════ */

    loadStatusMap() {
        try {
            return JSON.parse(localStorage.getItem('ue_admin_lead_status') || '{}');
        } catch (_) {
            return {};
        }
    }

    saveStatusMap() {
        try {
            localStorage.setItem('ue_admin_lead_status', JSON.stringify(this.statusMap));
        } catch (error) {
            console.error('Error saving status map:', error);
        }
    }

    /* ════════════════ EVENT LISTENERS ════════════════ */

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToSection(e.target.closest('.nav-link').dataset.section);
            });
        });

        // Contact Enquiries
        document.getElementById('contactSort')?.addEventListener('change', () => this.renderContactTable());
        document.getElementById('contactSearch')?.addEventListener('input', () => this.renderContactTable());

        // Wedding Enquiries
        document.getElementById('weddingSort')?.addEventListener('change', () => this.renderWeddingCards());
        document.getElementById('weddingSearch')?.addEventListener('input', () => this.renderWeddingCards());

        // View All Links
        document.querySelectorAll('.view-all-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToSection(e.target.dataset.goto);
            });
        });

        // Settings
        document.getElementById('exportBtn')?.addEventListener('click', () => this.exportData());
        document.getElementById('clearBtn')?.addEventListener('click', () => this.clearData());
        document.getElementById('importBtn')?.addEventListener('click', () => this.importData());

        // Modal
        document.getElementById('modalClose')?.addEventListener('click', () => this.closeModal());
        document.getElementById('modalOverlay')?.addEventListener('click', () => this.closeModal());
    }

    /* ════════════════ NAVIGATION ════════════════ */

    navigateToSection(section) {
        document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));

        const selectedSection = document.getElementById(section);
        if (selectedSection) selectedSection.classList.add('active');

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === section) link.classList.add('active');
        });

        const titles = {
            'dashboard': 'Dashboard',
            'contact-enquiries': 'Contact Enquiries',
            'wedding-enquiries': 'Wedding Enquiries',
            'analytics': 'Analytics & Insights',
            'settings': 'Settings'
        };

        document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';
        document.getElementById('pageSubtitle').textContent =
            section === 'dashboard' ? 'Welcome back to your admin panel' : 'Manage your enquiries';

        this.currentSection = section;

        if (section === 'contact-enquiries') {
            this.renderContactTable();
        } else if (section === 'wedding-enquiries') {
            this.renderWeddingCards();
        } else if (section === 'analytics') {
            this.renderAnalytics();
        } else if (section === 'dashboard') {
            this.renderDashboard();
        }
    }

    /* ════════════════ DASHBOARD ════════════════ */

    renderDashboard() {
        this.updateStats();
        this.renderRecentEnquiries();
    }

    updateStats() {
        const contactCount = this.contactEnquiries.length;
        const weddingCount = this.weddingEnquiries.length;
        const pendingCount = this.contactEnquiries.filter(c => c.status === 'new' || c.status === 'pending').length +
            this.weddingEnquiries.filter(w => w.status === 'new' || w.status === 'pending').length;

        const totalBudget = this.weddingEnquiries.reduce((sum, w) => sum + (w.budgetValue || 0), 0);

        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

        set('contactCount', contactCount);
        set('weddingCount', weddingCount);
        set('pendingCount', pendingCount);
        set('totalBudget', '₹' + this.formatNumber(totalBudget));

        const badge = document.getElementById('notificationBadge');
        if (badge) badge.textContent = pendingCount;
    }

    renderRecentEnquiries() {
        const container = document.getElementById('recentEnquiries');
        if (!container) return;

        try {
            const allEnquiries = [
                ...this.contactEnquiries.map(c => ({ ...c, type: 'contact' })),
                ...this.weddingEnquiries.map(w => ({ ...w, type: 'wedding' }))
            ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);

            console.log('[AdminDashboard] recent enquiries computed:', allEnquiries.length, allEnquiries);

            if (allEnquiries.length === 0) {
                container.innerHTML = '<p class="empty-state">No enquiries yet</p>';
                return;
            }

            container.innerHTML = allEnquiries.map(item => `
                <div class="recent-item" onclick="dashboard.showDetails('${item.type}', ${item.id})">
                    <div class="recent-item-title">
                        ${item.type === 'contact' ? this.escape((item.firstName || '') + ' ' + (item.lastName || '')) : this.escape(item.name || 'Unnamed')}
                        <span class="status-badge status-${item.status || 'new'}">${item.status || 'new'}</span>
                    </div>
                    <div class="recent-item-meta">
                        <span>${this.escape(item.type === 'contact' ? (item.service || '—') : (item.eventTypes || 'Wedding'))}</span>
                        <span>${this.formatDate(item.createdAt)}</span>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('[AdminDashboard] renderRecentEnquiries failed:', error);
            container.innerHTML = '<p class="empty-state">Could not load recent enquiries — check console for details</p>';
        }
    }

    /* ════════════════ CONTACT TABLE ════════════════ */

    renderContactTable() {
        const tbody = document.getElementById('contactTable');
        if (!tbody) return;

        let data = [...this.contactEnquiries];

        const searchInput = document.getElementById('contactSearch');
        if (searchInput && searchInput.value) {
            const query = searchInput.value.toLowerCase();
            data = data.filter(item =>
                item.firstName.toLowerCase().includes(query) ||
                item.lastName.toLowerCase().includes(query) ||
                item.email.toLowerCase().includes(query)
            );
        }

        const sortSelect = document.getElementById('contactSort');
        const sortValue = sortSelect?.value || 'newest';

        switch (sortValue) {
            case 'oldest':
                data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'name':
                data.sort((a, b) => (a.firstName + a.lastName).localeCompare(b.firstName + b.lastName));
                break;
            case 'newest':
            default:
                data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        if (data.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="7" class="empty-message">No contact enquiries found</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(item => `
            <tr>
                <td class="col-name">${this.escape(item.firstName)} ${this.escape(item.lastName)}</td>
                <td class="col-email">${this.escape(item.email)}</td>
                <td class="col-phone">${this.escape(item.phone)}</td>
                <td class="col-service">${this.escape(item.service)}</td>
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
        `).join('');
    }

    /* ════════════════ WEDDING CARDS ════════════════ */

    renderWeddingCards() {
        const container = document.getElementById('weddingCards');
        if (!container) return;

        let data = [...this.weddingEnquiries];

        const searchInput = document.getElementById('weddingSearch');
        if (searchInput && searchInput.value) {
            const query = searchInput.value.toLowerCase();
            data = data.filter(item =>
                item.name.toLowerCase().includes(query) ||
                item.email.toLowerCase().includes(query) ||
                (item.brideName || '').toLowerCase().includes(query)
            );
        }

        const sortSelect = document.getElementById('weddingSort');
        const sortValue = sortSelect?.value || 'newest';

        switch (sortValue) {
            case 'date':
                data.sort((a, b) => new Date(a.weddingDate) - new Date(b.weddingDate));
                break;
            case 'budget':
                data.sort((a, b) => b.budgetValue - a.budgetValue);
                break;
            case 'newest':
            default:
                data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        if (data.length === 0) {
            container.innerHTML = '<p class="empty-state">No wedding enquiries found</p>';
            return;
        }

        container.innerHTML = data.map(item => `
            <div class="enquiry-card">
                <div class="card-header">
                    <h3 class="card-title">${this.escape(item.brideName) || this.escape(item.name)}${item.groomName ? ' & ' + this.escape(item.groomName) : ''}</h3>
                    <span class="card-badge">💍 ${item.status}</span>
                </div>

                <div class="card-field">
                    <span class="card-label">Contact Name</span>
                    <div class="card-value">${this.escape(item.name)}</div>
                </div>

                <div class="card-field">
                    <span class="card-label">Contact Email & Phone</span>
                    <div class="card-value">${this.escape(item.email)} | ${this.escape(item.phone)}</div>
                </div>

                <div class="card-field">
                    <span class="card-label">Wedding Date & Location</span>
                    <div class="card-value">${this.formatDate(item.weddingDate)} | ${this.escape(item.venueLocation || item.city)}</div>
                </div>

                <div class="card-field">
                    <span class="card-label">Guest Count & Venue Type</span>
                    <div class="card-value">${this.escape(String(item.guestCount || '—'))} Guests | ${this.escape(item.venueType || '—')}</div>
                </div>

                <div class="card-budget">
                    <span class="card-label">Budget</span>
                    <div class="card-value budget-value">₹${this.escape(String(item.budget))}</div>
                </div>

                <div class="card-actions">
                    <button class="action-btn" onclick="dashboard.showWeddingDetails(${item.id})">View Details</button>
                    <button class="action-btn" onclick="dashboard.deleteWedding(${item.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }

    /* ════════════════ ANALYTICS ════════════════ */

    renderAnalytics() {
        const contactCount = this.contactEnquiries.length;
        const weddingCount = this.weddingEnquiries.length;
        const total = contactCount + weddingCount || 1;

        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('pieWedding', weddingCount);
        set('pieContact', contactCount);

        const pieWeddingSeg = document.querySelector('.pie-segment.wedding');
        const pieContactSeg = document.querySelector('.pie-segment.contact');
        if (pieWeddingSeg) pieWeddingSeg.style.setProperty('--percentage', Math.round((weddingCount / total) * 100));
        if (pieContactSeg) pieContactSeg.style.setProperty('--percentage', Math.round((contactCount / total) * 100));

        this.renderTimelineChart();
        this.renderBudgetDistribution();
    }

    renderTimelineChart() {
        const container = document.getElementById('timelineChart');
        if (!container) return;

        const days = [];
        const counts = {};
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            days.push(dateStr);
            counts[dateStr] = 0;
        }

        [...this.contactEnquiries, ...this.weddingEnquiries].forEach(item => {
            const itemDate = new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (counts.hasOwnProperty(itemDate)) counts[itemDate]++;
        });

        const maxCount = Math.max(...Object.values(counts)) || 1;

        container.innerHTML = days.map(day => {
            const height = (counts[day] / maxCount) * 130;
            return `
                <div class="timeline-bar" style="height: ${height}px; min-height: 20px;">
                    <div class="timeline-label">${day}</div>
                </div>
            `;
        }).join('');
    }

    renderBudgetDistribution() {
        const ranges = [
            { min: 0, max: 5, id: 'budgetBar1', countId: 'budgetCount1' },
            { min: 5, max: 15, id: 'budgetBar2', countId: 'budgetCount2' },
            { min: 15, max: 30, id: 'budgetBar3', countId: 'budgetCount3' },
            { min: 30, max: Infinity, id: 'budgetBar4', countId: 'budgetCount4' }
        ];

        const counts = [0, 0, 0, 0];

        this.weddingEnquiries.forEach(wedding => {
            const budgetInLakhs = (wedding.budgetValue || 0) / 100000;
            for (let i = 0; i < ranges.length; i++) {
                if (budgetInLakhs >= ranges[i].min && budgetInLakhs < ranges[i].max) {
                    counts[i]++;
                    break;
                }
            }
        });

        const maxCount = Math.max(...counts) || 1;

        counts.forEach((count, index) => {
            const percentage = (count / maxCount) * 100;
            const bar = document.getElementById(ranges[index].id);
            const countElem = document.getElementById(ranges[index].countId);

            if (bar) bar.style.width = percentage + '%';
            if (countElem) countElem.textContent = count;
        });
    }

    /* ════════════════ MODALS ════════════════ */

    showContactDetails(id) {
        const contact = this.contactEnquiries.find(c => c.id === id);
        if (!contact) return;

        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <h2>Contact Enquiry Details</h2>

            <div class="modal-detail-item">
                <div class="modal-detail-label">Name</div>
                <div class="modal-detail-value">${this.escape(contact.firstName)} ${this.escape(contact.lastName)}</div>
            </div>

            <div class="modal-detail-item">
                <div class="modal-detail-label">Email</div>
                <div class="modal-detail-value">${this.escape(contact.email)}</div>
            </div>

            <div class="modal-detail-item">
                <div class="modal-detail-label">Phone</div>
                <div class="modal-detail-value">${this.escape(contact.phone)}</div>
            </div>

            <div class="modal-detail-item">
                <div class="modal-detail-label">Service</div>
                <div class="modal-detail-value">${this.escape(contact.service)}</div>
            </div>

            <div class="modal-detail-item">
                <div class="modal-detail-label">Event Date</div>
                <div class="modal-detail-value">${contact.eventDate ? this.formatDate(contact.eventDate) : '—'}</div>
            </div>

            <div class="modal-detail-item">
                <div class="modal-detail-label">Location</div>
                <div class="modal-detail-value">${this.escape(contact.location) || '—'}</div>
            </div>

            <div class="modal-detail-item">
                <div class="modal-detail-label">Message</div>
                <div class="modal-detail-value">${this.escape(contact.message)}</div>
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

    showWeddingDetails(id) {
        const wedding = this.weddingEnquiries.find(w => w.id === id);
        if (!wedding) return;

        const modalBody = document.getElementById('modalBody');
        const heading = wedding.brideName
            ? `${this.escape(wedding.brideName)}${wedding.groomName ? ' & ' + this.escape(wedding.groomName) : ''}'s Wedding`
            : `${this.escape(wedding.name)}'s Wedding Enquiry`;

        modalBody.innerHTML = `
            <h2>${heading}</h2>

            <div class="modal-detail-item">
                <div class="modal-detail-label">Contact Person</div>
                <div class="modal-detail-value">${this.escape(wedding.name)}</div>
            </div>

            <div class="modal-detail-item">
                <div class="modal-detail-label">Email & Phone</div>
                <div class="modal-detail-value">${this.escape(wedding.email)} | ${this.escape(wedding.phone)}</div>
            </div>

            <div class="modal-detail-item">
                <div class="modal-detail-label">Bride & Groom</div>
                <div class="modal-detail-value">${this.escape(wedding.brideName) || '—'} ${wedding.groomName ? '& ' + this.escape(wedding.groomName) : ''}</div>
            </div>

            <div class="modal-detail-item">
                <div class="modal-detail-label">Wedding Date</div>
                <div class="modal-detail-value">${wedding.weddingDate ? this.formatDate(wedding.weddingDate) : '—'}</div>
            </div>

            <div class="modal-detail-item">
                <div class="modal-detail-label">Venue Location & Type</div>
                <div class="modal-detail-value">${this.escape(wedding.venueLocation || wedding.city) || '—'} | ${this.escape(wedding.venueType) || '—'}</div>
            </div>

            <div class="modal-detail-item">
                <div class="modal-detail-label">Guest Count</div>
                <div class="modal-detail-value">${this.escape(String(wedding.guestCount || '—'))}</div>
            </div>

            <div class="modal-detail-item">
                <div class="modal-detail-label">Budget</div>
                <div class="modal-detail-value" style="color: var(--gold); font-weight: 600;">₹${this.escape(String(wedding.budget))}</div>
            </div>

            <div class="modal-detail-item">
                <div class="modal-detail-label">Event Types / Theme</div>
                <div class="modal-detail-value">${this.escape(wedding.eventTypes) || '—'}</div>
            </div>

            <div class="modal-detail-item">
                <div class="modal-detail-label">Special Requirements</div>
                <div class="modal-detail-value">${this.escape(wedding.specialRequirements) || '—'}</div>
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

    showDetails(type, id) {
        if (type === 'contact') {
            this.showContactDetails(id);
        } else {
            this.showWeddingDetails(id);
        }
    }

    /* ════════════════ STATUS UPDATES (local UI layer) ════════════════ */

    updateContactStatus(id, status) {
        const contact = this.contactEnquiries.find(c => c.id === id);
        if (!contact) return;
        contact.status = status;
        this.statusMap['contact_' + id] = status;
        this.saveStatusMap();
        this.renderContactTable();
        this.updateStats();
        this.renderRecentEnquiries();
        this.closeModal();
        this.showNotification(`Contact marked as ${status}!`);
    }

    updateWeddingStatus(id, status) {
        const wedding = this.weddingEnquiries.find(w => w.id === id);
        if (!wedding) return;
        wedding.status = status;
        this.statusMap['wedding_' + id] = status;
        this.saveStatusMap();
        this.renderWeddingCards();
        this.updateStats();
        this.renderRecentEnquiries();
        this.closeModal();
        this.showNotification(`Wedding marked as ${status}!`);
    }

    /* ════════════════ DELETE (real Supabase rows) ════════════════ */

    async deleteContact(id) {
        if (!confirm('Are you sure you want to delete this contact enquiry? This removes it from Supabase permanently.')) return;
        try {
            await UnicornAPI.deleteContactLead(id);
            this.contactEnquiries = this.contactEnquiries.filter(c => c.id !== id);
            delete this.statusMap['contact_' + id];
            this.saveStatusMap();
            this.renderContactTable();
            this.updateStats();
            this.renderRecentEnquiries();
            this.showNotification('Contact enquiry deleted!');
        } catch (error) {
            console.error(error);
            this.showNotification('Failed to delete from Supabase: ' + error.message, true);
        }
    }

    async deleteWedding(id) {
        if (!confirm('Are you sure you want to delete this wedding enquiry? This removes it from Supabase permanently.')) return;
        try {
            await UnicornAPI.deleteWeddingLead(id);
            this.weddingEnquiries = this.weddingEnquiries.filter(w => w.id !== id);
            delete this.statusMap['wedding_' + id];
            this.saveStatusMap();
            this.renderWeddingCards();
            this.updateStats();
            this.renderRecentEnquiries();
            this.showNotification('Wedding enquiry deleted!');
        } catch (error) {
            console.error(error);
            this.showNotification('Failed to delete from Supabase: ' + error.message, true);
        }
    }

    /* ════════════════ SETTINGS ════════════════ */

    exportData() {
        if (typeof XLSX === 'undefined') {
            this.showNotification('Excel export library failed to load. Check your internet connection.', true);
            return;
        }

        const contactRows = this.contactEnquiries.map(c => ({
            'Name': `${c.firstName} ${c.lastName}`.trim(),
            'Email': c.email,
            'Phone': c.phone,
            'Service': c.service,
            'Event Date': c.eventDate,
            'Location': c.location,
            'Message': c.message,
            'Status': c.status,
            'Received On': c.createdAt ? new Date(c.createdAt).toLocaleString() : ''
        }));

        const weddingRows = this.weddingEnquiries.map(w => ({
            'Contact Name': w.name,
            'Email': w.email,
            'Phone': w.phone,
            'Bride': w.brideName,
            'Groom': w.groomName,
            'Wedding Date': w.weddingDate,
            'City': w.city,
            'Venue Location': w.venueLocation,
            'Venue Type': w.venueType,
            'Guests': w.guestCount,
            'Budget': w.budget,
            'Event Types / Theme': w.eventTypes,
            'Special Requirements': w.specialRequirements,
            'Status': w.status,
            'Enquiry Date': w.createdAt ? new Date(w.createdAt).toLocaleString() : ''
        }));

        const wb = XLSX.utils.book_new();

        const contactSheet = XLSX.utils.json_to_sheet(
            contactRows.length ? contactRows : [{ 'No Data': 'No contact enquiries found' }]
        );
        XLSX.utils.book_append_sheet(wb, contactSheet, 'Contact Enquiries');

        const weddingSheet = XLSX.utils.json_to_sheet(
            weddingRows.length ? weddingRows : [{ 'No Data': 'No wedding enquiries found' }]
        );
        XLSX.utils.book_append_sheet(wb, weddingSheet, 'Wedding Enquiries');

        const fileName = `unicorn_enquiries_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        this.showNotification('Excel sheet exported successfully!');
    }

    /**
     * Import only updates local status labels (new/pending/responded/archived)
     * for matching IDs — it does NOT write enquiry data back into Supabase,
     * since the real records live there and shouldn't be overwritten blindly
     * from a local file.
     */
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    (data.contactEnquiries || []).forEach(c => {
                        if (c.id && c.status) this.statusMap['contact_' + c.id] = c.status;
                    });
                    (data.weddingEnquiries || []).forEach(w => {
                        if (w.id && w.status) this.statusMap['wedding_' + w.id] = w.status;
                    });
                    this.saveStatusMap();
                    this.contactEnquiries.forEach(c => c.status = this.statusMap['contact_' + c.id] || c.status);
                    this.weddingEnquiries.forEach(w => w.status = this.statusMap['wedding_' + w.id] || w.status);
                    this.renderDashboard();
                    this.showNotification('Status labels imported successfully!');
                } catch (error) {
                    this.showNotification('Error importing data!', true);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    /**
     * "Clear All Data" only clears local status labels — it does NOT delete
     * your real Supabase leads (use the Delete button per-row for that, or
     * the Supabase dashboard, to avoid an accidental mass-deletion here).
     */
    clearData() {
        if (!confirm('This will reset all local status labels (new/pending/responded/archived) back to "new". Your actual enquiries in Supabase will NOT be deleted. Continue?')) return;
        this.statusMap = {};
        this.saveStatusMap();
        this.contactEnquiries.forEach(c => c.status = 'new');
        this.weddingEnquiries.forEach(w => w.status = 'new');
        this.renderDashboard();
        this.showNotification('Status labels reset!');
    }

    /* ════════════════ MODAL HELPERS ════════════════ */

    openModal() {
        document.getElementById('detailsModal').classList.add('active');
        document.getElementById('modalOverlay').classList.add('active');
    }

    closeModal() {
        document.getElementById('detailsModal').classList.remove('active');
        document.getElementById('modalOverlay').classList.remove('active');
    }

    /* ════════════════ UTILITIES ════════════════ */

    showNotification(message, isError = false) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${isError ? '#ef4444' : '#4ade80'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 2000;
            animation: slideIn 0.3s ease;
            max-width: 360px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3500);
    }

    formatDate(dateStr) {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return String(dateStr);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatNumber(num) {
        num = Number(num) || 0;
        if (num >= 10000000) return (num / 10000000).toFixed(1) + ' Cr';
        if (num >= 100000) return (num / 100000).toFixed(1) + ' L';
        return num.toLocaleString('en-IN');
    }

    /** Basic HTML-escape so enquiry text can't break the layout/markup. */
    escape(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}

// Initialize Dashboard
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new AdminDashboard();
});

// CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);