
// ════════════════════════════════════════════════════════════
// UNICORN EVENTS — Supabase Edge Function
// Sends an email via Resend whenever a new row is inserted into
// `contact_leads` or `wedding_leads`, triggered by a Database
// Webhook (configured in the Supabase Dashboard, see README).
//
// This runs on Supabase's Deno runtime — not Node.js, and not
// something you host yourself. Deploy once with the Supabase CLI.
// ════════════════════════════════════════════════════════════

// @ts-ignore - Deno global is provided by the Supabase Edge runtime
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const NOTIFY_EMAIL = Deno.env.get('NOTIFY_EMAIL') || 'support@unicornevent.com';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'Unicorn Events <onboarding@resend.dev>';

function row(label, value) {
    const v = (value === null || value === undefined || value === '') ? '—' : String(value);
    return `<tr>
    <td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;width:160px"><b>${label}</b></td>
    <td style="padding:8px;border:1px solid #ddd">${escapeHtml(v)}</td>
  </tr>`;
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildContactEmail(record) {
    const html = `
    <h2 style="color:#6a0dad">New Contact Enquiry</h2>
    <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif">
      ${row('Name', `${record.first_name ?? ''} ${record.last_name ?? ''}`.trim())}
      ${row('Email', record.email)}
      ${row('Phone', record.phone)}
      ${row('Service', record.service)}
      ${row('Event Date', record.event_date)}
      ${row('Event Location', record.event_location)}
      ${row('Message', record.message)}
    </table>`;
    return { subject: `New Contact Enquiry from ${record.first_name ?? ''} ${record.last_name ?? ''}`.trim(), html };
}

function buildWeddingEmail(record) {
    const html = `
    <h2 style="color:#6a0dad">New Wedding Enquiry</h2>
    <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif">
      ${row('Name', record.name)}
      ${row('Mobile', record.mobile)}
      ${row('Email', record.email)}
      ${row('City', record.city)}
      ${row('Bride', record.bride_name)}
      ${row('Groom', record.groom_name)}
      ${row('Wedding Date', record.wedding_date)}
      ${row('Venue Location', record.venue_location)}
      ${row('Guests', record.guests)}
      ${row('Budget', record.budget ? `₹${record.budget}` : '—')}
      ${row('Venue Type', record.venue_type)}
      ${row('Types of Events', record.theme)}
      ${row('Special Requirements', record.special)}
    </table>`;
    return { subject: `New Wedding Enquiry from ${record.name ?? ''}`, html };
}

// @ts-ignore - Deno.serve is provided by the Supabase Edge runtime
Deno.serve(async (req) => {
    try {
        if (!RESEND_API_KEY) {
            return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500 });
        }

        const payload = await req.json();
        // Supabase Database Webhooks send: { type, table, record, old_record, schema }
        const table = payload.table;
        const record = payload.record;

        let emailContent;
        if (table === 'contact_leads') {
            emailContent = buildContactEmail(record);
        } else if (table === 'wedding_leads') {
            emailContent = buildWeddingEmail(record);
        } else {
            return new Response(JSON.stringify({ error: `Unhandled table: ${table}` }), { status: 400 });
        }

        const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: [NOTIFY_EMAIL],
                subject: emailContent.subject,
                html: emailContent.html
            })
        });

        if (!resendRes.ok) {
            const detail = await resendRes.text();
            return new Response(JSON.stringify({ error: 'Resend failed', detail }), { status: 502 });
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
    }
});