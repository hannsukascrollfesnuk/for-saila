/* Premium interactive apology website — Vanilla JS */

(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /** -----------------------------
   *  Loading screen
   * ----------------------------- */
  // Loading screen removed to prevent Live Server overlay issues.
  const loadingScreen = null;

  function animateLoading() {
    // Wait for fonts/images to settle a bit.
    // (No heavy logic needed—this is just a smooth transition.)
    const done = () => {
      setTimeout(() => {
        // Keep it in DOM to avoid Live Server/overlay glitches.
        loadingScreen?.classList.add("fade-out");
        // Ensure it can never block interactions.
        if (loadingScreen) {
          loadingScreen.style.pointerEvents = "none";
          loadingScreen.style.zIndex = "-1";
        }
      }, 420);
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(done).catch(done);
    } else {
      setTimeout(done, 900);
    }
  }

  /** -----------------------------
   *  Floating hearts
   * ----------------------------- */
  const floatingHearts = $("#floating-hearts");

  function spawnFloatingHearts() {
    if (!floatingHearts) return;

    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const heartGlyph = "❤";
    const count = Math.min(18, Math.max(10, Math.floor(window.innerWidth / 70)));

    for (let i = 0; i < count; i++) {
      const el = document.createElement("i");
      el.textContent = heartGlyph;
      el.style.left = Math.random() * 100 + "%";
      el.style.top = Math.random() * 100 + "%";
      el.style.opacity = (0.25 + Math.random() * 0.45).toFixed(2);

      const size = 12 + Math.random() * 16;
      el.style.fontSize = size + "px";

      const drift = (20 + Math.random() * 70).toFixed(0);
      const duration = (7 + Math.random() * 10).toFixed(1);
      el.style.animation = `floatHeart ${duration}s ease-in-out infinite`;
      el.style.setProperty("--drift", drift + "px");

      floatingHearts.appendChild(el);

      // Stagger animation with a delay.
      el.style.animationDelay = (Math.random() * 3).toFixed(2) + "s";
    }

    // Inject keyframes once
    if (!document.getElementById("floatHeartKeyframes")) {
      const style = document.createElement("style");
      style.id = "floatHeartKeyframes";
      style.textContent = `
        @keyframes floatHeart{
          0%{transform: translateY(0) translateX(0) rotate(0deg)}
          50%{transform: translateY(-80px) translateX(calc(var(--drift) * 0.55)) rotate(6deg)}
          100%{transform: translateY(-160px) translateX(calc(var(--drift) * 1)) rotate(0deg)}
        }
      `;
      document.head.appendChild(style);
    }
  }

  /** -----------------------------
   *  Background music control
   *  - No autoplay.
   * ----------------------------- */
  const bgMusic = $("#bgMusic");
  const musicToggle = $("#musicToggle");
  const musicToggleLabel = $("#musicToggleLabel");

  function setMusicState(isPlaying) {
    if (!musicToggleLabel) return;
    musicToggleLabel.textContent = isPlaying ? "Pause" : "Play";
    musicToggle?.setAttribute("aria-label", isPlaying ? "Pause background music" : "Play background music");
  }

  async function toggleMusic() {
    if (!bgMusic) return;
    // If audio file is missing/unavailable, play() will throw.
    // UI remains consistent either way.


    try {
      if (bgMusic.paused) {
        await bgMusic.play();
        setMusicState(true);
      } else {
        bgMusic.pause();
        setMusicState(false);
      }
    } catch (err) {
      // If audio fails to load, keep UI consistent.
      setMusicState(false);
    }
  }

  /** -----------------------------
   *  Smooth reveal on scroll
   * ----------------------------- */
  function setupReveal() {
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      $$(".reveal").forEach((n) => n.classList.add("is-visible"));
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            obs.unobserve(e.target);
          }
        }
      },
      { threshold: 0.15 }
    );

    $$(".reveal").forEach((n) => obs.observe(n));
  }

  /** -----------------------------
   *  Envelope open + typewriter
   * ----------------------------- */
  const envelope = $("#envelope");
  const openLetterBtn = $("#openLetterBtn");
  const letterPaper = $("#letterPaper");
  const typewriterEl = $("#typewriter");

  const apologyLetterText = [
"Hey, sayang.",
"",
"Aku tahu kamu mungkin masih kesel sama aku, dan yaaa aku tauu kenapa.",
"",
"Aku gak nulis ini buat nyari pembenaran atau bikin kamu langsung maafin aku. Aku cuma pengen jujur sama apa yang ada di kepala samaa hati aku.",
"",
"Aku sadar aku dah bikin kamu kecewa. Mungkin buat aku waktu itu kelihatannya sepele, tapi buat kamu rasanya beda. Dan aku minta maaf karena baru benar-benar nyadar setelah semuanya terjadi.",
"",
"Kalau aku boleh minta satu hal, aku cuma pengen kamu tahu kalau aku beneran nyesel. Bukan karena kita lagi berantem, tapi karena aku gak suka jadi alasan seseorang yang paling aku sayang sedih.",
"",
"Aku gak bisa ngubah apa yang udah terjadi. Tapi aku bisa belajar dari kesalahan itu dan buktiin kalau aku bisa jadi orang yang lebih baik buat kamu.",
"",
"Aku juga ngerti kalau minta maaf itu gampang, Jadi aku nggak bakal maksa kamu buat langsung baik-baik aja. Aku cuma berharap kamu bisa lihat usaha aku, bukan cuma kata-kata aku.",
"",
"Makasiii karena selama ini udah sabar sama aku. Makasii juga karena masih mau ada di hidup aku, walaupun aku sering bikin kamu capek.",
"",
"Kalau suatu hari nanti aku harus milih lagi siapa yang pengen aku perjuangin, jawabannya bakal tetap kamu.",
"",
"I love you, always.",
"",
"— Ray's ❤️"
].join("\n");


  let typing = false;
  let typeIndex = 0;
  let rafId = null;

  function startTypewriter() {
    if (!letterPaper || !typewriterEl) return;
    if (typing) return;

    typing = true;
    typeIndex = 0;
    typewriterEl.textContent = "";
    letterPaper.classList.add("is-typing");

    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const speed = reduceMotion ? 0 : 16; // ms-ish

    const render = () => {
      if (typeIndex >= apologyLetterText.length) {
        letterPaper.classList.remove("is-typing");
        return;
      }

      const step = reduceMotion ? 12 : 1; // faster for reduced motion
      for (let s = 0; s < step; s++) {
        if (typeIndex >= apologyLetterText.length) break;
        typewriterEl.textContent += apologyLetterText[typeIndex];
        typeIndex++;
      }

      rafId = window.setTimeout(() => {
        render();
      }, speed);
    };

    render();
  }

  function openEnvelopeAndLetter() {
    if (!envelope) return;

    envelope.classList.add("open");
    envelope.setAttribute("aria-label", "Open envelope");

    // Delay letter reveal to match the cinematic feel.
    setTimeout(() => {
      startTypewriter();
      // Small reveal animation cue
      letterPaper?.classList.add("reveal", "is-visible");
    }, 650);

    // Smooth scroll to the letter on smaller screens.
    if (window.innerWidth < 720) {
      envelope.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  openLetterBtn?.addEventListener("click", openEnvelopeAndLetter);
  envelope?.addEventListener("click", openEnvelopeAndLetter);

  envelope?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openEnvelopeAndLetter();
    }
  });

  /** -----------------------------
   *  Memories gallery: lightbox + swipe
   * ----------------------------- */
  const galleryTrack = $("#galleryTrack");
  const lightbox = $("#lightbox");
  const lightboxImg = $("#lightboxImg");
  const lightboxCaption = $("#lightboxCaption");
  const lightboxClose = $(".lightbox__close");

  function openLightbox(src, caption) {
    if (!lightbox) return;
    lightbox.hidden = false;
    lightboxImg.src = src;
    lightboxImg.alt = caption || "Preview";
    lightboxCaption.textContent = caption || "";
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    lightboxImg.src = "";
  }

  $$(".shot").forEach((shot) => {
    const img = $("img", shot);
    const src = shot.getAttribute("data-full") || img?.src;
    const caption = shot.querySelector("figcaption")?.textContent?.trim();

    const activate = () => openLightbox(src, caption);
    shot.addEventListener("click", activate);
    shot.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activate();
      }
    });
  });

  lightboxClose?.addEventListener("click", closeLightbox);
  lightbox?.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });

  // Simple swipe/drag support
  function setupSwipe() {
    if (!galleryTrack) return;
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let isDown = false;
    let startX = 0;
    let startScroll = 0;

    const onDown = (e) => {
      isDown = true;
      startX = (e.touches ? e.touches[0].clientX : e.clientX);
      startScroll = galleryTrack.scrollLeft;
      galleryTrack.style.scrollBehavior = "auto";
    };

    const onMove = (e) => {
      if (!isDown) return;
      const x = (e.touches ? e.touches[0].clientX : e.clientX);
      const dx = x - startX;
      galleryTrack.scrollLeft = startScroll - dx;
    };

    const onUp = () => {
      isDown = false;
      galleryTrack.style.scrollBehavior = "smooth";
    };

    galleryTrack.addEventListener("mousedown", onDown);
    galleryTrack.addEventListener("mousemove", onMove);
    galleryTrack.addEventListener("mouseup", onUp);

    galleryTrack.addEventListener("touchstart", onDown, { passive: true });
    galleryTrack.addEventListener("touchmove", onMove, { passive: true });
    galleryTrack.addEventListener("touchend", onUp);
  }

  function setupGalleryNav() {
    const btns = $$(".gallery__nav");
    if (!galleryTrack) return;
    btns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const dir = btn.getAttribute("data-dir");
        const delta = 290 * (dir === "left" ? -1 : 1);
        galleryTrack.scrollBy({ left: delta, behavior: "smooth" });
      });
    });
  }

  setupSwipe();
  setupGalleryNav();

  /** -----------------------------
   *  Flip cards
   * ----------------------------- */
  $$(".flipCard").forEach((card) => {
    const toggle = () => {
      const isFlipped = card.classList.toggle("is-flipped");
      card.setAttribute("aria-expanded", isFlipped ? "true" : "false");
    };

    card.addEventListener("click", toggle);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });
  });

  /** -----------------------------
   *  One more thing: confetti + heart explosion
   * ----------------------------- */
  const oneMoreBtn = $("#oneMoreBtn");
  const oneMoreMsg = $("#oneMoreMsg");
  const confetti = $("#confetti");
  const heartExplosion = $("#heartExplosion");

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function fireConfetti() {
    if (!confetti) return;
    confetti.innerHTML = "";

    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const count = 90;
    const colors = ["rgba(242,166,200,.95)", "rgba(255,209,229,.95)", "rgba(203,162,109,.85)", "rgba(255,255,255,.9)"];

    const centerX = window.innerWidth / 2;

    for (let i = 0; i < count; i++) {
      const el = document.createElement("i");
      const x = centerX + rand(-180, 180);
      const y = window.innerHeight * 0.52 + rand(-40, 40);
      el.style.left = x + "px";
      el.style.top = y + "px";
      el.style.background = colors[Math.floor(Math.random() * colors.length)];
      el.style.transform = `rotate(${rand(-40, 40)}deg)`;
      el.style.animationDelay = rand(0, 0.2) + "s";
      confetti.appendChild(el);
    }

    setTimeout(() => (confetti.innerHTML = ""), 1800);
  }

  function fireHeartExplosion() {
    if (!heartExplosion) return;
    heartExplosion.innerHTML = "";

    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight * 0.55;
    const count = 22;

    for (let i = 0; i < count; i++) {
      const el = document.createElement("i");
      el.textContent = "❤";
      el.style.left = centerX + rand(-120, 120) + "px";
      el.style.top = centerY + rand(-60, 60) + "px";
      el.style.animationDelay = rand(0, 0.15) + "s";
      el.style.fontSize = rand(14, 26) + "px";
      heartExplosion.appendChild(el);
    }

    setTimeout(() => (heartExplosion.innerHTML = ""), 1200);
  }

  oneMoreBtn?.addEventListener("click", () => {
    oneMoreMsg && (oneMoreMsg.hidden = false);
    fireConfetti();
    fireHeartExplosion();

    // Gentle glow effect
    document.body.animate(
      [
        { filter: "brightness(1)" },
        { filter: "brightness(1.12)" },
        { filter: "brightness(1)" }
      ],
      { duration: 700, easing: "ease-out" }
    );
  });

 

  /** -----------------------------
   *  Init
   * ----------------------------- */
  function init() {
    // animateLoading();
    spawnFloatingHearts();
    setupReveal();

    setMusicState(false);
    musicToggle?.addEventListener("click", toggleMusic);

    // Disable envelope paper until opened
    if (letterPaper) {
      letterPaper.classList.remove("is-typing");
      letterPaper.style.opacity = "1";
    }

    // If audio element has no source, show play label anyway (graceful).
    // Music will simply fail to play if file missing.
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

