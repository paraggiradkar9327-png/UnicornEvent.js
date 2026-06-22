/* ── Services Dropdown (kept for compatibility if referenced elsewhere) ── */
/* Services section removed from form — no services dropdown logic needed */

/* ── Types of Events Dropdown ── */
const eventsTrigger = document.getElementById('eventsTrigger');
const eventsDropdown = document.getElementById('eventsDropdown');
const eventsChevron = document.getElementById('eventsChevron');
const eventsTriggerText = document.getElementById('eventsTriggerText');
const eventsCheckboxes = eventsDropdown.querySelectorAll('input[type="checkbox"]');
const eventOtherCheckbox = document.getElementById('eventOtherCheckbox');
const eventOtherField = document.getElementById('eventOtherField');

function updateEventsTriggerText() {
    const selected = [...eventsCheckboxes].filter(c => c.checked).map(c => c.value);
    if (selected.length === 0) {
        eventsTriggerText.textContent = 'Choose event types…';
        eventsTriggerText.classList.remove('has-value');
    } else {
        eventsTriggerText.textContent = selected.join(', ');
        eventsTriggerText.classList.add('has-value');
    }
}

eventsTrigger.addEventListener('click', () => {
    const open = eventsDropdown.classList.toggle('open');
    eventsTrigger.classList.toggle('open', open);
    eventsChevron.classList.toggle('open', open);
});

eventsTrigger.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        eventsTrigger.click();
    }
});

eventsCheckboxes.forEach(cb => cb.addEventListener('change', updateEventsTriggerText));

/* Show/hide "Other" text field */
eventOtherCheckbox.addEventListener('change', () => {
    if (eventOtherCheckbox.checked) {
        eventOtherField.style.display = 'block';
        // Close the dropdown
        eventsDropdown.classList.remove('open');
        eventsTrigger.classList.remove('open');
        eventsChevron.classList.remove('open');
        // Focus the text field after dropdown closes
        setTimeout(() => document.getElementById('eventOtherText').focus(), 50);
    } else {
        eventOtherField.style.display = 'none';
        document.getElementById('eventOtherText').value = '';
    }
    updateEventsTriggerText();
});

document.addEventListener('click', e => {
    if (!document.getElementById('eventsWrapper').contains(e.target)) {
        eventsDropdown.classList.remove('open');
        eventsTrigger.classList.remove('open');
        eventsChevron.classList.remove('open');
    }
});

/* ── Wedding Form Submission ── */
document.getElementById('weddingForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const form = this;
    let valid = true;

    /* Validate required fields */
    form.querySelectorAll('[required]').forEach(field => {
        const parent = field.closest('.field');
        if (!field.value.trim()) {
            if (parent) parent.classList.add('error');
            valid = false;
        } else {
            if (parent) parent.classList.remove('error');
        }
    });

    /* Validate radio */
    const venueType = form.querySelector('input[name="venue_type"]:checked');
    if (!venueType) {
        valid = false;
        const rf = form.querySelector('input[name="venue_type"]').closest('.field');
        if (rf) rf.classList.add('error');
    }

    if (!valid) {
        form.querySelector('.error input, .error textarea, .error .services-trigger')
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    /* Build event types value */
    const selectedEvents = [...eventsCheckboxes].filter(c => c.checked).map(c => c.value);
    let eventTypesValue = selectedEvents.join(', ') || 'None selected';
    if (eventOtherCheckbox.checked) {
        const otherText = document.getElementById('eventOtherText').value.trim();
        if (otherText) {
            eventTypesValue = eventTypesValue.replace('Other', `Other: ${otherText}`);
        }
    }

    /* Gather form data */
    const data = {
        name: document.getElementById('name').value.trim(),
        mobile: document.getElementById('mobile').value.trim(),
        email: document.getElementById('email').value.trim(),
        city: document.getElementById('city').value.trim(),
        bride_name: document.getElementById('bride').value.trim(),
        groom_name: document.getElementById('groom').value.trim(),
        wedding_date: document.getElementById('wdate').value,
        venue_location: document.getElementById('venue').value.trim(),
        guests: document.getElementById('guests').value.trim(),
        services: 'N/A',
        budget: document.getElementById('budget').value.trim(),
        venue_type: venueType ? venueType.value : '',
        theme: eventTypesValue,
        special: document.getElementById('special').value.trim() || '—',
    };

    /* Disable button & show sending state */
    const btn = form.querySelector('.submit-btn');
    btn.disabled = true;
    btn.querySelector('.submit-btn-text').textContent = 'Sending…';

    /* Save via local API (replaces send-wedding.php) */
    try {
        await window.UnicornAPI.sendWedding(data);

        form.style.display = 'none';
        const success = document.getElementById('formSuccess');
        success.style.display = 'flex';
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
        btn.disabled = false;
        btn.querySelector('.submit-btn-text').textContent = 'Submit Enquiry';
        const errEl = document.getElementById('sendError');
        if (errEl) errEl.style.display = 'block';
        console.error('Error saving enquiry:', err);
    }
});

/* Remove error highlight on input */
document.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('input', () => {
        const parent = el.closest('.field');
        if (parent) parent.classList.remove('error');
    });
});