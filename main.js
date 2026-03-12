(function () {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

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

  // Scroll reveal: add .is-visible when .reveal enters viewport
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            const stagger = entry.target.querySelector(".reveal-stagger");
            if (stagger) {
              stagger.querySelectorAll(".card").forEach((card, i) => {
                card.style.setProperty("--i", i);
              });
            }
          }
        });
      },
      { rootMargin: "0px 0px -80px 0px", threshold: 0 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
  } else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
  }
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
              showDemoSuccess(demoForm, false);
            } else {
              throw new Error(data.error || "Submit failed");
            }
          }, function () {
            if (r.ok) {
              demoForm.reset();
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
