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

  // Subtle hero parallax (fast + respectful of reduced motion)
  (function () {
    if (prefersReducedMotion) return;
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

  document.querySelectorAll(".landing-problem__list--stagger > li").forEach(function (li, i) {
    li.style.setProperty("--i", String(i));
  });

  // Scroll reveal: add .is-visible when .reveal enters viewport
  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
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
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
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

  // Scroll-driven light → dark only (homepage): ramp into mission, stay dark below
  (function landingAmbientAtmosphere() {
    const main = document.querySelector(".main--landing");
    if (!main) return;

    const docEl = document.documentElement;
    const body = document.body;
    const supportsColorMix =
      typeof CSS !== "undefined" &&
      CSS.supports &&
      CSS.supports("background", "color-mix(in srgb, red, blue)");

    const mission = document.getElementById("mission");
    if (!mission) return;

    var displayedAmbient = -1;
    /** Follow strength: lower = silkier handoff (slight inertia; settles into place). */
    var followK = prefersReducedMotion ? 1 : 0.11;

    function docTop(el) {
      const r = el.getBoundingClientRect();
      return r.top + window.scrollY;
    }

    function clamp(t, a, b) {
      return Math.max(a, Math.min(b, t));
    }

    /** C² smooth ramp (Perlin smootherstep) — softer than smoothstep at edges */
    function smootherstep(t) {
      t = clamp(t, 0, 1);
      return t * t * t * (t * (t * 6 - 15) + 10);
    }

    /**
     * Single blend: light above mission, smooth ramp approaching #mission,
     * then dark for mission (Our mission), Platform, and the rest of the page.
     */
    function computeAmbientTarget() {
      const vh = window.innerHeight || 1;
      const sy = window.scrollY || docEl.scrollTop || 0;
      const focal = sy + vh * 0.38;

      const mTop = docTop(mission);

      var B = Math.min(720, vh * 0.92);
      if (prefersReducedMotion) {
        B *= 1.12;
      }

      var transitionStart = mTop - B;
      var transitionEnd = mTop + B * 0.5;
      if (transitionEnd < transitionStart + B * 0.22) {
        transitionEnd = transitionStart + B * 0.35;
      }

      if (focal < transitionStart) return 0;
      if (focal < transitionEnd) {
        return smootherstep((focal - transitionStart) / (transitionEnd - transitionStart));
      }
      return 1;
    }

    let raf = 0;
    function tick() {
      raf = 0;
      var target = computeAmbientTarget();
      if (displayedAmbient < 0) {
        displayedAmbient = target;
      } else {
        displayedAmbient += (target - displayedAmbient) * followK;
        if (Math.abs(target - displayedAmbient) < 0.0008) {
          displayedAmbient = target;
        }
      }
      docEl.style.setProperty("--landing-ambient", displayedAmbient.toFixed(5));

      if (!supportsColorMix) {
        body.classList.toggle("landing-body--dark", displayedAmbient > 0.52);
      } else {
        body.classList.remove("landing-body--dark");
      }
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

    if (prefersReducedMotion) {
      if ("IntersectionObserver" in window) {
        const obs = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (!entry.isIntersecting) return;
              section.style.setProperty("--story-logo-fade", "0.35");
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
        section.style.setProperty("--story-logo-fade", "0.35");
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

      var logoFade = 1;
      if (p > 0.18) {
        logoFade = 1 - easeOutCubic(Math.min(1, (p - 0.18) / 0.36)) * 0.88;
      }
      section.style.setProperty("--story-logo-fade", logoFade.toFixed(4));

      if (p > 0.32) {
        if (stat) stat.classList.add("landing-story__stat-wrap--in");
        if (p > 0.32 && !countStarted) {
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

  // Subtle scroll-linked depth on product preview visuals (landing only)
  (function landingBridgeVisualMotion() {
    if (prefersReducedMotion) return;
    const wrap = document.querySelector(".main--landing .landing-bridge__visual--motion");
    if (!wrap) return;
    let raf = 0;
    function tick() {
      raf = 0;
      const r = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const center = r.top + r.height * 0.35;
      const t = 1 - center / (vh + r.height * 0.5);
      const p = Math.max(-1, Math.min(1, t));
      wrap.style.setProperty("--bridge-y", (p * 10).toFixed(2) + "px");
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
