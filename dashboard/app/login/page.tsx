'use client';
import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInPassword = useCallback(async () => {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      return;
    }
    window.location.href = '/';
  }, [email, password]);

  const sendLink = useCallback(async () => {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      return;
    }
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
        {error ? <p className="text-[var(--color-bad)] text-sm">{error}</p> : null}
        {sent ? (
          <p className="text-[var(--color-good)]">Check your email for a sign-in link.</p>
        ) : (
          <>
            <input
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-3 py-2"
              type="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-3 py-2"
              type="password" placeholder="password"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={signInPassword} className="bg-[var(--color-accent)] text-black rounded px-3 py-2 font-medium">
              Sign in
            </button>
            <div className="text-[var(--color-muted)] text-xs text-center">or</div>
            <button onClick={sendLink} className="border border-[var(--color-border)] rounded px-3 py-2">
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
