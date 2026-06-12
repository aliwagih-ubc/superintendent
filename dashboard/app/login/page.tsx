'use client';
import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const sendLink = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setSent(true);
  }, [email]);

  const signInGoogle = useCallback(() => {
    const supabase = createClient();
    void supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-xl font-bold text-[var(--color-accent)]">Superintendent</h1>
        <p className="text-[var(--color-muted)]">Sign in to view the dashboard.</p>
        {sent ? (
          <p className="text-[var(--color-good)]">Check your email for a sign-in link.</p>
        ) : (
          <>
            <input
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-3 py-2"
              type="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
            <button onClick={sendLink} className="bg-[var(--color-accent)] text-black rounded px-3 py-2 font-medium">
              Email me a sign-in link
            </button>
            <button onClick={signInGoogle}
              className="border border-[var(--color-border)] rounded px-3 py-2">
              Continue with Google
            </button>
          </>
        )}
      </div>
    </main>
  );
}
