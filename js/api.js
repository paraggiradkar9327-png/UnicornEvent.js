/**
 * UNICORN EVENTS — Shared Backend API (js/api.js)
 * ──────────────────────────────────────────────────────────────
 * Talks directly to Supabase's REST API using plain fetch() calls —
 * no SDK, no Node, no build step. Data is now shared across every
 * device/browser, since it lives in your Supabase project instead
 * of localStorage.
 *
 * Your site stays 100% static HTML/CSS/JS and can be hosted on
 * cPanel exactly as before — cPanel just serves the files, and the
 * JS in the browser talks to Supabase over the internet.
 */
(function (global) {
  'use strict';

  // ── YOUR SUPABASE PROJECT ──────────────────────────────────
  const SUPABASE_URL = 'https://qtaoefwicnpupcllkysy.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0YW9lZndpY25wdXBjbGxreXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwODYzMjgsImV4cCI6MjA5NzY2MjMyOH0.MWhZueAFMCuTLSasMLLBxNIXY7LQxYDuWScfM_aO_0c';

  const REST_URL = `${SUPABASE_URL}/rest/v1`;
  const HEADERS = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  };

  /** Generic helper for calling the Supabase REST (PostgREST) API. */
  async function sbFetch(path, options = {}) {
    const res = await fetch(`${REST_URL}${path}`, {
      ...options,
      headers: { ...HEADERS, ...(options.headers || {}) }
    });
    if (!res.ok) {
      let detail = '';
      try { detail = JSON.stringify(await res.json()); } catch (_) { }
      const err = new Error(`Supabase error (${res.status}): ${detail || res.statusText}`);
      err.status = res.status;
      throw err;
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  /* ── JOBS API ─────────────────────────────────────────────── */

  async function getJobs() {
    const rows = await sbFetch('/jobs?select=*&order=posted_at.desc,id.desc');
    return (rows || []).map(rowToJob);
  }

  function rowToJob(row) {
    return {
      id: row.id,
      title: row.title,
      dept: row.dept,
      type: row.type,
      location: row.location,
      experience: row.experience,
      salary: row.salary,
      desc: row.description,
      skills: row.skills || [],
      urgent: row.urgent,
      postedAt: row.posted_at
    };
  }

  async function createJob(data) {
    const required = ['title', 'dept', 'type', 'location', 'desc'];
    const missing = required.filter(k => !data || !String(data[k] || '').trim());
    if (missing.length) {
      const err = new Error('Missing required fields: ' + missing.join(', '));
      err.status = 400;
      throw err;
    }
    const newRow = {
      id: Date.now(),
      title: data.title,
      dept: data.dept,
      type: data.type,
      location: data.location,
      experience: data.experience || '',
      salary: data.salary || '',
      description: data.desc,
      skills: Array.isArray(data.skills) ? data.skills : [],
      urgent: !!data.urgent,
      posted_at: new Date().toISOString().slice(0, 10)
    };
    const rows = await sbFetch('/jobs', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(newRow)
    });
    return { success: true, job: rowToJob(rows[0]) };
  }

  async function deleteJob(id) {
    const numId = Number(id);
    if (!numId) {
      const err = new Error('Missing id');
      err.status = 400;
      throw err;
    }
    await sbFetch(`/jobs?id=eq.${numId}`, { method: 'DELETE' });
    return { success: true };
  }

  /* ── HERO VIDEO CONFIG API ───────────────────────────────────
     Stored as a single shared row (id = 1) in `video_config`.    */

  async function getVideoConfig() {
    const rows = await sbFetch('/video_config?id=eq.1&select=*');
    const row = rows && rows[0];
    if (!row) return {};
    if (row.type === 'youtube') return { type: 'youtube', videoId: row.video_id };
    if (row.type === 'file') return { type: 'file', src: row.src };
    return {};
  }

  async function setYoutubeVideo(videoId) {
    if (!videoId) {
      const err = new Error('Missing videoId');
      err.status = 400;
      throw err;
    }
    await sbFetch('/video_config?id=eq.1', {
      method: 'PATCH',
      body: JSON.stringify({ type: 'youtube', video_id: videoId, src: null })
    });
    return { success: true };
  }

  /**
   * NOTE on video uploads: Supabase's free Storage tier could host real
   * video files, but that requires a Storage bucket + extra setup beyond
   * this REST-only integration. For now, "Upload Video" reads the file
   * into a base64 data URL and saves the STRING into `video_config.src`.
   * This works for short clips but is not ideal for large videos
   * (the database row will get big). If you need real video file
   * hosting, ask and we can wire up a Supabase Storage bucket next.
   */
  async function uploadVideoFile(file) {
    if (!file) {
      const err = new Error('No file uploaded');
      err.status = 400;
      throw err;
    }
    const MAX_BYTES = 15 * 1024 * 1024; // keep DB rows reasonable
    if (file.size > MAX_BYTES) {
      const err = new Error('File too large (max 15MB for database storage). Use a smaller clip or ask about Supabase Storage for larger files.');
      err.status = 413;
      throw err;
    }
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsDataURL(file);
    });

    await sbFetch('/video_config?id=eq.1', {
      method: 'PATCH',
      body: JSON.stringify({ type: 'file', src: dataUrl, video_id: null })
    });
    return { success: true, src: dataUrl };
  }

  /* ── CONTACT / WEDDING FORM API ──────────────────────────────
     Submissions are saved as real rows in Supabase, visible to you
     in the Supabase dashboard (Table Editor) from any device.       */

  async function sendContact(data) {
    if (!data || !String(data.first_name || '').trim() || !String(data.email || '').trim() || !String(data.message || '').trim()) {
      const err = new Error('Missing required fields');
      err.status = 400;
      throw err;
    }
    await sbFetch('/contact_leads', {
      method: 'POST',
      body: JSON.stringify({
        first_name: data.first_name,
        last_name: data.last_name || '',
        email: data.email,
        phone: data.phone || '',
        service: data.service || '',
        event_date: data.event_date || '',
        event_location: data.event_location || '',
        message: data.message
      })
    });
    return { success: true };
  }

  async function sendWedding(data) {
    if (!data || !String(data.name || '').trim() || !String(data.email || '').trim() || !String(data.wedding_date || '').trim()) {
      const err = new Error('Missing required fields');
      err.status = 400;
      throw err;
    }
    await sbFetch('/wedding_leads', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        mobile: data.mobile || '',
        email: data.email,
        city: data.city || '',
        bride_name: data.bride_name || '',
        groom_name: data.groom_name || '',
        wedding_date: data.wedding_date,
        venue_location: data.venue_location || '',
        guests: data.guests || '',
        budget: data.budget || '',
        venue_type: data.venue_type || '',
        theme: data.theme || '',
        special: data.special || ''
      })
    });
    return { success: true };
  }

  /** Lets an admin page (if you ever build one) pull all leads. */
  async function getLeads() {
    const [contact, wedding] = await Promise.all([
      sbFetch('/contact_leads?select=*&order=submitted_at.desc'),
      sbFetch('/wedding_leads?select=*&order=submitted_at.desc')
    ]);
    return { contact: contact || [], wedding: wedding || [] };
  }

  /* ── PORTFOLIO API ────────────────────────────────────────────
     Portfolio images are real files on disk, not data — no need
     for a shared database. This just reads the static manifest. */

  async function getPortfolio() {
    try {
      const base = (document.querySelector('meta[name="base-path"]')?.content) || './';
      const res = await fetch(`${base}assets/portfolio-manifest.json`);
      if (!res.ok) throw new Error('Manifest not found');
      return await res.json();
    } catch (err) {
      console.warn('[UnicornAPI] Could not load portfolio manifest:', err);
      return [];
    }
  }

  /* ── PUBLIC API ───────────────────────────────────────────── */
  global.UnicornAPI = {
    getJobs,
    createJob,
    deleteJob,
    getVideoConfig,
    setYoutubeVideo,
    uploadVideoFile,
    sendContact,
    sendWedding,
    getLeads,
    getPortfolio
  };

})(window);
