(function () {
  'use strict';

  const ADMIN_PASSWORD = 'unicorn2026';
  const SECRET_KEY = 'u';
  const SECRET_PRESSES = 3;
  const SECRET_WINDOW_MS = 1500;

  let keyPressLog = [];

  // ─── SERVER API HELPERS ───────────────────────────────────

  async function loadConfigFromServer() {
    try {
      return await window.UnicornAPI.getVideoConfig();
    } catch (err) {
      console.warn('[Admin] Could not load video config:', err);
      return {};
    }
  }

  async function saveYtIdToServer(videoId) {
    await window.UnicornAPI.setYoutubeVideo(videoId);
  }

  async function uploadVideoToServer(file) {
    return await window.UnicornAPI.uploadVideoFile(file);
  }

  // ─── YOUTUBE HELPERS ──────────────────────────────────────
  function extractYtId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
      /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  }

  function applyYouTubeToHero(videoId) {
    const heroVideo = document.getElementById('hero-video');
    const ytWrap = document.getElementById('hero-yt-wrap');
    const ytIframe = document.getElementById('hero-yt-iframe');
    if (!ytWrap || !ytIframe) return;

    ytIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1`;

    heroVideo.style.display = 'none';
    ytWrap.style.display = 'block';

    ytWrap.onclick = () => {
      if (ytWrap.requestFullscreen) ytWrap.requestFullscreen();
      else if (ytWrap.webkitRequestFullscreen) ytWrap.webkitRequestFullscreen();
    };
  }

  // ─── APPLY FILE VIDEO TO HERO ────────────────────────────
  function applyVideoToHero(url) {
    const heroVideo = document.getElementById('hero-video');
    const ytWrap = document.getElementById('hero-yt-wrap');
    if (!heroVideo) return;

    if (ytWrap) ytWrap.style.display = 'none';
    heroVideo.style.display = '';

    const source = heroVideo.querySelector('source');
    if (source) source.src = url;
    else {
      const s = document.createElement('source');
      s.src = url; s.type = 'video/mp4';
      heroVideo.appendChild(s);
    }
    heroVideo.load();
    heroVideo.play().catch(() => { });
  }

  // ─── FULLSCREEN ON HERO CLICK ─────────────────────────────
  function initVideoFullscreen() {
    const heroSection = document.getElementById('home');
    const heroVideo = document.getElementById('hero-video');
    const ytWrap = document.getElementById('hero-yt-wrap');
    const heroContent = document.querySelector('.hero-content');
    const heroOverlay = document.querySelector('.hero-overlay');
    const scrollHint = document.querySelector('.scroll-hint');

    if (!heroSection) return;

    heroSection.addEventListener('click', (e) => {
      if (e.target.closest('a, button')) return;

      if (heroContent) heroContent.classList.add('hero-hidden');
      if (heroOverlay) heroOverlay.classList.add('hero-hidden');
      if (scrollHint) scrollHint.classList.add('hero-hidden');

      const target = ytWrap && ytWrap.style.display !== 'none' ? ytWrap : heroVideo;
      if (!target) return;

      if (target.requestFullscreen) target.requestFullscreen();
      else if (target.webkitRequestFullscreen) target.webkitRequestFullscreen();
      else if (target.mozRequestFullScreen) target.mozRequestFullScreen();
    });

    document.addEventListener('fullscreenchange', restoreHero);
    document.addEventListener('webkitfullscreenchange', restoreHero);
    document.addEventListener('mozfullscreenchange', restoreHero);

    function restoreHero() {
      const isFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement
      );
      if (!isFullscreen) {
        if (heroContent) heroContent.classList.remove('hero-hidden');
        if (heroOverlay) heroOverlay.classList.remove('hero-hidden');
        if (scrollHint) scrollHint.classList.remove('hero-hidden');
      }
    }
  }

  // ─── LOAD SAVED STATE ON PAGE LOAD (from server) ─────────
  async function loadSavedVideo() {
    const config = await loadConfigFromServer();

    if (config.type === 'youtube' && config.videoId) {
      applyYouTubeToHero(config.videoId);
    } else if (config.type === 'file' && config.src) {
      applyVideoToHero(config.src);
    }
  }

  // ─── SECRET KEY TRIGGER ───────────────────────────────────
  function initSecretTrigger() {
    document.addEventListener('keydown', (e) => {
      if (e.key !== SECRET_KEY) return;
      const now = Date.now();
      keyPressLog = keyPressLog.filter(t => now - t < SECRET_WINDOW_MS);
      keyPressLog.push(now);
      if (keyPressLog.length >= SECRET_PRESSES) {
        keyPressLog = [];
        showAdminTriggerBtn();
      }
    });
  }

  function showAdminTriggerBtn() {
    const btn = document.getElementById('admin-trigger-btn');
    if (!btn) return;
    btn.style.display = 'block';
    setTimeout(() => { if (btn.style.display !== 'none') btn.style.display = 'none'; }, 8000);
  }

  // ─── MODAL ────────────────────────────────────────────────
  function openModal() {
    document.getElementById('admin-overlay').classList.add('active');
    document.getElementById('admin-trigger-btn').style.display = 'none';
    resetToPasswordStep();
    setTimeout(() => document.getElementById('admin-password-input').focus(), 100);
  }

  function closeModal() {
    document.getElementById('admin-overlay').classList.remove('active');
    resetToPasswordStep();
  }

  function resetToPasswordStep() {
    document.getElementById('admin-step-password').style.display = 'block';
    document.getElementById('admin-step-upload').style.display = 'none';
    document.getElementById('admin-password-input').value = '';
    document.getElementById('admin-password-error').textContent = '';
  }

  // ─── PASSWORD ─────────────────────────────────────────────
  function handlePasswordSubmit() {
    const input = document.getElementById('admin-password-input');
    const error = document.getElementById('admin-password-error');
    if (input.value.trim() === ADMIN_PASSWORD) {
      error.textContent = '';
      document.getElementById('admin-step-password').style.display = 'none';
      document.getElementById('admin-step-upload').style.display = 'block';
      switchAdminTab('file');
    } else {
      error.textContent = 'Incorrect password. Please try again.';
      input.value = ''; input.focus();
    }
  }

  // ─── TABS ─────────────────────────────────────────────────
  window.switchAdminTab = function (tab) {
    document.getElementById('tab-panel-file').style.display = tab === 'file' ? 'block' : 'none';
    document.getElementById('tab-panel-yt').style.display = tab === 'yt' ? 'block' : 'none';
    document.getElementById('tab-file').classList.toggle('active', tab === 'file');
    document.getElementById('tab-yt').classList.toggle('active', tab === 'yt');
  };

  // ─── YOUTUBE SUBMIT (now saves to server) ─────────────────
  async function handleYtSubmit() {
    const input = document.getElementById('yt-url-input');
    const error = document.getElementById('yt-url-error');
    const videoId = extractYtId(input.value.trim());

    if (!videoId) {
      error.textContent = 'Please enter a valid YouTube URL.';
      return;
    }
    error.textContent = '';

    try {
      await saveYtIdToServer(videoId);   // ← saves to server (shared by all devices)
      applyYouTubeToHero(videoId);

      const btn = document.getElementById('yt-submit-btn');
      btn.textContent = '✓ Video Set!';
      setTimeout(() => {
        btn.textContent = 'Set YouTube Video';
        closeModal();
      }, 1800);
    } catch (err) {
      error.textContent = 'Failed to save. Please try again.';
    }
  }

  // ─── FILE UPLOAD (now saves to server) ────────────────────
  function handleFileSelected(file) {
    if (!file) return;
    document.getElementById('upload-filename').textContent = file.name;
    document.getElementById('upload-submit-btn').disabled = false;
  }

  async function handleUploadSubmit() {
    const fileInput = document.getElementById('video-file-input');
    const file = fileInput.files[0];
    if (!file) return;

    const btn = document.getElementById('upload-submit-btn');
    const progress = document.getElementById('upload-progress');
    const bar = document.getElementById('upload-progress-bar');
    const success = document.getElementById('upload-success');

    btn.disabled = true; btn.textContent = 'Uploading...';
    progress.classList.add('active');

    let pct = 0;
    const ticker = setInterval(() => { pct = Math.min(pct + 8, 85); bar.style.width = pct + '%'; }, 80);

    try {
      const data = await uploadVideoToServer(file);  // ← uploads to server
      clearInterval(ticker); bar.style.width = '100%';

      applyVideoToHero(data.src);  // server returns the public URL

      setTimeout(() => {
        progress.classList.remove('active'); bar.style.width = '0%';
        success.classList.add('active'); btn.style.display = 'none';
        setTimeout(() => {
          success.classList.remove('active'); closeModal();
          btn.style.display = ''; btn.disabled = false;
          btn.textContent = 'Upload Video'; fileInput.value = '';
          document.getElementById('upload-filename').textContent = '';
        }, 2200);
      }, 400);
    } catch (err) {
      clearInterval(ticker); progress.classList.remove('active'); bar.style.width = '0%';
      btn.disabled = false; btn.textContent = 'Upload Video';
      alert('Failed to upload video. Please try again.');
    }
  }

  // ─── DRAG & DROP ──────────────────────────────────────────
  function initDragDrop() {
    const zone = document.getElementById('upload-drop-zone');
    if (!zone) return;
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault(); zone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('video/')) {
        document.getElementById('video-file-input').files = e.dataTransfer.files;
        handleFileSelected(file);
      }
    });
  }

  // ─── WIRE EVENTS ──────────────────────────────────────────
  function initEvents() {
    document.getElementById('admin-trigger-btn').addEventListener('click', openModal);
    document.getElementById('admin-close').addEventListener('click', closeModal);
    document.getElementById('admin-overlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('admin-overlay')) closeModal();
    });
    document.getElementById('admin-password-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handlePasswordSubmit();
    });
    document.getElementById('admin-password-btn').addEventListener('click', handlePasswordSubmit);
    document.getElementById('video-file-input').addEventListener('change', (e) => handleFileSelected(e.target.files[0]));
    document.getElementById('upload-submit-btn').addEventListener('click', handleUploadSubmit);
    document.getElementById('yt-submit-btn').addEventListener('click', handleYtSubmit);
    document.getElementById('yt-url-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleYtSubmit();
    });
    initDragDrop();
  }

  // ─── WATCH FULL VIDEO CURSOR ─────────────────────────────
  function initWatchCursor() {
    const cursor = document.getElementById('watch-cursor');
    const heroSection = document.getElementById('home');
    const heroVideo = document.getElementById('hero-video');
    if (!cursor || !heroSection) return;

    let rafId = null;
    let mouseX = 0, mouseY = 0;

    function moveCursor(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          cursor.style.left = mouseX + 'px';
          cursor.style.top = mouseY + 'px';
          rafId = null;
        });
      }
    }

    heroSection.addEventListener('mouseenter', () => cursor.classList.add('visible'));
    heroSection.addEventListener('mouseleave', () => cursor.classList.remove('visible'));
    heroSection.addEventListener('mousemove', moveCursor);

    if (heroVideo) {
      heroVideo.addEventListener('click', () => {
        if (heroVideo.requestFullscreen) heroVideo.requestFullscreen();
        else if (heroVideo.webkitRequestFullscreen) heroVideo.webkitRequestFullscreen();
      });
    }
  }

  // ─── INIT ─────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    loadSavedVideo();       // ← now fetches from server, works on all devices
    initSecretTrigger();
    initEvents();
    initVideoFullscreen();
    initWatchCursor();
  });

})();