/**
 * Public origin of the deployed AI Document Intelligence SPA (Vite build), no trailing slash.
 * Set this to your GitHub Pages (or other) URL so Product page “Try feature” links resolve after login.
 * Example: https://your-username.github.io/your-repo-name
 */
window.AIPER_FEATURES_APP_ORIGIN =
  typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname)
    ? "http://localhost:5173"
    : "https://gregarious-heliotrope-8cbe50.netlify.app";

/**
 * Optional allowlist for AI feature access.
 * If AIPER_FEATURES_ALLOWED_EMAILS has values, access is matched by exact email.
 * Otherwise, username fallback below is used.
 * Leave both lists empty [] to allow any signed-in account.
 *
 * Keep in sync with ai_document_intelligence/frontend/src/lib/featuresAccess.ts
 */
window.AIPER_FEATURES_ALLOWED_EMAILS = [
  // Team
  "info.aiper.space@gmail.com",
  "devdesaiofficial@gmail.com",
  "paulina.draugelyte@community.isunet.edu",
  "lorenzo.dionigi.ld@gmail.com",
  "stefanodestro2@gmail.com",

  // External beta users
  "david.perillo@launcherscanner.com",
  "giacomobertolucci94@gmail.com",
  "diego.carubelli@argotecgroup.com",
  "gianmarco.reverberi@argotecgroup.com",
  "rabells@kepler.space",
  "franzrojasayala@outlook.com",
  "andrea.colombo@gmail.com",
  "federico.toller@live.it",
  "francescogiuseppealoisio@gmail.com",
  "matteo@launcherscanner.com",
  "r.a.matveev@gmail.com",
  "lorcanjkelleher@gmail.com",
  "ste.carcano98@gmail.com",
  "abhayrastogi13@gmail.com",
  "effy@parsecaero.space",
  "mail.giuseppenegro@gmail.com",
  "massimopiazza97@gmail.com",
  "jevgenijs@space-inventor.com",
];



/**
 * Optional fallback allowlist by username.
 * User "username" is matched against:
 * 1) user_metadata.username (if you store it in Supabase),
 * 2) otherwise the email local part before "@".
 */
window.AIPER_FEATURES_ALLOWED_USERNAMES = [
  // "alice",
  // "bob"
];
