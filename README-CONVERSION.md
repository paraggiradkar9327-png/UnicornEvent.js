# Unicorn Events — Static Site + Supabase Backend

This project is a fully static HTML/CSS/JS site (no Node.js, no Node
modules, no PHP) that talks to **Supabase** for any data that needs to
be shared across devices — job postings, the hero video setting, and
form submissions.

## How it works

- **cPanel** (or any static host) just serves the HTML/CSS/JS files —
  exactly like any normal website. Nothing extra to install there.
- **Supabase** is a separate cloud database. The JS in the browser
  (`js/api.js`) calls Supabase's REST API directly with plain
  `fetch()` — no SDK, no build step, no server code on your side.
- Because the data lives in Supabase instead of the visitor's own
  browser, **changes made on one device now show up on every device.**

## One-time setup (you've already done the account part)

1. Open your Supabase project → **SQL Editor** → **New query**.
2. Paste in the contents of `supabase-setup.sql` (included in this
   project) → click **Run**.
   This creates 4 tables: `jobs`, `video_config`, `contact_leads`,
   `wedding_leads`, sets permissions so the site can read/write them,
   and seeds the two starter job listings.
3. That's it — `js/api.js` already has your Project URL and anon key
   wired in.

## Where things are stored

| Feature | Supabase table | Visible to |
|---|---|---|
| Careers listings | `jobs` | Everyone, on every device |
| Hero video (YouTube ID or uploaded clip) | `video_config` | Everyone, on every device |
| Contact form submissions | `contact_leads` | You, via Supabase Table Editor |
| Wedding form submissions | `wedding_leads` | You, via Supabase Table Editor |
| Portfolio images | `assets/portfolio-manifest.json` (static file) | Everyone — these are real files, not data, so no database needed |

## Viewing your form leads

Go to your Supabase project → **Table Editor** → `contact_leads` or
`wedding_leads` to see every enquiry submitted from any device,
anywhere. (If you'd like real email notifications too — e.g. an email
to your inbox every time someone submits — that's a separate small
addition we can wire in with a Supabase Edge Function or a service
like EmailJS; just ask.)

## Security notes

- The Supabase **anon key** is meant to be public/embedded in
  client-side JS — that's how Supabase is designed to work. Row
  Level Security (RLS) policies (set up by `supabase-setup.sql`)
  control exactly what that key is allowed to do (read jobs, insert
  leads, etc.) — it cannot do anything you haven't explicitly
  allowed in those policies.
- The admin password gate (`unicorn2026`) for posting/deleting jobs
  and changing the hero video is still a simple client-side check, same
  as the original project. It deters casual tampering but isn't a true
  security boundary — don't rely on it to protect anything sensitive.

## Deploying

Just upload the whole folder's contents via cPanel File Manager (or
FTP) into your `public_html` (or a subfolder). No build step, no
`npm install`, no PHP — it's plain static files that happen to talk to
Supabase over the internet for shared data.
