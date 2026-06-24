(() => {
    'use strict';

    /* ───────────────── CONFIG ───────────────── */
    const CONFIG = {
        ADMIN_PASSWORD: 'unicorn2026',
        SECRET_KEY: 'u',
        SECRET_PRESSES: 3,
        SECRET_WINDOW_MS: 1500
    };

    /* ───────────────── HELPERS ───────────────── */
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => [...document.querySelectorAll(selector)];

    const typeMap = {
        'full-time': 'Full-Time',
        'part-time': 'Part-Time',
        freelance: 'Freelance',
        internship: 'Internship'
    };
    const typeLabel = (type) => typeMap[type] || type;

    /* ───────────────── STATE ───────────────── */
    let jobs = [];
    let activeFilter = 'all';
    let secretKeys = [];

    /* ───────────────── SERVER API ───────────────── */
    async function fetchJobs() {
        try {
            jobs = await window.UnicornAPI.getJobs();
            renderJobs();
        } catch (err) {
            console.warn('[Careers] Could not load jobs:', err);
        }
    }

    async function postJobToServer(data) {
        return await window.UnicornAPI.createJob(data);
    }

    async function deleteJobFromServer(id) {
        await window.UnicornAPI.deleteJob(id);
    }

    /* ───────────────── TEMPLATE HELPERS ───────────────── */
    const icon = {
        location: `<svg viewBox="0 0 24 24"><path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>`,
        clock: `<svg viewBox="0 0 24 24"><path d="M12 6v6h4.5"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
        money: `<svg viewBox="0 0 24 24"><path d="M12 6v12"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
    };

    const createTag = (svg, text) => `<span class="job-tag">${svg}${text}</span>`;

    // Always show LPA suffix, never doubled
    const formatSalary = (salary) => {
        const s = salary.trim();
        if (/lpa$/i.test(s)) return s;
        return s + ' LPA';
    };

    // Always show years suffix, never doubled
    const formatExperience = (exp) => {
        const s = exp.trim();
        if (/years?$/i.test(s)) return s;
        return s + ' years';
    };

    /* ───────────────── RENDER JOBS ───────────────── */
    function renderJobs() {
        const jobsGrid = $('#jobs-grid');
        if (!jobsGrid) return;

        const filtered = activeFilter === 'all'
            ? jobs
            : jobs.filter(job => job.type === activeFilter);

        if (!filtered.length) {
            jobsGrid.innerHTML = `<div class="no-jobs"><p>No openings right now. Check back soon.</p></div>`;
            return;
        }

        jobsGrid.innerHTML = filtered.map(job => `
            <article class="job-card fade-in">
                <div class="job-top">
                    <div>
                        <h3>${job.title}</h3>
                        <p class="job-dept">${job.dept}</p>
                    </div>
                    <span class="job-badge ${job.urgent ? 'urgent' : ''}">
                        ${job.urgent ? 'Urgent' : typeLabel(job.type)}
                    </span>
                </div>
                <p class="job-desc">${job.desc}</p>
                <div class="job-meta">
                    ${createTag(icon.location, job.location)}
                    ${createTag(icon.clock, typeLabel(job.type))}
                    ${job.experience ? createTag(icon.clock, formatExperience(job.experience)) : ''}
                    ${job.salary ? createTag(icon.money, formatSalary(job.salary)) : ''}
                </div>
                <div class="job-apply-row">
                    <p>Apply: <a href="mailto:support@unicornevent.com?subject=${encodeURIComponent(`Application: ${job.title}`)}">support@unicornevent.com</a></p>
                </div>
            </article>
        `).join('');

        animateCards();
    }

    /* ───────────────── RENDER ADMIN LIST ───────────────── */
    function renderAdminList() {
        const adminList = $('#admin-jobs-list');
        if (!adminList) return;

        if (!jobs.length) {
            adminList.innerHTML = '<p class="admin-empty">No listings available.</p>';
            return;
        }

        adminList.innerHTML = jobs.map(job => `
            <div class="admin-job-row">
                <div class="admin-job-row-info">
                    <div class="title">${job.title}</div>
                    <div class="meta">${typeLabel(job.type)} · ${job.location}</div>
                </div>
                <button class="admin-del-btn" data-id="${job.id}">&times;</button>
            </div>
        `).join('');
    }

    /* ───────────────── ANIMATIONS ───────────────── */
    function animateCards() {
        requestAnimationFrame(() => {
            $$('#jobs-grid .fade-in').forEach((card, index) => {
                setTimeout(() => card.classList.add('visible'), index * 60);
            });
        });
    }

    /* ───────────────── INIT (runs after DOM ready) ───────────────── */
    document.addEventListener('DOMContentLoaded', () => {

        // Set footer year
        const footerYear = $('#footer-year');
        if (footerYear) footerYear.textContent = new Date().getFullYear();

        // Load jobs from server
        fetchJobs();

        // ── Filters ──
        $$('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeFilter = btn.dataset.filter;
                renderJobs();
            });
        });

        // ── Admin Tabs ──
        $$('.admin-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                $$('.admin-tab').forEach(t => t.classList.remove('active'));
                $$('.admin-tab-panel').forEach(panel => panel.classList.remove('active'));
                tab.classList.add('active');
                $(`#tab-${tab.dataset.tab}`)?.classList.add('active');
                if (tab.dataset.tab === 'manage') renderAdminList();
            });
        });

        // ── Delete Job ──
        $('#admin-jobs-list')?.addEventListener('click', async (e) => {
            const btn = e.target.closest('.admin-del-btn');
            if (!btn) return;
            const id = Number(btn.dataset.id);
            try {
                await deleteJobFromServer(id);
                jobs = jobs.filter(job => job.id !== id);
                renderJobs();
                renderAdminList();
            } catch (err) {
                alert('Failed to delete job. Please try again.');
            }
        });

        // ── Post Job ──
        const formFields = ['job-title', 'job-location', 'job-experience', 'job-salary', 'job-desc', 'job-skills'];

        function clearForm() {
            formFields.forEach(id => { const el = $(`#${id}`); if (el) el.value = ''; });
            const dept = $('#job-dept'); if (dept) dept.value = '';
            const type = $('#job-type'); if (type) type.value = '';
            const urgent = $('#job-urgent'); if (urgent) urgent.value = 'false';
            const err = $('#post-error'); if (err) err.textContent = '';
        }

        $('#post-job-btn')?.addEventListener('click', async () => {
            const data = {
                title: $('#job-title')?.value.trim(),
                dept: $('#job-dept')?.value,
                type: $('#job-type')?.value,
                location: $('#job-location')?.value.trim(),
                experience: $('#job-experience')?.value.trim(),
                salary: $('#job-salary')?.value.trim(),
                desc: $('#job-desc')?.value.trim(),
                skills: $('#job-skills')?.value.split(',').map(s => s.trim()).filter(Boolean),
                urgent: $('#job-urgent')?.value === 'true'
            };

            const postError = $('#post-error');

            if (!data.title || !data.dept || !data.type || !data.location || !data.desc) {
                if (postError) postError.textContent = 'Please fill all required fields.';
                return;
            }

            try {
                const result = await postJobToServer(data);
                jobs.unshift(result.job);
                renderJobs();
                clearForm();

                const postSuccess = $('#post-success');
                if (postSuccess) {
                    postSuccess.classList.add('active');
                    setTimeout(() => postSuccess.classList.remove('active'), 3000);
                }
            } catch (err) {
                if (postError) postError.textContent = 'Failed to save job. Please try again.';
            }
        });

        $('#clear-form-btn')?.addEventListener('click', clearForm);

        // ── Secret Admin Access ──
        document.addEventListener('keydown', (e) => {
            if (e.key !== CONFIG.SECRET_KEY) return;
            const now = Date.now();
            secretKeys = secretKeys.filter(t => now - t < CONFIG.SECRET_WINDOW_MS);
            secretKeys.push(now);
            if (secretKeys.length >= CONFIG.SECRET_PRESSES) {
                secretKeys = [];
                const triggerBtn = $('#admin-trigger-btn');
                if (triggerBtn) {
                    triggerBtn.style.display = 'block';
                    setTimeout(() => { triggerBtn.style.display = 'none'; }, 8000);
                }
            }
        });

        // ── Modal ──
        function resetModal() {
            const passwordStep = $('#admin-step-password');
            const jobsStep = $('#admin-step-jobs');
            const passwordInput = $('#admin-password-input');
            const passwordError = $('#admin-password-error');
            if (passwordStep) passwordStep.style.display = 'block';
            if (jobsStep) jobsStep.style.display = 'none';
            if (passwordInput) passwordInput.value = '';
            if (passwordError) passwordError.textContent = '';
        }

        function openModal() {
            $('#admin-overlay')?.classList.add('active');
            resetModal();
            setTimeout(() => $('#admin-password-input')?.focus(), 100);
        }

        function closeModal() {
            $('#admin-overlay')?.classList.remove('active');
            resetModal();
        }

        function verifyPassword() {
            const input = $('#admin-password-input');
            const error = $('#admin-password-error');
            if (input?.value.trim() === CONFIG.ADMIN_PASSWORD) {
                $('#admin-step-password').style.display = 'none';
                $('#admin-step-jobs').style.display = 'block';
            } else {
                if (error) error.textContent = 'Incorrect password';
                if (input) { input.value = ''; input.focus(); }
            }
        }

        $('#admin-trigger-btn')?.addEventListener('click', openModal);
        $('#admin-close')?.addEventListener('click', closeModal);
        $('#admin-overlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'admin-overlay') closeModal();
        });
        $('#admin-password-btn')?.addEventListener('click', verifyPassword);
        $('#admin-password-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') verifyPassword();
        });

        // ── Intersection Observer ──
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.1 });

        $$('.fade-in').forEach(el => observer.observe(el));
    });

})();