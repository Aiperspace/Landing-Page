(function () {
  var cfg = window.SUPABASE_CONFIG || {};
  var hasSupabaseLib = typeof window.supabase !== "undefined" && typeof window.supabase.createClient === "function";
  var hasConfig = cfg.url && cfg.anonKey && !cfg.url.includes("YOUR_PROJECT_REF") && !cfg.anonKey.includes("YOUR_SUPABASE_ANON_KEY");

  // Always wire feature links, even if Supabase fails to load.
  function featuresAppOriginUnsafe() {
    var raw = typeof window.AIPER_FEATURES_APP_ORIGIN === "string" ? window.AIPER_FEATURES_APP_ORIGIN.trim() : "";
    return raw.replace(/\/+$/, "");
  }

  function applyFeaturesAppLinksUnsafe() {
    var base = featuresAppOriginUnsafe();
    var nodes = document.querySelectorAll("a[data-require-auth][data-feature]");
    if (!base) return;
    nodes.forEach(function (a) {
      var f = a.getAttribute("data-feature");
      if (!f) return;
      var featureUrl = base + "/?feature=" + encodeURIComponent(f);
      // Use login as a stable trampoline; if already logged in, login page immediately redirects to ?next.
      a.setAttribute("href", "/login.html?next=" + encodeURIComponent(featureUrl));
    });
  }

  try {
    applyFeaturesAppLinksUnsafe();
  } catch (_err) {
    // ignore
  }

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
    document.body.classList.toggle("is-authenticated", !!user);
    var displayName =
      (user && user.user_metadata && user.user_metadata.full_name) ||
      (user && user.email ? user.email.split("@")[0] : "");
    var firstName = displayName ? String(displayName).trim().split(/\s+/)[0] : "";
    document.querySelectorAll("[data-auth-logout-nav]").forEach(function (el) {
      el.hidden = !user;
    });
  }

  function ensureAuthNavElements() {
    document.querySelectorAll("nav.nav--site").forEach(function (nav) {
      if (!nav.querySelector("[data-auth-logout-nav]")) {
        var logoutLink = document.createElement("a");
        logoutLink.className = "nav__link nav__link--logout";
        logoutLink.href = "#";
        logoutLink.textContent = "Log out";
        logoutLink.setAttribute("data-auth-logout", "");
        logoutLink.setAttribute("data-auth-logout-nav", "");
        logoutLink.hidden = true;
        nav.appendChild(logoutLink);
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

  function featuresAppOrigin() {
    var raw = typeof window.AIPER_FEATURES_APP_ORIGIN === "string" ? window.AIPER_FEATURES_APP_ORIGIN.trim() : "";
    return raw.replace(/\/+$/, "");
  }

  function normalizedAllowedFeatureUsernames() {
    var raw = window.AIPER_FEATURES_ALLOWED_USERNAMES;
    if (!Array.isArray(raw)) return [];
    return raw
      .map(function (name) {
        return String(name || "").trim().toLowerCase();
      })
      .filter(Boolean);
  }

  function normalizedAllowedFeatureEmails() {
    var raw = window.AIPER_FEATURES_ALLOWED_EMAILS;
    if (!Array.isArray(raw)) return [];
    return raw
      .map(function (email) {
        return String(email || "").trim().toLowerCase();
      })
      .filter(Boolean);
  }

  function userCandidateUsernames(user) {
    if (!user) return [];
    var candidates = [];
    var meta = user.user_metadata || {};
    if (meta.username) candidates.push(meta.username);
    if (meta.user_name) candidates.push(meta.user_name);
    if (user.email && user.email.indexOf("@") > 0) candidates.push(user.email.split("@")[0]);
    return candidates
      .map(function (name) {
        return String(name || "").trim().toLowerCase();
      })
      .filter(Boolean);
  }

  function isFeaturesAppUrl(next) {
    if (!next) return false;
    var allowedFeatures = featuresAppOrigin();
    if (!allowedFeatures) return false;
    try {
      var nextUrl = new URL(next);
      var allowedOrigin = new URL(allowedFeatures + "/").origin;
      return nextUrl.origin === allowedOrigin;
    } catch (_err) {
      return false;
    }
  }

  function attachFeaturesSessionTokens(nextUrl, session) {
    if (!isFeaturesAppUrl(nextUrl)) return nextUrl;
    if (!session || !session.access_token || !session.refresh_token) return nextUrl;
    try {
      var url = new URL(nextUrl);
      url.searchParams.set("sb_access_token", session.access_token);
      url.searchParams.set("sb_refresh_token", session.refresh_token);
      return url.toString();
    } catch (_err) {
      return nextUrl;
    }
  }

  function canCurrentUserAccessFeatures(user) {
    var emailAllowlist = normalizedAllowedFeatureEmails();
    var userEmail = user && user.email ? String(user.email).trim().toLowerCase() : "";
    if (emailAllowlist.length) {
      return !!userEmail && emailAllowlist.indexOf(userEmail) !== -1;
    }
    var allowlist = normalizedAllowedFeatureUsernames();
    if (!allowlist.length) return true;
    var userNames = userCandidateUsernames(user);
    return userNames.some(function (candidate) {
      return allowlist.indexOf(candidate) !== -1;
    });
  }

  function parseNextUrl(user) {
    var params = new URLSearchParams(window.location.search || "");
    var next = params.get("next");
    if (!next) return "/dashboard.html";
    if (next.startsWith("/")) return next;
    try {
      var url = new URL(next);
      var allowedFeatures = featuresAppOrigin();
      if (allowedFeatures) {
        var allowedOrigin = new URL(allowedFeatures + "/").origin;
        if (url.origin === allowedOrigin) {
          if (!canCurrentUserAccessFeatures(user)) {
            setStatus("Your account is not enabled for AI feature access yet.", "error");
            return null;
          }
          return url.toString();
        }
      }
      if (/^(localhost|127\.0\.0\.1)$/i.test(url.hostname) && (url.protocol === "http:" || url.protocol === "https:")) {
        return url.toString();
      }
      return "/dashboard.html";
    } catch (_err) {
      return "/dashboard.html";
    }
  }

  function applyFeaturesAppLinks() {
    var base = featuresAppOrigin();
    var nodes = document.querySelectorAll("a[data-require-auth][data-feature]");
    if (!base) {
      if (nodes.length) console.warn("Set AIPER_FEATURES_APP_ORIGIN in features-config.js so Product page feature links target your deployed app.");
      return;
    }
    nodes.forEach(function (a) {
      var f = a.getAttribute("data-feature");
      if (!f) return;
      var featureUrl = base + "/?feature=" + encodeURIComponent(f);
      a.setAttribute("href", "/login.html?next=" + encodeURIComponent(featureUrl));
    });
  }

  /** Links with data-require-auth: only signed-in users go to href; others go to login with ?next= for post-login redirect. */
  function bindProtectedFeatureLinks() {
    document.querySelectorAll("a[data-require-auth][href]").forEach(function (anchor) {
      anchor.addEventListener("click", function (e) {
        if (e.button !== 0) return;
        var targetUrl = anchor.getAttribute("href");
        if (!targetUrl || targetUrl === "#") return;
        var openInNewTab = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
        e.preventDefault();
        client.auth.getSession().then(function (sessionResult) {
          var user = sessionResult.data && sessionResult.data.session ? sessionResult.data.session.user : null;
          if (user) {
            // If href points to login trampoline, let it run: it will immediately redirect to ?next.
            if (openInNewTab) window.open(targetUrl, "_blank", "noopener,noreferrer");
            else window.location.href = targetUrl;
            return;
          }
          // If it's already a login trampoline, just go there; otherwise wrap it.
          var loginUrl = /^\/login\.html\?next=/i.test(targetUrl)
            ? targetUrl
            : "/login.html?next=" + encodeURIComponent(targetUrl);
          if (openInNewTab) window.open(loginUrl, "_blank", "noopener,noreferrer");
          else window.location.href = loginUrl;
        });
      });
    });
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
        var nextUrl = parseNextUrl(res.data.user);
        if (!nextUrl) return;
        nextUrl = attachFeaturesSessionTokens(nextUrl, res.data.session);
        setStatus("Signed in. Redirecting...", "ok");
        window.location.href = nextUrl;
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
    var rawName = (user && user.user_metadata && user.user_metadata.full_name) || "";
    var email = (user && user.email) || "";
    var emailLocal = email ? email.split("@")[0] : "";
    var baseName = rawName || emailLocal || "AIPER User";
    var firstName = String(baseName).trim().split(/\s+/)[0] || "AIPER User";
    var displayName = firstName
      .replace(/[._-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, function (ch) {
        return ch.toUpperCase();
      });

    setText("[data-user-email]", user && user.email ? user.email : "");
    setText("[data-user-name]", displayName || "AIPER User");
  }

  async function init() {
    ensureAuthNavElements();
    applyFeaturesAppLinks();
    var sessionResult = await client.auth.getSession();
    var user = sessionResult.data && sessionResult.data.session ? sessionResult.data.session.user : null;
    updateAuthNav(user);
    bindLogout();
    bindAuthForms();
    bindProtectedFeatureLinks();

    if (isLoginPage() && user) {
      var nextUrl = parseNextUrl(user);
      if (!nextUrl) return;
      nextUrl = attachFeaturesSessionTokens(nextUrl, sessionResult.data ? sessionResult.data.session : null);
      window.location.href = nextUrl;
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
