/**
 * Public origin of the deployed AI Document Intelligence SPA (Vite build), no trailing slash.
 * Set this to your GitHub Pages (or other) URL so Product page “Try feature” links resolve after login.
 * Example: https://your-username.github.io/your-repo-name
 */
window.AIPER_FEATURES_APP_ORIGIN = "https://roaring-tapioca-5735bc.netlify.app";

/**
 * Optional allowlist for AI feature access.
 * If AIPER_FEATURES_ALLOWED_EMAILS has values, access is matched by exact email.
 * Otherwise, username fallback below is used.
 * Leave both lists empty [] to allow any signed-in account.
 */
window.AIPER_FEATURES_ALLOWED_EMAILS = [
  "info.aiper.space@gmail.com",
  "stefanodestro2@gmail.com",
  "demo1@aiper.space",
  "demo2@aiper.space",
  "demo3@aiper.space",
  "demo4@aiper.space"
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
