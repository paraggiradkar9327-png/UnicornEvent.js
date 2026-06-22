UNICORN EVENTS — Static Website
================================
Pure HTML + CSS + JS. No installation or server needed.
Just open index.html in any browser.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  index.html          Main website (all sections)
  css/
    style.css         All site styles & theme
    admin.css         Admin panel styles (hidden from visitors)
  js/
    main.js           Navbar, animations, counters, contact form
    admin.js          Admin panel logic (secret key, password, video upload)
  assets/
    hero-video.mp4    (place your video here — optional)
  README.txt          This file

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO RUN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Extract the zip/tar file anywhere on your computer.
2. Double-click index.html to open in your browser.
   Chrome or Edge recommended for best video support.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADMIN VIDEO UPLOAD (HIDDEN FEATURE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Only the admin knows how to access this — it is completely
invisible to regular website visitors.

STEP 1 — Reveal the admin button:
  Press the backtick/tilde key (`) THREE times quickly.
  A small "Admin" button will appear in the bottom-right corner
  for 8 seconds.

STEP 2 — Enter the password:
  Click the Admin button.
  A password prompt will appear.
  Default password: unicorn2026
  (Change this in js/admin.js → ADMIN_PASSWORD)

STEP 3 — Upload your video:
  After the correct password, a video upload panel appears.
  Click to select or drag & drop your MP4/WebM file.
  Click "Upload Video".

STEP 4 — Video is applied instantly:
  The hero background video updates immediately.
  The upload button hides after a successful upload.
  The video is saved in the browser (IndexedDB) and will
  persist across page refreshes automatically.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHANGING THE DEFAULT VIDEO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Open index.html and find the <video> tag in the HERO section.
Change the src to:
  Option A — A direct online URL:
    <source src="https://example.com/your-video.mp4" />
  Option B — A local file in the assets folder:
    <source src="assets/hero-video.mp4" />

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHANGING THE ADMIN PASSWORD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Open js/admin.js and change this line near the top:
  const ADMIN_PASSWORD = 'unicorn2026';

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHANGING THE SECRET KEY TRIGGER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Open js/admin.js and change these values:
  const SECRET_KEY     = '`';   // which key to press
  const SECRET_PRESSES = 3;     // how many times

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTACT FORM (optional — send real emails)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To make the form actually send emails, sign up at:
  formspree.io  (free) — add your form endpoint as the action:
  <form id="contact-form" action="https://formspree.io/f/YOUR_ID" method="POST">

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FREE VIDEO SOURCES (direct MP4 links)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  pexels.com/videos   — Download → right-click → Copy link
  pixabay.com/videos  — Download → right-click → Copy link address
  coverr.co           — Right-click video player → Copy video address
  mixkit.co           — Right-click Download → Copy link
