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
    demoForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var submitBtn = demoForm.querySelector('button[type="submit"]');
      var action = demoForm.action || "";
      var useFormspree = action.indexOf("formspree.io") !== -1 && action.indexOf("FORM_ID") === -1;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending…";
      }
      if (useFormspree) {
        fetch(demoForm.action, {
          method: "POST",
          body: new FormData(demoForm),
          headers: { Accept: "application/json" }
        })
          .then(function (r) {
            if (r.ok) {
              showDemoSuccess(demoForm, false);
            } else throw new Error("Submit failed");
          })
          .catch(function () {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Send request"; }
            window.location.href = buildMailtoLink(demoForm);
            showDemoSuccess(demoForm, true);
          });
      } else {
        window.location.href = buildMailtoLink(demoForm);
        showDemoSuccess(demoForm, true);
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Send request"; }
      }
    });
  }
})();
