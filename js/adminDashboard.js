/**
 * Admin Dashboard - Complete JavaScript
 * Manages Contact & Wedding Enquiries with Analytics
 * Now backed by Supabase via UnicornAPI (js/api.js) — NOT localStorage.
 */

class AdminDashboard {
    constructor() {
        this.contactEnquiries = [];
        this.weddingEnquiries = [];
        this.currentSection = 'dashboard';

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
            console.error('Error loading data from Supabase:', error);
            this.showNotification('Failed to load data from server!', true);
            this.contactEnquiries = [];
            this.weddingEnquiries = [];
        }
    }

    /** Map a contact_leads DB row → the shape the UI expects */
    mapContactRow(row) {
        return {
            id: row.id,
            firstName: row.first_name,
            lastName: row.last_name || '',
            email: row.email,
            phone: row.phone || '',
            service: row.service || '',
            eventDate: row.event_date || '',
            location: row.event_location || '',
            message: row.message || '',
            status: row.status || 'new',
            createdAt: row.submitted_at || row.created_at || new Date().toISOString()
        };
    }

    /** Map a wedding_leads DB row → the shape the UI expects */
    mapWeddingRow(row) {
        const budgetValue = Number(String(row.budget || '0').replace(/[^\d]/g, '')) || 0;
        return {
            id: row.id,
            name: row.name,
            email: row.email,
            phone: row.mobile || '',
            brideName: row.bride_name || '',
            groomName: row.groom_name || '',
            weddingDate: row.wedding_date,
            guestCount: row.guests || '',
            budget: row.budget || '0',
            venueLocation: row.venue_location || '',
            venueType: row.venue_type || '',
            eventTypes: row.theme || '',
            specialRequirements: row.special || '',
            status: row.status || 'new',
            createdAt: row.submitted_at || row.created_at || new Date().toISOString()
        };
    }

    /** Setup Event Listeners */
    setupEventListeners() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToSection(e.target.closest('.nav-link').dataset.section);
            });
        });

        document.getElementById('contactSort')?.addEventListener('change', () => this.renderContactTable());
        document.getElementById('contactSearch')?.addEventListener('input', () => this.renderContactTable());

        document.getElementById('weddingSort')?.addEventListener('change', () => this.renderWeddingCards());
        document.getElementById('weddingSearch')?.addEventListener('input', () => this.renderWeddingCards());

        document.querySelectorAll('.view-all-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToSection(e.target.dataset.goto);
            });
        });

        document.getElementById('exportBtn')?.addEventListener('click', () => this.exportData());
        document.getElementById('modalClose')?.addEventListener('click', () => this.closeModal());
        document.getElementById('modalOverlay')?.addEventListener('click', () => this.closeModal());

        // Manual refresh button (optional — add a button with id="refreshBtn" in your HTML if desired)
        document.getElementById('refreshBtn')?.addEventListener('click', async () => {
            await this.loadData();
            this.renderDashboard();
            this.showNotification('Data refreshed from server!');
        });
    }

    /** Navigate to Section */
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
        };

        document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';
        document.getElementById('pageSubtitle').textContent =
            section === 'dashboard' ? 'Welcome back to your admin panel' : 'Manage your enquiries';

        this.currentSection = section;

        if (section === 'contact-enquiries') this.renderContactTable();
        else if (section === 'wedding-enquiries') this.renderWeddingCards();
    }

    /** Render Dashboard */
    renderDashboard() {
        this.updateStats();
        this.renderRecentEnquiries();
        if (this.currentSection === 'contact-enquiries') this.renderContactTable();
        if (this.currentSection === 'wedding-enquiries') this.renderWeddingCards();
    }

    /** Update Statistics */
    updateStats() {
        const contactCount = this.contactEnquiries.length;
        const weddingCount = this.weddingEnquiries.length;
        const pendingCount = this.contactEnquiries.filter(c => c.status === 'pending').length +
            this.weddingEnquiries.filter(w => w.status === 'pending').length;

        const totalBudget = this.weddingEnquiries.reduce((sum, w) => sum + (w.budgetValue || 0), 0);

        // Optional chaining via getElementById null-check: if an element is
        // missing from the HTML, this skips it instead of throwing and
        // halting the entire render chain (this was the original bug).
        const contactEl = document.getElementById('contactCount');
        const weddingEl = document.getElementById('weddingCount');
        const pendingEl = document.getElementById('pendingCount');
        const budgetEl = document.getElementById('totalBudget');

        if (contactEl) contactEl.textContent = contactCount;
        if (weddingEl) weddingEl.textContent = weddingCount;
        if (pendingEl) pendingEl.textContent = pendingCount;
        if (budgetEl) budgetEl.textContent = '₹' + this.formatNumber(totalBudget);

        const badge = document.getElementById('notificationBadge');
        if (badge) badge.textContent = pendingCount;
    }

    /** Render Recent Enquiries */
    renderRecentEnquiries() {
        const container = document.getElementById('recentEnquiries');
        if (!container) return;

        const allEnquiries = [
            ...this.contactEnquiries.map(c => ({ ...c, type: 'contact' })),
            ...this.weddingEnquiries.map(w => ({ ...w, type: 'wedding' }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

        if (allEnquiries.length === 0) {
            container.innerHTML = '<p class="empty-state">No enquiries yet</p>';
            return;
        }

        container.innerHTML = allEnquiries.map(item => `
            <div class="recent-item" onclick="dashboard.showDetails('${item.type}', ${item.id})">
                <div class="recent-item-title">
                    ${item.type === 'contact' ? item.firstName + ' ' + item.lastName : item.name}
                    <span class="status-badge status-${item.status}">${item.status}</span>
                </div>
                <div class="recent-item-meta">
                    <span>${item.type === 'contact' ? item.service : (item.eventTypes || 'Wedding')}</span>
                    <span>${this.formatDate(item.createdAt)}</span>
                </div>
            </div>
        `).join('');
    }

    /** Render Contact Table */
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
        `).join('');
    }

    /** Render Wedding Cards */
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
                item.brideName.toLowerCase().includes(query)
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
        `).join('');
    }

    /** Show Contact Details in Modal */
    showContactDetails(id) {
        const contact = this.contactEnquiries.find(c => c.id === id);
        if (!contact) return;

        const modalBody = document.getElementById('modalBody');
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
        const wedding = this.weddingEnquiries.find(w => w.id === id);
        if (!wedding) return;

        const modalBody = document.getElementById('modalBody');
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
        if (type === 'contact') this.showContactDetails(id);
        else this.showWeddingDetails(id);
    }

    /** Update Contact Status — persists to Supabase */
    async updateContactStatus(id, status) {
        try {
            await UnicornAPI.updateContactStatus(id, status);
            const contact = this.contactEnquiries.find(c => c.id === id);
            if (contact) contact.status = status;
            this.renderContactTable();
            this.updateStats();
            this.renderRecentEnquiries();
            this.closeModal();
            this.showNotification(`Contact marked as ${status}!`);
        } catch (error) {
            console.error('Error updating contact status:', error);
            this.showNotification('Failed to update status on server!', true);
        }
    }

    /** Update Wedding Status — persists to Supabase */
    async updateWeddingStatus(id, status) {
        try {
            await UnicornAPI.updateWeddingStatus(id, status);
            const wedding = this.weddingEnquiries.find(w => w.id === id);
            if (wedding) wedding.status = status;
            this.renderWeddingCards();
            this.updateStats();
            this.renderRecentEnquiries();
            this.closeModal();
            this.showNotification(`Wedding marked as ${status}!`);
        } catch (error) {
            console.error('Error updating wedding status:', error);
            this.showNotification('Failed to update status on server!', true);
        }
    }

    /** Delete Contact — removes from Supabase, then from local UI */
    async deleteContact(id) {
        if (!confirm('Are you sure you want to delete this contact enquiry?')) return;
        try {
            await UnicornAPI.deleteContactLead(id);
            this.contactEnquiries = this.contactEnquiries.filter(c => c.id !== id);
            this.renderContactTable();
            this.updateStats();
            this.renderRecentEnquiries();
            this.showNotification('Contact enquiry deleted!');
        } catch (error) {
            console.error('Error deleting contact lead:', error);
            this.showNotification('Failed to delete from server!', true);
        }
    }

    /** Delete Wedding — removes from Supabase, then from local UI */
    async deleteWedding(id) {
        if (!confirm('Are you sure you want to delete this wedding enquiry?')) return;
        try {
            await UnicornAPI.deleteWeddingLead(id);
            this.weddingEnquiries = this.weddingEnquiries.filter(w => w.id !== id);
            this.renderWeddingCards();
            this.updateStats();
            this.renderRecentEnquiries();
            this.showNotification('Wedding enquiry deleted!');
        } catch (error) {
            console.error('Error deleting wedding lead:', error);
            this.showNotification('Failed to delete from server!', true);
        }
    }

    /** Export Data (still useful as a local backup) */

    formatWeddingForExport(rows) {
        return rows.map((row, index) => ({
            'Sr.No': index + 1,
            'Name': row.name,
            'Email': row.email,
            'Phone': row.phone,
            'Bride Name': row.brideName,
            'Groom Name': row.groomName,
            'Wedding Date': row.weddingDate,
            'Guest Count': row.guestCount,
            'Budget': row.budget,
            'Venue Location': row.venueLocation,
            'Venue Type': row.venueType,
            'Event Types': row.eventTypes,
            'Special Requirements': row.specialRequirements,
            'Status': row.status,
        }));
    }

    formatContactForExport(rows) {
        return rows.map((row, index) => ({
            'Sr.No': index + 1,
            'First Name': row.firstName,
            'Last Name': row.lastName,
            'Email': row.email,
            'Phone': row.phone,
            'Service': row.service,
            'Event Date': row.eventDate,
            'Message': row.message,
            'Status': row.status
        }));
    }
    exportData() {
        const contactSheet = XLSX.utils.json_to_sheet(
            this.formatContactForExport(this.contactEnquiries) // if you want the same for contacts
        );
        const weddingSheet = XLSX.utils.json_to_sheet(
            this.formatWeddingForExport(this.weddingEnquiries)
        );

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, contactSheet, 'Contact Enquiries');
        XLSX.utils.book_append_sheet(workbook, weddingSheet, 'Wedding Enquiries');

        const fileName = `unicorn_enquiries_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);

        this.showNotification('Data exported successfully!');
    }

    openModal() {
        document.getElementById('detailsModal').classList.add('active');
        document.getElementById('modalOverlay').classList.add('active');
    }

    closeModal() {
        document.getElementById('detailsModal').classList.remove('active');
        document.getElementById('modalOverlay').classList.remove('active');
    }

    showNotification(message, isError = false) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: ${isError ? '#ef4444' : '#4ade80'};
            color: white; padding: 15px 20px; border-radius: 8px;
            font-weight: 600; z-index: 2000; animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    formatDate(dateStr) {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    formatNumber(num) {
        if (num >= 10000000) return (num / 10000000).toFixed(1) + ' Cr';
        if (num >= 100000) return (num / 100000).toFixed(1) + ' L';
        return num.toLocaleString('en-IN');
    }
}

// Initialize Dashboard
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    if (typeof UnicornAPI === 'undefined') {
        console.error('[admin.js] UnicornAPI is not loaded! Make sure <script src="js/api.js"> is included BEFORE admin.js in your HTML.');
        alert('Error: UnicornAPI is not available.\n\nMake sure js/api.js is loaded before js/admin.js in your HTML <script> tags.');
        return;
    }
    dashboard = new AdminDashboard();
});

// Notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }
`;
document.head.appendChild(style);