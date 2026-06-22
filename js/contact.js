document.addEventListener('components:loaded', function () {
    const form = document.getElementById('contact-form');
    const success = document.getElementById('ct-success');
    const submitBtn = form ? form.querySelector('.ct-submit-btn') : null;
    if (!form || !success) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // ── Validate required fields ──
        const required = form.querySelectorAll('[required]');
        let valid = true;
        required.forEach(field => {
            field.classList.remove('ct-field-error');
            if (!field.value.trim() || (field.type === 'checkbox' && !field.checked)) {
                field.classList.add('ct-field-error');
                valid = false;
            }
        });
        if (!valid) return;

        // ── Disable button & show sending state ──
        submitBtn.disabled = true;
        submitBtn.querySelector('.ct-submit-text').textContent = 'Sending…';

        // ── Gather form data ──
        const data = {
            first_name: form.querySelector('[name="first_name"]').value.trim(),
            last_name: form.querySelector('[name="last_name"]').value.trim(),
            email: form.querySelector('[name="email"]').value.trim(),
            phone: form.querySelector('[name="phone"]') ? form.querySelector('[name="phone"]').value.trim() : '',
            service: form.querySelector('[name="service"]') ? form.querySelector('[name="service"]').value : '',
            event_date: form.querySelector('[name="event_date"]') ? form.querySelector('[name="event_date"]').value.trim() : '',
            event_location: form.querySelector('[name="event_location"]') ? form.querySelector('[name="event_location"]').value.trim() : '',
            message: form.querySelector('[name="message"]') ? form.querySelector('[name="message"]').value.trim() : ''
        };

        // ── Save via local API (replaces send-contact.php) ──
        try {
            await window.UnicornAPI.sendContact(data);
            const res = { ok: true };

            if (res.ok) {

                // Hide form fields
                form.querySelectorAll('.ct-field, .ct-form-row, .ct-submit-btn').forEach(el => {
                    el.style.display = 'none';
                });

                // Show success message
                success.style.display = 'flex';

                // Scroll to success message
                success.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        } catch (err) {
            alert('Sorry, something went wrong: ' + (err.message || 'Please try again.'));
            submitBtn.disabled = false;
            submitBtn.querySelector('.ct-submit-text').textContent = 'Submit Enquiry';
        }
    });
});