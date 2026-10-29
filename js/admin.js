(function () {
  "use strict";

  /*
   * Homepage hero video (display only).
   * The YouTube link is managed from the Admin Dashboard
   * (adminDashboard.html -> "Hero Video").
   */

  // ─── SERVER HELPER ────────────────────────────────────────
  async function loadConfigFromServer() {
    try {
      return await window.UnicornAPI.getVideoConfig();
    } catch (err) {
      console.warn("[Hero] Could not load video config:", err);
      return {};
    }
  }

  // ─── APPLY YOUTUBE VIDEO TO HERO ──────────────────────────
  function applyYouTubeToHero(videoId) {
    const heroVideo = document.getElementById("hero-video");
    const ytWrap = document.getElementById("hero-yt-wrap");
    const ytIframe = document.getElementById("hero-yt-iframe");
    if (!ytWrap || !ytIframe) return;

    ytIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1`;

    if (heroVideo) heroVideo.style.display = "none";
    ytWrap.style.display = "block";

    ytWrap.onclick = () => {
      if (ytWrap.requestFullscreen) ytWrap.requestFullscreen();
      else if (ytWrap.webkitRequestFullscreen) ytWrap.webkitRequestFullscreen();
    };
  }

  // ─── APPLY FILE VIDEO TO HERO ────────────────────────────
  function applyVideoToHero(url) {
    const heroVideo = document.getElementById("hero-video");
    const ytWrap = document.getElementById("hero-yt-wrap");
    if (!heroVideo) return;

    if (ytWrap) ytWrap.style.display = "none";
    heroVideo.style.display = "";

    const source = heroVideo.querySelector("source");
    if (source) source.src = url;
    else {
      const s = document.createElement("source");
      s.src = url;
      s.type = "video/mp4";
      heroVideo.appendChild(s);
    }
    heroVideo.load();
    heroVideo.play().catch(() => {});
  }

  // ─── FULLSCREEN ON HERO CLICK ─────────────────────────────
  function initVideoFullscreen() {
    const heroSection = document.getElementById("home");
    const heroVideo = document.getElementById("hero-video");
    const ytWrap = document.getElementById("hero-yt-wrap");
    const heroContent = document.querySelector(".hero-content");
    const heroOverlay = document.querySelector(".hero-overlay");
    const scrollHint = document.querySelector(".scroll-hint");

    if (!heroSection) return;

    heroSection.addEventListener("click", (e) => {
      if (e.target.closest("a, button")) return;

      if (heroContent) heroContent.classList.add("hero-hidden");
      if (heroOverlay) heroOverlay.classList.add("hero-hidden");
      if (scrollHint) scrollHint.classList.add("hero-hidden");

      const target =
        ytWrap && ytWrap.style.display !== "none" ? ytWrap : heroVideo;
      if (!target) return;

      if (target.requestFullscreen) target.requestFullscreen();
      else if (target.webkitRequestFullscreen) target.webkitRequestFullscreen();
      else if (target.mozRequestFullScreen) target.mozRequestFullScreen();
    });

    document.addEventListener("fullscreenchange", restoreHero);
    document.addEventListener("webkitfullscreenchange", restoreHero);
    document.addEventListener("mozfullscreenchange", restoreHero);

    function restoreHero() {
      const isFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement
      );
      if (!isFullscreen) {
        if (heroContent) heroContent.classList.remove("hero-hidden");
        if (heroOverlay) heroOverlay.classList.remove("hero-hidden");
        if (scrollHint) scrollHint.classList.remove("hero-hidden");
      }
    }
  }

  // ─── WATCH FULL VIDEO CURSOR ─────────────────────────────
  function initWatchCursor() {
    const cursor = document.getElementById("watch-cursor");
    const heroSection = document.getElementById("home");
    const heroVideo = document.getElementById("hero-video");
    if (!cursor || !heroSection) return;

    let rafId = null;
    let mouseX = 0,
      mouseY = 0;

    function moveCursor(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          cursor.style.left = mouseX + "px";
          cursor.style.top = mouseY + "px";
          rafId = null;
        });
      }
    }

    heroSection.addEventListener("mouseenter", () =>
      cursor.classList.add("visible"),
    );
    heroSection.addEventListener("mouseleave", () =>
      cursor.classList.remove("visible"),
    );
    heroSection.addEventListener("mousemove", moveCursor);

    if (heroVideo) {
      heroVideo.addEventListener("click", () => {
        if (heroVideo.requestFullscreen) heroVideo.requestFullscreen();
        else if (heroVideo.webkitRequestFullscreen)
          heroVideo.webkitRequestFullscreen();
      });
    }
  }

  // ─── LOAD SAVED STATE ON PAGE LOAD (from server) ─────────
  async function loadSavedVideo() {
    const config = await loadConfigFromServer();

    if (config.type === "youtube" && config.videoId) {
      applyYouTubeToHero(config.videoId);
    } else if (config.type === "file" && config.src) {
      applyVideoToHero(config.src);
    }
  }

  // ─── INIT ─────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", () => {
    loadSavedVideo();
    initVideoFullscreen();
    initWatchCursor();
  });
})();
