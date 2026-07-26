// Keeps the free-tier Supabase project from auto-pausing.
//
// The project pauses after ~7 days without database activity. Dashboard visits
// and auth-only calls do NOT count — it has to be a real query against a table.
// A PostgREST select runs a query in Postgres even when RLS returns no rows,
// which is enough to keep the project marked active. We run this daily so
// there's plenty of margin.
//
// URL + anon key default to the public values already committed in
// supabase-config.js; override with env vars if the project ever moves.

const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://yhgixboluietgtuioknl.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZ2l4Ym9sdWlldGd0dWlva25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NzI1NDAsImV4cCI6MjA5MjQ0ODU0MH0.SEhDAm-9BwMFxB0aayelzi2t5CnZ4bgblO9yFYJ_7C4';

// Any real table works — the query hitting Postgres is the point, not the rows.
const endpoint = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/profiles?select=id&limit=1`;

const stamp = new Date().toISOString();

try {
  const res = await fetch(endpoint, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[${stamp}] keep-alive FAILED: HTTP ${res.status} ${body.slice(0, 200)}`);
    process.exit(1);
  }

  console.log(`[${stamp}] keep-alive OK: HTTP ${res.status}`);
} catch (err) {
  console.error(`[${stamp}] keep-alive ERROR: ${err.message}`);
  process.exit(1);
}
