// Keeps the free-tier Supabase project from auto-pausing.
//
// The project pauses after ~7 days without database activity. What matters for
// pause-prevention is that the project is awake and serving requests, so we hit
// the REST API daily. We try a real table query first (best case: an actual
// query runs in Postgres); if the table isn't in PostgREST's schema cache yet
// — common for a few minutes right after a manual restore — any HTTP response
// still proves the project is up and counts. Only a network-level failure
// (paused/unreachable host) is treated as a failure.
//
// URL + anon key default to the public values already committed in
// supabase-config.js; override with env vars if the project ever moves.

const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://yhgixboluietgtuioknl.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZ2l4Ym9sdWlldGd0dWlva25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NzI1NDAsImV4cCI6MjA5MjQ0ODU0MH0.SEhDAm-9BwMFxB0aayelzi2t5CnZ4bgblO9yFYJ_7C4';

const base = SUPABASE_URL.replace(/\/$/, '');
const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};
const stamp = new Date().toISOString();

try {
  // Prefer a real table query. If the table isn't in the schema cache, fall back
  // to the REST root — either way we get an HTTP response from a live project.
  let res = await fetch(`${base}/rest/v1/profiles?select=id&limit=1`, { headers });
  if (res.status === 404) {
    res = await fetch(`${base}/rest/v1/`, { headers });
  }

  // Any HTTP response means the project is awake and processed our request.
  // A 5xx would mean the API itself is unhealthy — worth surfacing.
  if (res.status >= 500) {
    const body = await res.text();
    console.error(`[${stamp}] keep-alive FAILED: HTTP ${res.status} ${body.slice(0, 200)}`);
    process.exit(1);
  }

  console.log(`[${stamp}] keep-alive OK: project awake (HTTP ${res.status})`);
} catch (err) {
  const code = err.cause?.code || err.code || '';
  console.error(`[${stamp}] keep-alive ERROR: ${err.message}${code ? ` (${code})` : ''}`);
  if (code === 'ENOTFOUND' || code === 'ECONNREFUSED') {
    console.error(
      'The host did not respond. The project is likely PAUSED or the URL is wrong. ' +
        'A paused free-tier project must be restored once from the Supabase dashboard ' +
        '(this job only PREVENTS pausing, it cannot wake a sleeping project).',
    );
  }
  process.exit(1);
}
