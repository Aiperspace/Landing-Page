import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';

/** Subscribes to the current Supabase user. Returns null while loading or when signed out. */
export function useCurrentUser(): User | null {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) return;

    let alive = true;

    sb.auth.getUser().then(({ data }) => {
      if (alive) setUser(data.user ?? null);
    });

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (alive) setUser(session?.user ?? null);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return user;
}

/** Compute up-to-2-character initials from full_name, then email. */
export function computeInitials(user: User | null | undefined): string {
  if (!user) return '?';

  const metadataName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    '';

  const trimmed = metadataName.trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    const only = parts[0] ?? '';
    return ((only[0] ?? '') + (only[1] ?? '')).toUpperCase();
  }

  const email = user.email ?? '';
  if (email) {
    const local = email.split('@')[0] ?? '';
    const parts = local.split(/[^a-zA-Z]+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return local.slice(0, 2).toUpperCase();
  }

  return '?';
}

/** Best-effort display name for tooltips / greetings. */
export function computeDisplayName(user: User | null | undefined): string {
  if (!user) return 'Profile';
  const meta =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined);
  return (meta && meta.trim()) || user.email || 'Profile';
}
