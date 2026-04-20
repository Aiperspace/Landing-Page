(function () {
  // Full-viewport cinematic intro: runs on every homepage load (see index.html #site-intro + inline boot).
  (function siteIntro() {
    const intro = document.getElementById("site-intro");
    if (!intro) return;

    const header = document.querySelector(".header");
    const main = document.getElementById("main");
    const skipLink = document.querySelector(".skip-link");
    const lines = [
      intro.querySelector(".site-intro__line--1"),
      intro.querySelector(".site-intro__line--2"),
      intro.querySelector(".site-intro__line--3")
    ].filter(Boolean);

    let timeouts = [];
    let introFinished = false;

    function clearIntroTimeouts() {
      timeouts.forEach(function (id) {
        window.clearTimeout(id);
      });
      timeouts = [];
    }

    function schedule(fn, ms) {
      timeouts.push(window.setTimeout(fn, ms));
    }

    function cleanup() {
      clearIntroTimeouts();
      intro.setAttribute("hidden", "");
      intro.classList.remove("site-intro--active", "site-intro--exit");
      document.body.classList.remove("site-intro-active");
      document.documentElement.classList.remove("site-intro-boot");
      document.body.classList.add("site-intro-done");
      intro.removeAttribute("tabindex");
      if (header) header.removeAttribute("inert");
      if (main) main.removeAttribute("inert");
      intro.setAttribute("aria-hidden", "true");
      lines.forEach(function (el) {
        el.classList.remove("is-visible");
      });

      const h1 = document.querySelector(".hero__title");
      if (h1) {
        h1.setAttribute("tabindex", "-1");
        h1.focus({ preventScroll: true });
      }
    }

    function finishSequence() {
      if (introFinished) return;
      introFinished = true;
      clearIntroTimeouts();
      intro.classList.add("site-intro--exit");
      timeouts.push(window.setTimeout(cleanup, 900));
    }

    function blockSkipDuringIntro(e) {
      if (document.documentElement.classList.contains("site-intro-boot")) {
        e.preventDefault();
      }
    }

    if (skipLink) {
      skipLink.addEventListener("click", blockSkipDuringIntro, true);
    }

    function run() {
      intro.removeAttribute("hidden");
      intro.classList.add("site-intro--active");
      document.body.classList.add("site-intro-active");
      intro.setAttribute("aria-hidden", "false");
      intro.setAttribute("tabindex", "-1");
      intro.focus({ preventScroll: true });
      if (header) header.setAttribute("inert", "");
      if (main) main.setAttribute("inert", "");

      schedule(function () {
        if (lines[0]) lines[0].classList.add("is-visible");
      }, 380);
      schedule(function () {
        if (lines[1]) lines[1].classList.add("is-visible");
      }, 860);
      schedule(function () {
        if (lines[2]) lines[2].classList.add("is-visible");
      }, 1520);
      schedule(finishSequence, 3180);
    }

    run();
  })();

  // Analytics: push to dataLayer for GTM/GA4. Ensure GTM container loads gtag and listens for these.
  function trackEvent(eventName, params) {
    if (typeof window.dataLayer !== "undefined") {
      window.dataLayer.push({ event: eventName, ...params });
    }
  }

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lowPerfDevice =
    (typeof navigator !== "undefined" &&
      ((typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4) ||
        (typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 4))) ||
    false;
  const disableHeavyMotion = prefersReducedMotion || lowPerfDevice;
  if (lowPerfDevice) document.body.classList.add("is-low-perf");

  // Subtle hero parallax (fast + respectful of reduced motion)
  (function () {
    if (disableHeavyMotion) return;
    const hero = document.querySelector(".hero");
    if (!hero) return;
    const orbs = Array.from(hero.querySelectorAll(".hero__orb"));
    const grid = hero.querySelector(".hero__grid-pattern");
    if (!orbs.length && !grid) return;

    let mx = 0;
    let my = 0;
    let raf = 0;

    function onMove(e) {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / Math.max(1, r.width);
      const y = (e.clientY - r.top) / Math.max(1, r.height);
      mx = (x - 0.5) * 2;
      my = (y - 0.5) * 2;
      if (!raf) raf = window.requestAnimationFrame(tick);
    }
    function tick() {
      raf = 0;
      const ox = mx * 10;
      const oy = my * 8;
      orbs.forEach(function (orb, i) {
        const k = (i + 1) * 0.7;
        orb.style.transform = "translate3d(" + ox * k + "px," + oy * k + "px,0)";
      });
      if (grid) grid.style.transform = "translate3d(" + (-mx * 6) + "px," + (-my * 4) + "px,0)";
    }
    hero.addEventListener("mousemove", onMove, { passive: true });
    hero.addEventListener("mouseleave", function () {
      mx = 0; my = 0;
      if (!raf) raf = window.requestAnimationFrame(tick);
    }, { passive: true });
  })();

  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("nav");
  if (toggle && nav) {
    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    toggle.addEventListener("click", () => {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", (e) => {
      if (e.target && e.target.tagName === "A") setOpen(false);
    });
  }

  // Smooth anchor scrolling with sticky-header offset
  const headerEl = document.querySelector(".header");
  function scrollToTarget(targetEl) {
    if (!targetEl) return;
    const headerH = headerEl ? headerEl.getBoundingClientRect().height : 0;
    const y = window.scrollY + targetEl.getBoundingClientRect().top - headerH - 12;
    window.scrollTo({ top: Math.max(0, y), behavior: prefersReducedMotion ? "auto" : "smooth" });
  }
  function isPlainHashLink(a) {
    if (!a) return false;
    const href = a.getAttribute("href") || "";
    if (!href || href === "#") return false;
    if (!href.startsWith("#")) return false;
    // Don't interfere with modal/lightbox toggles that rely on hash
    if (href === "#demo-modal") return false;
    return true;
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    if (!isPlainHashLink(a)) return;
    a.addEventListener("click", function (e) {
      const id = (a.getAttribute("href") || "").slice(1);
      const t = document.getElementById(id);
      if (!t) return;
      e.preventDefault();
      scrollToTarget(t);
      if (history && history.replaceState) history.replaceState(null, "", "#" + id);
    });
  });

  document.querySelectorAll(".landing-problem__grid--stagger > article").forEach(function (el, i) {
    el.style.setProperty("--i", String(i));
  });

  // Scroll reveal: .is-visible when section enters viewport (landing: earlier + smoother trigger)
  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    function onRevealEntry(entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      entry.target.querySelectorAll(".reveal-stagger").forEach(function (stagger) {
        const items = Array.from(stagger.children);
        items.forEach(function (child, i) {
          child.style.setProperty("--i", String(i));
        });
        stagger.querySelectorAll(".card").forEach(function (card, i) {
          card.style.setProperty("--i", String(i));
        });
      });
    }
    const landingOpts = { rootMargin: "0px 0px -5% 0px", threshold: [0, 0.06, 0.12] };
    const defaultOpts = { rootMargin: "0px 0px -10% 0px", threshold: 0.08 };
    const landingObserver = new IntersectionObserver((entries) => entries.forEach(onRevealEntry), landingOpts);
    const defaultObserver = new IntersectionObserver((entries) => entries.forEach(onRevealEntry), defaultOpts);
    document.querySelectorAll(".reveal").forEach(function (el) {
      if (el.closest(".main--landing")) {
        landingObserver.observe(el);
      } else {
        defaultObserver.observe(el);
      }
    });
  } else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
  }

  // Sticky header: compact bar + depth when scrolled (site shell)
  (function headerScrollRefine() {
    const header = document.querySelector(".header.header--site");
    if (!header) return;
    let raf = 0;
    function tick() {
      raf = 0;
      const y = window.scrollY || document.documentElement.scrollTop;
      header.classList.toggle("header--scrolled", y > 20);
      const n = Math.min(1, y / 200);
      document.documentElement.style.setProperty("--header-scroll", n.toFixed(4));
    }
    tick();
    window.addEventListener(
      "scroll",
      function () {
        if (!raf) raf = window.requestAnimationFrame(tick);
      },
      { passive: true }
    );
  })();

  // Landing: dark glass header over cinematic hero until user scrolls past fold
  (function landingHeroTopHeader() {
    const main = document.querySelector(".main--landing");
    const body = document.body;
    const hero = document.querySelector(".hero--landing");
    if (!main || !hero) return;
    let raf = 0;
    function tick() {
      raf = 0;
      var y = window.scrollY || document.documentElement.scrollTop || 0;
      var threshold = Math.min(120, Math.max(48, hero.offsetHeight * 0.06));
      body.classList.toggle("landing-at-hero-top", y < threshold);
    }
    function onScroll() {
      if (!raf) raf = window.requestAnimationFrame(tick);
    }
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
  })();

  // Landing: scroll-driven atmosphere for body + sticky header (0 = light, 1 = dark)
  (function landingAmbientAtmosphere() {
    const main = document.querySelector(".main--landing");
    if (!main) return;
    const body = document.body;
    if (lowPerfDevice) {
      document.documentElement.style.setProperty("--landing-ambient", "0");
      body.classList.remove("landing-body--dark");
      return;
    }

    const mission = document.getElementById("mission");
    const finale = document.getElementById("contact");
    if (!mission) return;

    let raf = 0;
    let smooth = 0;

    function smoothstep(t) {
      var x = Math.max(0, Math.min(1, t));
      return x * x * (3 - 2 * x);
    }

    function computeRaw() {
      var y = window.scrollY || document.documentElement.scrollTop || 0;
      var vh = window.innerHeight || 1;
      var mTop = mission.offsetTop;
      var fTop = finale ? finale.offsetTop : main.offsetHeight + y;
      var enter = mTop - vh * 0.75;
      var full = mTop + vh * 0.15;
      var exitStart = fTop - vh * 1.05;
      var exitEnd = fTop - vh * 0.25;
      if (y <= enter) return 0;
      if (y < full) return smoothstep((y - enter) / Math.max(1, full - enter));
      if (y < exitStart) return 1;
      if (y < exitEnd) return 1 - smoothstep((y - exitStart) / Math.max(1, exitEnd - exitStart));
      return 0;
    }

    function tick() {
      raf = 0;
      var raw = computeRaw();
      smooth += (raw - smooth) * 0.12;
      if (Math.abs(raw - smooth) < 0.004) smooth = raw;
      document.documentElement.style.setProperty("--landing-ambient", smooth.toFixed(4));
      body.classList.toggle("landing-body--dark", smooth > 0.38);
    }

    function onScroll() {
      if (!raf) raf = window.requestAnimationFrame(tick);
    }

    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
  })();

  // Supporters → 40% → copy: scroll-driven scene on landing story section
  (function landingStoryScene() {
    const section = document.querySelector("[data-story-section]");
    if (!section) return;

    const stat = section.querySelector("[data-story-stat]");
    const countEl = section.querySelector("[data-story-count]");
    const copy = section.querySelector("[data-story-copy]");

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    let raf = 0;
    let countStarted = false;

    function runCount() {
      if (!countEl || prefersReducedMotion) return;
      const duration = 1350;
      const start = performance.now();
      const end = 40;
      function frame(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = easeOutCubic(t);
        countEl.textContent = String(Math.round(eased * end));
        if (t < 1) window.requestAnimationFrame(frame);
        else countEl.textContent = "40";
      }
      window.requestAnimationFrame(frame);
    }

    if (disableHeavyMotion) {
      if ("IntersectionObserver" in window) {
        const obs = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (!entry.isIntersecting) return;
              if (stat) stat.classList.add("landing-story__stat-wrap--in");
              if (copy) copy.classList.add("landing-story__copy--in");
              if (countEl) countEl.textContent = "40";
              obs.disconnect();
            });
          },
          { threshold: 0.12 }
        );
        obs.observe(section);
      } else {
        if (stat) stat.classList.add("landing-story__stat-wrap--in");
        if (copy) copy.classList.add("landing-story__copy--in");
        if (countEl) countEl.textContent = "40";
      }
      return;
    }

    function tick() {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const denom = vh * 0.52 + Math.max(380, rect.height * 0.18);
      const raw = (vh * 0.86 - rect.top) / denom;
      const p = Math.max(0, Math.min(1, raw));

      section.style.setProperty("--story-supporters-opacity", "1");

      if (p > 0.32) {
        if (stat) stat.classList.add("landing-story__stat-wrap--in");
        if (!countStarted) {
          countStarted = true;
          runCount();
        }
      }

      if (p > 0.46 && copy) {
        copy.classList.add("landing-story__copy--in");
      }
    }

    function onScroll() {
      if (!raf) raf = window.requestAnimationFrame(tick);
    }

    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
  })();

  // Platform carousel: horizontal snap + autoplay + arrows/dots (landing only)
  (function landingBridgeCarousel() {
    const root = document.querySelector(".main--landing [data-bridge-carousel]");
    if (!root) return;
    const track = root.querySelector("[data-bridge-track]");
    const prevBtn = root.querySelector("[data-bridge-prev]");
    const nextBtn = root.querySelector("[data-bridge-next]");
    const dots = Array.from(root.querySelectorAll("[data-bridge-dot]"));
    const toggle = root.querySelector("[data-bridge-autoplay-toggle]");
    const toggleText = toggle ? toggle.querySelector("[data-bridge-toggle-text]") : null;
    if (!track) return;
    const slides = Array.from(track.querySelectorAll(".landing-bridge__shot"));
    const n = slides.length;
    if (n === 0) return;

    let autoplayUserPaused = false;
    let autoplayTimer = 0;
    let resumeTimer = 0;
    let programmatic = false;
    let hoverInside = false;
    let carouselVisible = true;
    let scrollSyncRaf = 0;

    function slideWidth() {
      return Math.max(1, track.clientWidth);
    }

    function currentIndex() {
      return Math.round(track.scrollLeft / slideWidth());
    }

    function syncDots(i) {
      const idx = Math.max(0, Math.min(n - 1, i));
      dots.forEach(function (d, j) {
        const on = j === idx;
        d.classList.toggle("is-active", on);
        d.setAttribute("aria-selected", on ? "true" : "false");
      });
    }

    function goTo(index, useSmooth) {
      const w = slideWidth();
      const i = Math.max(0, Math.min(n - 1, index));
      programmatic = true;
      track.scrollTo({
        left: i * w,
        behavior: useSmooth !== false && !prefersReducedMotion ? "smooth" : "auto",
      });
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          programmatic = false;
        });
      });
      syncDots(i);
    }

    function goNext() {
      const i = currentIndex();
      if (i >= n - 1) goTo(0);
      else goTo(i + 1);
    }

    function goPrev() {
      const i = currentIndex();
      if (i <= 0) goTo(n - 1);
      else goTo(i - 1);
    }

    function stopAutoplayInterval() {
      if (autoplayTimer) {
        window.clearInterval(autoplayTimer);
        autoplayTimer = 0;
      }
    }

    function stopAllCarouselTimers() {
      stopAutoplayInterval();
      if (resumeTimer) {
        window.clearTimeout(resumeTimer);
        resumeTimer = 0;
      }
    }

    function startAutoplay() {
      stopAutoplayInterval();
      if (autoplayUserPaused || prefersReducedMotion || disableHeavyMotion) return;
      if (!carouselVisible || hoverInside) return;
      autoplayTimer = window.setInterval(goNext, 5200);
    }

    function scheduleResumeAfterInteract() {
      if (autoplayUserPaused || prefersReducedMotion || disableHeavyMotion) return;
      stopAutoplayInterval();
      if (resumeTimer) window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(function () {
        resumeTimer = 0;
        startAutoplay();
      }, 6400);
    }

    function tryStartAutoplay() {
      if (autoplayUserPaused || prefersReducedMotion || disableHeavyMotion) return;
      if (!carouselVisible || hoverInside) return;
      startAutoplay();
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        goPrev();
        scheduleResumeAfterInteract();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        goNext();
        scheduleResumeAfterInteract();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        const idx = parseInt(dot.getAttribute("data-bridge-dot") || "0", 10);
        if (!isNaN(idx)) goTo(idx);
        scheduleResumeAfterInteract();
      });
    });

    track.addEventListener(
      "scroll",
      function () {
        if (programmatic) return;
        if (scrollSyncRaf) return;
        scrollSyncRaf = window.requestAnimationFrame(function () {
          scrollSyncRaf = 0;
          syncDots(currentIndex());
          scheduleResumeAfterInteract();
        });
      },
      { passive: true }
    );

    track.addEventListener(
      "wheel",
      function (e) {
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
        const dy = e.deltaY;
        const maxScroll = track.scrollWidth - track.clientWidth;
        const atStart = track.scrollLeft <= 2;
        const atEnd = track.scrollLeft >= maxScroll - 2;
        if ((dy < 0 && atStart) || (dy > 0 && atEnd)) return;
        e.preventDefault();
        track.scrollLeft += dy;
      },
      { passive: false }
    );

    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
        scheduleResumeAfterInteract();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
        scheduleResumeAfterInteract();
      } else if (e.key === "Home") {
        e.preventDefault();
        goTo(0);
        scheduleResumeAfterInteract();
      } else if (e.key === "End") {
        e.preventDefault();
        goTo(n - 1);
        scheduleResumeAfterInteract();
      }
    });

    if (toggle) {
      toggle.addEventListener("click", function () {
        autoplayUserPaused = !autoplayUserPaused;
        root.classList.toggle("landing-bridge__carousel--paused", autoplayUserPaused);
        toggle.setAttribute("aria-pressed", autoplayUserPaused ? "true" : "false");
        toggle.setAttribute(
          "aria-label",
          autoplayUserPaused ? "Resume automatic advance" : "Pause automatic advance"
        );
        if (toggleText) toggleText.textContent = autoplayUserPaused ? "Paused" : "Auto on";
        stopAllCarouselTimers();
        if (!autoplayUserPaused) tryStartAutoplay();
      });
    }

    root.addEventListener("mouseenter", function () {
      hoverInside = true;
      stopAllCarouselTimers();
    });
    root.addEventListener("mouseleave", function () {
      hoverInside = false;
      tryStartAutoplay();
    });

    window.addEventListener(
      "resize",
      function () {
        const i = Math.max(0, Math.min(n - 1, currentIndex()));
        programmatic = true;
        track.scrollTo({ left: i * slideWidth(), behavior: "auto" });
        window.requestAnimationFrame(function () {
          programmatic = false;
          syncDots(i);
        });
      },
      { passive: true }
    );

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        function (entries) {
          carouselVisible = entries.some(function (en) {
            return en.isIntersecting && en.intersectionRatio > 0.12;
          });
          if (carouselVisible) tryStartAutoplay();
          else stopAllCarouselTimers();
        },
        { threshold: [0, 0.08, 0.15, 0.25] }
      );
      io.observe(root);
    } else {
      tryStartAutoplay();
    }

    syncDots(0);
  })();

  // Product bridge: light scroll float + pointer tilt on visual stack (landing only)
  (function landingBridgeVisualMotion() {
    if (disableHeavyMotion) return;
    const stage = document.querySelector(".main--landing [data-bridge-stage]");
    const wrap = document.querySelector(".main--landing .landing-bridge__visual--motion");
    if (!stage || !wrap) return;
    let raf = 0;
    let bridgeYSmooth = 0;
    var mx = 0;
    var my = 0;
    function tick() {
      raf = 0;
      const r = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const center = r.top + r.height * 0.35;
      const t = 1 - center / (vh + r.height * 0.48);
      const p = Math.max(-1, Math.min(1, t));
      const target = prefersReducedMotion ? 0 : p * 11;
      bridgeYSmooth += (target - bridgeYSmooth) * 0.09;
      if (Math.abs(bridgeYSmooth - target) < 0.04) bridgeYSmooth = target;
      wrap.style.setProperty("--bridge-y", bridgeYSmooth.toFixed(2) + "px");
      var tx = prefersReducedMotion ? 0 : my * -1.6;
      var ty = prefersReducedMotion ? 0 : mx * 2.2;
      wrap.style.setProperty("--tilt-x", tx.toFixed(3) + "deg");
      wrap.style.setProperty("--tilt-y", ty.toFixed(3) + "deg");
    }
    function onMove(e) {
      if (prefersReducedMotion) return;
      var rect = stage.getBoundingClientRect();
      mx = (e.clientX - rect.left) / Math.max(1, rect.width);
      my = (e.clientY - rect.top) / Math.max(1, rect.height);
      mx = (mx - 0.5) * 2;
      my = (my - 0.5) * 2;
      if (!raf) raf = window.requestAnimationFrame(tick);
    }
    if (!prefersReducedMotion) {
      stage.addEventListener("mousemove", onMove, { passive: true });
      stage.addEventListener(
        "mouseleave",
        function () {
          mx = 0;
          my = 0;
          if (!raf) raf = window.requestAnimationFrame(tick);
        },
        { passive: true }
      );
    }
    window.addEventListener(
      "scroll",
      function () {
        if (!raf) raf = window.requestAnimationFrame(tick);
      },
      { passive: true }
    );
    tick();
  })();

  // Hero: perspective tilt on stage (float animation runs on [data-hero-frame] in CSS)
  (function heroLandingStageMotion() {
    if (disableHeavyMotion) return;
    const stage = document.querySelector("[data-hero-stage]");
    if (!stage) return;
    var mx = 0;
    var my = 0;
    var raf = 0;
    function tick() {
      raf = 0;
      var rx = my * -1;
      var ry = mx * 1.3;
      stage.style.transform =
        "perspective(1200px) rotateX(" + rx.toFixed(3) + "deg) rotateY(" + ry.toFixed(3) + "deg)";
    }
    function onMove(e) {
      var r = stage.getBoundingClientRect();
      mx = ((e.clientX - r.left) / Math.max(1, r.width) - 0.5) * 2;
      my = ((e.clientY - r.top) / Math.max(1, r.height) - 0.5) * 2;
      if (!raf) raf = window.requestAnimationFrame(tick);
    }
    stage.addEventListener("mousemove", onMove, { passive: true });
    stage.addEventListener(
      "mouseleave",
      function () {
        mx = 0;
        my = 0;
        if (!raf) raf = window.requestAnimationFrame(tick);
      },
      { passive: true }
    );
  })();

  // Hero lifecycle diagram: dependency highlight + forward propagation on hover
  (function heroLifecycleGraph() {
    const root = document.querySelector("[data-lifecycle-graph]");
    if (!root) return;
    const stages = Array.from(root.querySelectorAll("[data-lifecycle-stage]"));
    const links = Array.from(root.querySelectorAll("[data-lifecycle-link]"));
    if (!stages.length || !links.length) return;

    const out = {};
    const undirected = {};
    function addUndirected(a, b) {
      if (!undirected[a]) undirected[a] = [];
      if (!undirected[b]) undirected[b] = [];
      if (undirected[a].indexOf(b) === -1) undirected[a].push(b);
      if (undirected[b].indexOf(a) === -1) undirected[b].push(a);
    }
    links.forEach(function (path) {
      const a = path.getAttribute("data-from");
      const b = path.getAttribute("data-to");
      if (!a || !b) return;
      if (!out[a]) out[a] = [];
      if (out[a].indexOf(b) === -1) out[a].push(b);
      addUndirected(a, b);
    });

    function forwardReachable(start) {
      const seen = new Set();
      const q = [start];
      seen.add(start);
      while (q.length) {
        const u = q.shift();
        (out[u] || []).forEach(function (v) {
          if (!seen.has(v)) {
            seen.add(v);
            q.push(v);
          }
        });
      }
      return seen;
    }

    function connectedComponent(start) {
      const seen = new Set();
      const stack = [start];
      seen.add(start);
      while (stack.length) {
        const u = stack.pop();
        (undirected[u] || []).forEach(function (v) {
          if (!seen.has(v)) {
            seen.add(v);
            stack.push(v);
          }
        });
      }
      return seen;
    }

    function clearState() {
      root.classList.remove("is-lifecycle-hovering");
      stages.forEach(function (g) {
        g.classList.remove("is-hub", "is-connected", "is-downstream", "is-dim");
      });
      links.forEach(function (p) {
        p.classList.remove("is-active", "is-prop");
      });
    }

    function applyHover(hubId) {
      clearState();
      root.classList.add("is-lifecycle-hovering");
      const conn = connectedComponent(hubId);
      const downstream = forwardReachable(hubId);
      stages.forEach(function (g) {
        const id = g.getAttribute("data-lifecycle-stage");
        if (!id) return;
        if (id === hubId) g.classList.add("is-hub");
        else if (conn.has(id)) g.classList.add("is-connected");
        if (id !== hubId && downstream.has(id)) g.classList.add("is-downstream");
        if (!conn.has(id)) g.classList.add("is-dim");
      });
      links.forEach(function (p) {
        const a = p.getAttribute("data-from");
        const b = p.getAttribute("data-to");
        if (!a || !b) return;
        if (conn.has(a) && conn.has(b)) p.classList.add("is-active");
        if (downstream.has(a) && downstream.has(b) && out[a] && out[a].indexOf(b) !== -1) {
          p.classList.add("is-prop");
        }
      });
    }

    stages.forEach(function (g) {
      g.addEventListener(
        "mouseenter",
        function () {
          const id = g.getAttribute("data-lifecycle-stage");
          if (id) applyHover(id);
        },
        { passive: true }
      );
    });
    root.addEventListener("mouseleave", clearState, { passive: true });
  })();

  // Mission: subtle parallax on inner content (landing)
  (function landingMissionParallax() {
    if (disableHeavyMotion) return;
    const section = document.querySelector("[data-mission-section]");
    const inner = document.querySelector("[data-mission-inner]");
    if (!section || !inner) return;
    let raf = 0;
    let y = 0;
    function tick() {
      raf = 0;
      const r = section.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const center = r.top + r.height * 0.35;
      const t = (vh * 0.55 - center) / (vh * 0.9 + r.height * 0.2);
      const target = Math.max(-14, Math.min(14, t * 22));
      y += (target - y) * 0.08;
      inner.style.transform = "translate3d(0, " + y.toFixed(2) + "px, 0)";
    }
    function onScroll() {
      if (!raf) raf = window.requestAnimationFrame(tick);
    }
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
  })();

  // Product walkthrough highlight on scroll (Step 1 → Step 3)
  (function () {
    const figs = Array.from(document.querySelectorAll(".product-shots__fig"));
    if (!figs.length || !("IntersectionObserver" in window)) return;
    function setActive(fig) {
      figs.forEach((f) => f.classList.toggle("is-active-step", f === fig));
    }
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (!visible.length) return;
        visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        setActive(visible[0].target);
      },
      { rootMargin: "-35% 0px -45% 0px", threshold: [0, 0.15, 0.3, 0.5, 0.75] }
    );
    figs.forEach((f) => obs.observe(f));
  })();

  // Product page one-frame carousel + sticky story sync
  (function () {
    const carousel = document.querySelector("[data-carousel]");
    if (!carousel) return;
    const slides = Array.from(carousel.querySelectorAll("[data-carousel-slide]"));
    const dots = Array.from(carousel.querySelectorAll("[data-carousel-dot]"));
    const prevBtn = carousel.querySelector("[data-carousel-prev]");
    const nextBtn = carousel.querySelector("[data-carousel-next]");
    const storySteps = Array.from(document.querySelectorAll(".story-step[data-slide-target]"));
    if (!slides.length) return;
    let idx = 0;
    let timer = 0;

    function setActive(newIdx, userTriggered) {
      idx = (newIdx + slides.length) % slides.length;
      slides.forEach(function (slide, i) { slide.classList.toggle("is-active", i === idx); });
      dots.forEach(function (dot, i) { dot.classList.toggle("is-active", i === idx); });
      storySteps.forEach(function (step) {
        step.classList.toggle("is-current", Number(step.getAttribute("data-slide-target")) === idx);
      });
      if (userTriggered) restartAuto();
    }
    function restartAuto() {
      if (prefersReducedMotion) return;
      window.clearInterval(timer);
      timer = window.setInterval(function () { setActive(idx + 1, false); }, 3600);
    }

    if (prevBtn) prevBtn.addEventListener("click", function () { setActive(idx - 1, true); });
    if (nextBtn) nextBtn.addEventListener("click", function () { setActive(idx + 1, true); });
    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        const n = Number(dot.getAttribute("data-carousel-dot"));
        if (!Number.isNaN(n)) setActive(n, true);
      });
    });
    storySteps.forEach(function (step) {
      step.addEventListener("click", function () {
        const n = Number(step.getAttribute("data-slide-target"));
        if (!Number.isNaN(n)) setActive(n, true);
      });
    });

    // Let scroll position also progressively highlight the corresponding step
    if ("IntersectionObserver" in window && storySteps.length) {
      const obs = new IntersectionObserver(
        (entries) => {
          const visible = entries.filter((e) => e.isIntersecting);
          if (!visible.length) return;
          visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          const target = visible[0].target;
          const n = Number(target.getAttribute("data-slide-target"));
          if (!Number.isNaN(n)) setActive(n, false);
        },
        { rootMargin: "-35% 0px -45% 0px", threshold: [0.2, 0.5, 0.8] }
      );
      storySteps.forEach(function (s) { obs.observe(s); });
    }

    // Open active carousel slide in existing lightbox on click
    const activeToLightbox = function () {
      const active = slides[idx];
      const img = active ? active.querySelector("img") : null;
      if (!img) return;
      const src = img.getAttribute("data-lightbox-src") || img.src;
      openProductLightbox(src, img.alt, "");
    };
    carousel.querySelector(".product-carousel__viewport").addEventListener("click", activeToLightbox);

    setActive(0, false);
    restartAuto();
  })();

  // Animated counters in metrics (only for values that are numeric-ish)
  function parseCountText(text) {
    const raw = String(text || "").trim();
    if (!raw) return null;
    const match = raw.match(/^([^0-9]*)([0-9]+(?:[.,][0-9]+)?)(\s*[kKmM%]?)(.*)$/);
    if (!match) return null;
    const prefix = match[1] || "";
    const numStr = (match[2] || "").replace(",", ".");
    const unit = (match[3] || "").trim();
    const suffix = match[4] || "";
    let n = Number(numStr);
    if (!isFinite(n)) return null;
    let scale = 1;
    if (unit.toLowerCase() === "k") scale = 1000;
    if (unit.toLowerCase() === "m") scale = 1000000;
    const value = n * scale;
    return { prefix, value, unit, suffix };
  }
  function formatCount(prefix, value, unit, suffix, decimals) {
    let displayValue = value;
    let displayUnit = unit;
    if (!displayUnit && value >= 1000000) {
      displayValue = value / 1000000;
      displayUnit = "M";
    } else if (!displayUnit && value >= 1000) {
      displayValue = value / 1000;
      displayUnit = "k";
    }
    const fixed = typeof decimals === "number" ? displayValue.toFixed(decimals) : String(Math.round(displayValue));
    return prefix + fixed + (displayUnit ? displayUnit : "") + suffix;
  }
  function animateCount(el) {
    const finalText = el.getAttribute("data-count-final") || el.textContent;
    const parsed = parseCountText(finalText);
    if (!parsed) return;
    const { prefix, value, unit, suffix } = parsed;
    const duration = 900;
    const start = performance.now();
    const decimals = String(finalText).includes(".") || String(finalText).includes(",") ? 1 : 0;

    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = value * eased;
      el.textContent = formatCount(prefix, current, unit, suffix, decimals);
      if (t < 1) window.requestAnimationFrame(tick);
      else el.textContent = finalText;
    }
    window.requestAnimationFrame(tick);
  }
  function setupMetricCounters() {
    const metricValues = Array.from(document.querySelectorAll("#metrics .card__value"));
    metricValues.forEach(function (el) {
      const txt = (el.textContent || "").trim();
      if (!parseCountText(txt)) return;
      el.setAttribute("data-count-final", txt);
      el.textContent = txt.replace(/[0-9]/g, "0");
    });

    if (prefersReducedMotion) {
      metricValues.forEach(function (el) {
        const finalText = el.getAttribute("data-count-final");
        if (finalText) el.textContent = finalText;
      });
      return;
    }
    if (!("IntersectionObserver" in window)) {
      metricValues.forEach(animateCount);
      return;
    }
    const already = new WeakSet();
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          if (already.has(el)) return;
          already.add(el);
          animateCount(el);
        });
      },
      { rootMargin: "0px 0px -20% 0px", threshold: 0.15 }
    );
    metricValues.forEach(function (el) {
      if (el.getAttribute("data-count-final")) obs.observe(el);
    });
  }
  setupMetricCounters();

  // FAQ accordion: keep only one <details> open at a time
  const faqDetails = Array.from(document.querySelectorAll("#faq details"));
  if (faqDetails.length) {
    faqDetails.forEach(function (d) {
      d.addEventListener("toggle", function () {
        if (!d.open) return;
        faqDetails.forEach(function (other) {
          if (other !== d) other.open = false;
        });
      });
    });
  }

  // Scroll progress (CSS variable) + active section highlight in nav
  const progressEl = document.querySelector(".scroll-progress");
  const navLinks = Array.from(document.querySelectorAll('#nav a[href^="#"]'))
    .filter((a) => a.getAttribute("href") && a.getAttribute("href").length > 1);

  const sectionIds = navLinks
    .map((a) => a.getAttribute("href").slice(1))
    .filter((id) => id !== "demo-modal")
    .filter((id, idx, arr) => arr.indexOf(id) === idx);

  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  function setActiveSection(id) {
    navLinks.forEach((a) => {
      const href = a.getAttribute("href");
      const active = href === "#" + id;
      a.classList.toggle("is-active", active);
      if (active) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  }

  if ("IntersectionObserver" in window && sections.length) {
    const activeObserver = new IntersectionObserver(
      (entries) => {
        // Pick the entry most centered/visible
        const visible = entries.filter((e) => e.isIntersecting);
        if (!visible.length) return;
        visible.sort((a, b) => (b.intersectionRatio - a.intersectionRatio));
        const id = visible[0].target.id;
        if (id) setActiveSection(id);
      },
      { rootMargin: "-45% 0px -55% 0px", threshold: [0, 0.15, 0.3, 0.5, 0.75] }
    );
    sections.forEach((s) => activeObserver.observe(s));
  }

  let ticking = false;
  function updateProgress() {
    ticking = false;
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop || 0;
    const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
    const p = Math.min(1, Math.max(0, scrollTop / maxScroll));
    if (progressEl) doc.style.setProperty("--scroll", String(p));
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateProgress);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  updateProgress();
  // Book a demo modal: open/close and form submit via Formspree
  const demoModal = document.getElementById("demo-modal");
  const demoForm = document.getElementById("demo-form");
  const demoSuccess = document.getElementById("demo-success");
  const openDemoBtns = document.querySelectorAll("[data-open-demo], a[href='#demo-modal']");

  function openDemoModal() {
    if (!demoModal) return;
    demoModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    const firstInput = demoModal.querySelector(".demo-form__input");
    if (firstInput) setTimeout(function () { firstInput.focus(); }, 100);
  }
  function closeDemoModal() {
    if (!demoModal) return;
    demoModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  openDemoBtns.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var location = (btn.closest(".hero") && "hero") || (btn.closest(".nav") && "nav") || (btn.closest(".contact") && "footer") || "page";
      trackEvent("select_content", { content_type: "cta", item_id: "book_demo", location: location });
      openDemoModal();
    });
  });
  if (demoModal) {
    demoModal.querySelectorAll("[data-demo-close]").forEach(function (el) {
      el.addEventListener("click", closeDemoModal);
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && demoModal && demoModal.getAttribute("aria-hidden") === "false") closeDemoModal();
  });

  if (demoForm) {
    var formspreeEndpoint = "https://formspree.io/f/xpqydkoy";
    var demoEmail = "info.aiper.space@gmail.com";
    function buildMailtoLink(form) {
      var first = (form.querySelector('[name="first_name"]') || {}).value || "";
      var last = (form.querySelector('[name="last_name"]') || {}).value || "";
      var email = (form.querySelector('[name="email"]') || {}).value || "";
      var company = (form.querySelector('[name="company"]') || {}).value || "";
      var message = (form.querySelector('[name="message"]') || {}).value || "";
      var subject = "AIPER – Demo request from " + (company || "website");
      var body = "First name: " + first + "\r\nLast name: " + last + "\r\nEmail: " + email + "\r\nCompany: " + company + (message ? "\r\n\r\nMessage:\r\n" + message : "");
      return "mailto:" + demoEmail + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    }
    function showDemoSuccess(form, useMailto) {
      form.hidden = true;
      if (demoSuccess) {
        demoSuccess.hidden = false;
        demoSuccess.innerHTML = useMailto
          ? "<p><strong>Almost done.</strong> Your email client has opened with your request. Please click <strong>Send</strong> to complete.</p>"
          : "<p><strong>Thank you.</strong> We'll be in touch soon.</p>";
      }
    }
    function getFormPayload(form) {
      return {
        first_name: (form.querySelector('[name="first_name"]') || {}).value || "",
        last_name: (form.querySelector('[name="last_name"]') || {}).value || "",
        email: (form.querySelector('[name="email"]') || {}).value || "",
        company: (form.querySelector('[name="company"]') || {}).value || "",
        message: (form.querySelector('[name="message"]') || {}).value || "",
        _subject: "AIPER – Demo request from website"
      };
    }
    demoForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var submitBtn = demoForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending…";
      }
      var payload = getFormPayload(demoForm);
      fetch(formspreeEndpoint, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      })
        .then(function (r) {
          return r.json().then(function (data) {
            if (r.ok) {
              demoForm.reset();
              trackEvent("generate_lead", { lead_type: "demo", method: "form", value: 1 });
              showDemoSuccess(demoForm, false);
            } else {
              throw new Error(data.error || "Submit failed");
            }
          }, function () {
            if (r.ok) {
              demoForm.reset();
              trackEvent("generate_lead", { lead_type: "demo", method: "form", value: 1 });
              showDemoSuccess(demoForm, false);
            } else {
              throw new Error("Submit failed");
            }
          });
        })
        .catch(function (err) {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Send request";
          }
          window.location.href = buildMailtoLink(demoForm);
          showDemoSuccess(demoForm, true);
        });
    });
  }

  // Product lightbox: click step to view image larger
  var productLightbox = document.getElementById("product-lightbox");
  var lightboxImg = document.getElementById("lightbox-img");
  var lightboxCaption = document.getElementById("lightbox-caption");
  var lightboxClosers = productLightbox ? productLightbox.querySelectorAll("[data-lightbox-close]") : [];

  function openProductLightbox(src, alt, captionText) {
    if (!productLightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || "";
    if (lightboxCaption) lightboxCaption.textContent = captionText || "";
    productLightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    var closeBtn = productLightbox.querySelector(".lightbox__close");
    if (closeBtn) closeBtn.focus();
  }
  function closeProductLightbox() {
    if (!productLightbox) return;
    productLightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  // Download CTAs: scroll to placeholder and fire select_content for GA4
  document.querySelectorAll("[data-download-sample]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      var target = document.getElementById("sample-download");
      if (target && el.getAttribute("href") === "#sample-download") {
        e.preventDefault();
        trackEvent("select_content", { item_id: "sample_output_pdf" });
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  document.querySelectorAll(".product-shots__fig[data-lightbox]").forEach(function (fig) {
    function openFromFig() {
      var img = fig.querySelector("img");
      var cap = fig.querySelector("figcaption");
      if (img) openProductLightbox(img.getAttribute("data-lightbox-src") || img.src, img.alt, cap ? cap.textContent.trim() : "");
    }
    fig.addEventListener("click", openFromFig);
    fig.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openFromFig();
      }
    });
  });
  if (productLightbox) {
    lightboxClosers.forEach(function (el) {
      el.addEventListener("click", closeProductLightbox);
    });
    productLightbox.querySelector(".lightbox__backdrop").addEventListener("click", closeProductLightbox);
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && productLightbox && productLightbox.getAttribute("aria-hidden") === "false") {
      closeProductLightbox();
    }
  });
})();
