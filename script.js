(() => {
  "use strict";

  const config = window.FAMILY_CONFIG;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);

  function populateText() {
    $("#hero-image").src = config.heroImage;
    $("#wife-message").innerHTML = config.wifeMessage.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
    $("#wife-more-message").innerHTML = `<p>${escapeHtml(config.wifeExtraMessage)}</p>`;
    $("#son-message").innerHTML = config.sonMessage.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
    $("#closing-message").innerHTML = config.closingMessage.map((paragraph, index) =>
      `<p${index === 0 ? ' class="closing-salutation"' : ""}>${escapeHtml(paragraph)}</p>`).join("");
    $$("[data-person='wife']").forEach((element) => { element.textContent = `My dearest ${config.wifeName},`; });
    $$("[data-person='son']").forEach((element) => { element.textContent = `My dear ${config.sonName},`; });
    $$("[data-letter-text='wife']").forEach((element) => { element.textContent = config.wifeLetter; });
    $$("[data-letter-text='son']").forEach((element) => { element.textContent = config.sonLetter; });
    document.title = `Forever, Us — For ${config.wifeName} & ${config.sonName}`;
  }

  function renderTimeline() {
    $("#timeline").innerHTML = config.milestones.map((moment, index) => `
      <article class="timeline-item reveal ${index % 2 ? "timeline-item-right" : ""}">
        <span class="timeline-node" aria-hidden="true"><span>${String(index + 1).padStart(2, "0")}</span></span>
        <div class="timeline-card">
          <figure class="timeline-image"><img src="${escapeHtml(moment.image)}" alt="${escapeHtml(moment.alt)}" loading="lazy" data-lightbox></figure>
          <div class="timeline-copy">
            <span class="timeline-date">${escapeHtml(moment.date)}</span>
            <h3>${escapeHtml(moment.title)}</h3>
            <p>${escapeHtml(moment.note)}</p>
          </div>
        </div>
      </article>`).join("");
  }

  let visiblePhotos = [];
  let activeImageIndex = 0;
  let lastFocusedElement = null;
  const lightbox = $("#lightbox");

  function photoItems() {
    const galleryImages = $$(".gallery-photo:not([hidden]) img", $("#photo-grid"));
    const images = galleryImages.concat($$("[data-lightbox]"));
    const seen = new Set();
    return images.filter((image) => {
      const source = image.currentSrc || image.src;
      if (seen.has(source)) return false;
      seen.add(source);
      return true;
    });
  }

  function showPhoto(index) {
    if (!visiblePhotos.length) return;
    activeImageIndex = (index + visiblePhotos.length) % visiblePhotos.length;
    const image = visiblePhotos[activeImageIndex];
    const photo = image.closest(".gallery-photo");
    $("#lightbox-image").src = image.src;
    $("#lightbox-image").alt = image.alt;
    const caption = photo ? photo.dataset.caption : image.alt;
    const date = photo ? photo.dataset.date : "";
    $("#lightbox-caption").innerHTML = `${escapeHtml(caption)}${date ? `<span>${escapeHtml(date)}</span>` : ""}`;
    $("#lightbox-count").textContent = `${String(activeImageIndex + 1).padStart(2, "0")} / ${String(visiblePhotos.length).padStart(2, "0")}`;
  }

  function openLightbox(image) {
    lastFocusedElement = document.activeElement;
    visiblePhotos = image.closest(".gallery-photo")
      ? $$(".gallery-photo:not([hidden]) img", $("#photo-grid"))
      : photoItems();
    let position = visiblePhotos.indexOf(image);
    if (position === -1) {
      const source = image.currentSrc || image.src;
      position = visiblePhotos.findIndex((photo) => (photo.currentSrc || photo.src) === source);
    }
    if (position === -1) return;
    showPhoto(position);
    lightbox.hidden = false;
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
    $(".lightbox-close").focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  function renderGallery(filter = "all") {
    const photos = config.photos.filter((photo) => filter === "all" || photo.category === filter);
    $("#photo-grid").innerHTML = photos.map((photo) => `
      <figure class="gallery-photo ${escapeHtml(photo.shape)}" data-caption="${escapeHtml(photo.caption)}" data-date="${escapeHtml(photo.date)}">
        <button class="gallery-photo-button" type="button" aria-label="Open photo: ${escapeHtml(photo.caption)}">
          <img src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.alt)}" loading="lazy">
          <span class="photo-hover"><span>View this memory</span><span aria-hidden="true">↗</span></span>
        </button>
        <figcaption><span>${escapeHtml(photo.caption)}</span><span>${escapeHtml(photo.date)}</span></figcaption>
      </figure>`).join("");
    $$(".gallery-photo-button", $("#photo-grid")).forEach((button) => {
      button.addEventListener("click", () => openLightbox($("img", button)));
    });
  }

  function setupLightbox() {
    $$(".lightbox-close, .lightbox-prev, .lightbox-next").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.classList.contains("lightbox-close")) closeLightbox();
        else showPhoto(activeImageIndex + (button.classList.contains("lightbox-next") ? 1 : -1));
      });
    });
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", (event) => {
      if (lightbox.hidden) return;
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowRight") showPhoto(activeImageIndex + 1);
      if (event.key === "ArrowLeft") showPhoto(activeImageIndex - 1);
      if (event.key === "Tab") {
        const controls = $$(".lightbox-close, .lightbox-arrow", lightbox);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
    $$("[data-lightbox]").forEach((image) => {
      image.tabIndex = 0;
      image.setAttribute("role", "button");
      image.setAttribute("aria-label", `View larger image: ${image.alt}`);
      image.addEventListener("click", () => openLightbox(image));
      image.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openLightbox(image);
        }
      });
    });
  }

  function setupFilters() {
    $$(".filter-button").forEach((button) => {
      button.addEventListener("click", () => {
        $$(".filter-button").forEach((item) => {
          const active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });
        renderGallery(button.dataset.filter);
      });
    });
  }

  function setupReveal() {
    const targets = $$(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      targets.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    targets.forEach((element) => observer.observe(element));
  }

  function setupCounter() {
    const output = $("#family-days");
    const hint = $("#counter-hint");
    if (!config.specialDate || !/^\d{4}-\d{2}-\d{2}$/.test(config.specialDate)) {
      output.textContent = "∞";
      hint.textContent = "Add your special date in config.js to see the days.";
      return;
    }
    const start = new Date(`${config.specialDate}T00:00:00`);
    if (Number.isNaN(start.getTime()) || start > new Date()) {
      output.textContent = "∞";
      hint.textContent = "Choose a past date in config.js to start counting.";
      return;
    }
    const update = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      output.textContent = Math.floor((today - start) / 86400000).toLocaleString();
    };
    update();
    window.setInterval(update, 60000);
  }

  function setupExpandableMessage() {
    const button = $("#wife-more");
    const panel = $("#wife-more-message");
    button.addEventListener("click", () => {
      const opening = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(opening));
      panel.hidden = !opening;
      button.querySelector(".text-button-icon").textContent = opening ? "−" : "＋";
      if (opening) panel.classList.add("message-open");
    });
  }

  function setupLetters() {
    $$(".envelope-button").forEach((button) => {
      button.addEventListener("click", () => {
        const card = button.closest(".envelope-card");
        const panel = $(".envelope-letter", card);
        const opening = button.getAttribute("aria-expanded") !== "true";
        button.setAttribute("aria-expanded", String(opening));
        card.classList.toggle("is-open", opening);
        panel.hidden = !opening;
        if (opening) {
          const text = $("[data-letter-text]", panel);
          text.classList.remove("letter-revealed");
          window.requestAnimationFrame(() => text.classList.add("letter-revealed"));
        }
      });
    });
  }

  function setupMenu() {
    const toggle = $(".menu-toggle");
    const nav = $("#primary-nav");
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      nav.classList.toggle("is-open", open);
    });
    $$("a", nav).forEach((link) => link.addEventListener("click", () => {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation");
      nav.classList.remove("is-open");
    }));
  }

  function setupMusic() {
    const button = $("#music-toggle");
    const status = $("#music-status");
    const label = $("#music-label");
    let context = null;
    let timer = null;
    let audio = null;
    let noteIndex = 0;
    const notes = [261.63, 329.63, 392.00, 329.63, 293.66, 349.23, 440.00, 349.23];
    function playNote() {
      if (!context || context.state !== "running") return;
      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const volume = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = notes[noteIndex % notes.length];
      volume.gain.setValueAtTime(0.0001, now);
      volume.gain.exponentialRampToValueAtTime(0.035, now + 0.12);
      volume.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
      oscillator.connect(volume);
      volume.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 1.85);
      noteIndex += 1;
    }
    function stop() {
      if (timer) window.clearInterval(timer);
      timer = null;
      if (audio) audio.pause();
      if (context && context.state === "running") context.suspend();
      button.setAttribute("aria-pressed", "false");
      button.classList.remove("is-playing");
      status.textContent = "OFF";
      label.textContent = "A little music, if you'd like";
    }
    button.addEventListener("click", async () => {
      if (button.getAttribute("aria-pressed") === "true") {
        stop();
        return;
      }
      try {
        if (config.backgroundMusic) {
          if (!audio) {
            audio = new Audio(config.backgroundMusic);
            audio.loop = true;
            audio.volume = 0.35;
          }
          await audio.play();
          button.setAttribute("aria-pressed", "true");
          button.classList.add("is-playing");
          status.textContent = "ON";
          label.textContent = "A little melody, just for us";
          return;
        }
        if (!context) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (!AudioContext) throw new Error("Audio is not supported in this browser.");
          context = new AudioContext();
        }
        await context.resume();
        button.setAttribute("aria-pressed", "true");
        button.classList.add("is-playing");
        status.textContent = "ON";
        label.textContent = "A little melody, just for us";
        playNote();
        timer = window.setInterval(playNote, 1250);
      } catch (error) {
        status.textContent = "UNAVAILABLE";
        label.textContent = error.message || "Music could not be started";
      }
    });
  }

  function setupParallax() {
    if (reduceMotion || window.matchMedia("(pointer: coarse)").matches) return;
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const art = $(".hero-art");
        const offset = Math.min(window.scrollY, window.innerHeight) * 0.08;
        art.style.setProperty("--parallax-y", `${offset}px`);
        ticking = false;
      });
    }, { passive: true });
  }

  populateText();
  renderTimeline();
  renderGallery();
  setupLightbox();
  setupFilters();
  setupReveal();
  setupCounter();
  setupExpandableMessage();
  setupLetters();
  setupMenu();
  setupMusic();
  setupParallax();
})();
