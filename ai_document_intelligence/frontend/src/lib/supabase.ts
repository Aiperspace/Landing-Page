import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

function getEnv(name: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY'): string {
  const value = import.meta.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

export function getSupabaseClient(): SupabaseClient | null {
  if (client) return client;
  const url = getEnv('VITE_SUPABASE_URL');
  const anonKey = getEnv('VITE_SUPABASE_ANON_KEY');
  if (!url || !anonKey) return null;
  client = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return client;
}

export async function bootstrapSupabaseSessionFromUrl(): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) return;

  const url = new URL(window.location.href);
  const accessToken = url.searchParams.get('sb_access_token');
  const refreshToken = url.searchParams.get('sb_refresh_token');
  if (!accessToken || !refreshToken) return;

  await sb.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  url.searchParams.delete('sb_access_token');
  url.searchParams.delete('sb_refresh_token');
  window.history.replaceState({}, '', url.pathname + url.search + url.hash);
}
