/** Keep in sync with features-config.js (AIPER_FEATURES_ALLOWED_EMAILS). */
export const DEFAULT_FEATURES_ALLOWED_EMAILS = [
  'info.aiper.space@gmail.com',
  'stefanodestro2@gmail.com',
];

export function parseAllowedFeatureEmails(raw: string | undefined): string[] {
  const trimmed = (raw ?? '').trim();
  if (trimmed) {
    return trimmed
      .split(',')
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);
  }
  return DEFAULT_FEATURES_ALLOWED_EMAILS.map((email) => email.toLowerCase());
}
