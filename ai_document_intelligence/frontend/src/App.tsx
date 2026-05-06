import { useEffect, useMemo, useState } from 'react';
import { DocumentGeneratorPage } from './features/document-generator/DocumentGeneratorPage';
import { bootstrapSupabaseSessionFromUrl, getSupabaseClient } from './lib/supabase';

export default function App() {
  const [accessState, setAccessState] = useState<'checking' | 'allowed' | 'denied'>('checking');
  const [deniedMessage, setDeniedMessage] = useState('Your account is not enabled for this feature.');

  const allowedEmails = useMemo(() => {
    const raw = (import.meta.env.VITE_FEATURES_ALLOWED_EMAILS ?? '').trim();
    if (!raw) return [];
    return raw
      .split(',')
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      await bootstrapSupabaseSessionFromUrl();
      const sb = getSupabaseClient();
      if (!sb) {
        if (!alive) return;
        setDeniedMessage('Supabase configuration is missing for this app.');
        setAccessState('denied');
        return;
      }

      const { data, error } = await sb.auth.getUser();
      const user = data.user;
      const email = user?.email ? String(user.email).trim().toLowerCase() : '';
      const isAllowed = !!email && (!allowedEmails.length || allowedEmails.includes(email));

      if (!isAllowed || error) {
        await sb.auth.signOut();
        if (!alive) return;
        setDeniedMessage(
          email
            ? 'Your account is not enabled for AI feature access.'
            : 'Please sign in with an allowed account from the main website login page.',
        );
        setAccessState('denied');
        return;
      }

      if (!alive) return;
      setAccessState('allowed');
    })();
    return () => {
      alive = false;
    };
  }, [allowedEmails]);

  if (accessState === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-700">
        Checking access...
      </div>
    );
  }

  if (accessState === 'denied') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-xl rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Access denied</h1>
          <p className="mt-3 text-sm text-slate-600">{deniedMessage}</p>
        </div>
      </div>
    );
  }

  return <DocumentGeneratorPage />;
}
