(function () {
  var cfg = window.SUPABASE_CONFIG || {};
  var hasSupabaseLib = typeof window.supabase !== "undefined" && typeof window.supabase.createClient === "function";
  var hasConfig = cfg.url && cfg.anonKey && !cfg.url.includes("YOUR_PROJECT_REF") && !cfg.anonKey.includes("YOUR_SUPABASE_ANON_KEY");

  function setText(selector, text) {
    var el = document.querySelector(selector);
    if (el) el.textContent = text;
  }

  function setStatus(text, type) {
    var el = document.getElementById("auth-status");
    if (!el) return;
    el.textContent = text || "";
    el.classList.remove("auth-status--error", "auth-status--ok");
    if (type === "error") el.classList.add("auth-status--error");
    if (type === "ok") el.classList.add("auth-status--ok");
  }

  function updateAuthNav(user) {
    document.querySelectorAll("[data-auth-nav]").forEach(function (link) {
      if (user) {
        link.setAttribute("href", "/dashboard.html");
        link.textContent = "Dashboard";
      } else {
        link.setAttribute("href", "/login.html");
        link.textContent = "Login";
      }
    });
  }

  if (!hasSupabaseLib) {
    updateAuthNav(null);
    setStatus("Auth library failed to load. Refresh and try again.", "error");
    return;
  }

  if (!hasConfig) {
    updateAuthNav(null);
    setStatus("Supabase is not configured. Add keys in supabase-config.js.", "error");
    console.warn("Supabase config missing. Update supabase-config.js");
    return;
  }

  var client = window.supabase.createClient(cfg.url, cfg.anonKey);
  window.aiperSupabase = client;

  function currentPath() {
    return (window.location.pathname || "").toLowerCase();
  }

  function isLoginPage() {
    return currentPath().endsWith("/login.html") || currentPath().endsWith("/login");
  }

  function isDashboardPage() {
    return currentPath().endsWith("/dashboard.html") || currentPath().endsWith("/dashboard");
  }

  function ensureProfile(user) {
    if (!user || !user.id) return Promise.resolve();
    return client
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email || null,
          full_name: (user.user_metadata && user.user_metadata.full_name) || null
        },
        { onConflict: "id" }
      )
      .then(function () {
        return null;
      })
      .catch(function () {
        return null;
      });
  }

  function redirectToDashboard() {
    window.location.href = "/dashboard.html";
  }

  function redirectToLogin() {
    var next = encodeURIComponent(window.location.pathname || "/dashboard.html");
    window.location.href = "/login.html?next=" + next;
  }

  function parseNextUrl() {
    var params = new URLSearchParams(window.location.search || "");
    var next = params.get("next");
    if (!next) return "/dashboard.html";
    if (!next.startsWith("/")) return "/dashboard.html";
    return next;
  }

  function bindAuthForms() {
    var loginForm = document.getElementById("login-form");
    var registerForm = document.getElementById("register-form");
    var resendBtn = document.getElementById("resend-verification-btn");

    function getEmailRedirectUrl() {
      var base = (cfg.siteUrl || window.location.origin || "").replace(/\/+$/, "");
      return base + "/login.html";
    }

    if (loginForm) {
      loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        setStatus("Signing in...", "ok");
        var email = (document.getElementById("login-email") || {}).value || "";
        var password = (document.getElementById("login-password") || {}).value || "";
        var res = await client.auth.signInWithPassword({ email: email.trim(), password: password });
        if (res.error) {
          var msg = res.error.message || "Login failed.";
          if (
            /email not confirmed/i.test(msg) ||
            /email.*confirm/i.test(msg) ||
            /not confirmed/i.test(msg)
          ) {
            msg = "Please verify your email first. Then sign in.";
          }
          setStatus(msg, "error");
          return;
        }
        await ensureProfile(res.data.user);
        setStatus("Signed in. Redirecting...", "ok");
        window.location.href = parseNextUrl();
      });
    }

    if (registerForm) {
      registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        setStatus("Creating account...", "ok");
        var fullName = (document.getElementById("register-name") || {}).value || "";
        var email = (document.getElementById("register-email") || {}).value || "";
        var password = (document.getElementById("register-password") || {}).value || "";
        var confirm = (document.getElementById("register-password-confirm") || {}).value || "";

        if (password.length < 6) {
          setStatus("Password must be at least 6 characters.", "error");
          return;
        }
        if (password !== confirm) {
          setStatus("Passwords do not match.", "error");
          return;
        }

        var res = await client.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: getEmailRedirectUrl()
          }
        });

        if (res.error) {
          setStatus(res.error.message || "Registration failed.", "error");
          return;
        }

        if (res.data && res.data.user) await ensureProfile(res.data.user);

        if (res.data && res.data.session) {
          setStatus("Account created. Redirecting...", "ok");
          redirectToDashboard();
          return;
        }

        setStatus("Account created. Verification email sent. Check your inbox, then sign in.", "ok");
      });
    }

    if (resendBtn) {
      resendBtn.addEventListener("click", async function () {
        var email = ((document.getElementById("login-email") || {}).value || "").trim();
        if (!email) {
          setStatus("Enter your email in Sign in, then click resend.", "error");
          return;
        }
        setStatus("Sending verification email...", "ok");
        var resend = await client.auth.resend({
          type: "signup",
          email: email,
          options: { emailRedirectTo: getEmailRedirectUrl() }
        });
        if (resend.error) {
          setStatus(resend.error.message || "Could not resend verification email.", "error");
          return;
        }
        setStatus("Verification email sent. Check your inbox.", "ok");
      });
    }
  }

  function bindLogout() {
    document.querySelectorAll("[data-auth-logout]").forEach(function (btn) {
      btn.addEventListener("click", async function (e) {
        e.preventDefault();
        await client.auth.signOut();
        updateAuthNav(null);
        redirectToLogin();
      });
    });
  }

  function renderUser(user) {
    setText("[data-user-email]", user && user.email ? user.email : "");
    setText(
      "[data-user-name]",
      (user && user.user_metadata && user.user_metadata.full_name) || (user && user.email) || "AIPER User"
    );
  }

  async function init() {
    var sessionResult = await client.auth.getSession();
    var user = sessionResult.data && sessionResult.data.session ? sessionResult.data.session.user : null;
    updateAuthNav(user);
    bindLogout();
    bindAuthForms();

    if (isLoginPage() && user) {
      redirectToDashboard();
      return;
    }

    if (isDashboardPage()) {
      if (!user) {
        redirectToLogin();
        return;
      }
      await ensureProfile(user);
      renderUser(user);
    }
  }

  client.auth.onAuthStateChange(function (_event, session) {
    var user = session && session.user ? session.user : null;
    updateAuthNav(user);
    if (isDashboardPage()) renderUser(user);
  });

  init();
})();
