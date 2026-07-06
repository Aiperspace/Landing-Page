/** Keep in sync with features-config.js (AIPER_FEATURES_ALLOWED_EMAILS). */
export const DEFAULT_FEATURES_ALLOWED_EMAILS = [
  // Team
  'info.aiper.space@gmail.com',
  'devdesaiofficial@gmail.com',
  'paulina.draugelyte@community.isunet.edu',
  'lorenzo.dionigi.ld@gmail.com',
  'stefanodestro2@gmail.com',

  // External beta users
  'david.perillo@launcherscanner.com',
  'giacomobertolucci94@gmail.com',
  'diego.carubelli@argotecgroup.com',
  'gianmarco.reverberi@argotecgroup.com',
  'rabells@kepler.space',
  'franzrojasayala@outlook.com',
  'andrea.colombo@gmail.com',
  'federico.toller@live.it',
  'francescogiuseppealoisio@gmail.com',
  'matteo@launcherscanner.com',
  'r.a.matveev@gmail.com',
  'lorcanjkelleher@gmail.com',
  'ste.carcano98@gmail.com',
  'abhayrastogi13@gmail.com',
  'effy@parsecaero.space',
  'mail.giuseppenegro@gmail.com',
  'massimopiazza97@gmail.com',
  'jevgenijs@space-inventor.com',
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
