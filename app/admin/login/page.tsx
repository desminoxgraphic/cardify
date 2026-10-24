'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

const LOGIN_TIMEOUT_MS = 12000;

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), LOGIN_TIMEOUT_MS);

    try {
      let res: Response;
      try {
        res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
          signal: controller.signal,
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          setError('Login request timed out. Please try again.');
        } else {
          setError('Unable to reach the login service. Please try again.');
        }
        return;
      }

      let data: { success?: boolean; error?: string } | null = null;
      try {
        if (res.headers.get('content-type')?.includes('application/json')) {
          data = await res.json();
        }
      } catch {
        data = null;
      }

      if (!res.ok || !data?.success) {
        setError(data?.error || 'Login failed. Please try again.');
        return;
      }

      router.push('/admin');
      router.refresh();
      window.setTimeout(() => {
        if (window.location.pathname === '/admin/login') {
          window.location.href = '/admin';
        }
      }, 1200);
    } catch (err) {
      setError('An error occurred during login.');
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh flex items-center justify-center p-4 bg-ink-950 overflow-hidden">
      <div aria-hidden className="absolute -top-40 -left-32 w-[520px] h-[520px] rounded-full bg-gold-400/25 blur-3xl" />
      <div aria-hidden className="absolute -bottom-40 -right-32 w-[480px] h-[480px] rounded-full bg-gold-600/10 blur-3xl" />
      <svg aria-hidden className="absolute -right-24 top-10 w-[460px] h-[460px] opacity-[0.08]" viewBox="0 0 200 200" fill="none" stroke="white" strokeWidth="1">
        {[30, 50, 70, 90].map((r) => <circle key={r} cx="100" cy="100" r={r} />)}
      </svg>
      <div aria-hidden className="absolute inset-0 bv-grain" />

      <div className="relative w-full max-w-sm bv-sheet-up">
        <div className="text-center mb-7 text-white">
          <span className="mx-auto w-[72px] h-[72px] rounded-[22px] bg-gradient-to-b from-white to-slate-200 flex items-center justify-center shadow-[0_4px_0_rgba(0,0,0,0.35),0_24px_40px_-14px_rgba(245,197,66,0.45)]">
            <Image src="/boostov-logo.png" alt="boostov.ma logo" width={52} height={52} priority />
          </span>
          <h1 className="mt-5 text-[28px] font-extrabold tracking-[-0.02em]">boostov<span className="text-[#60A5FA]">.ma</span> Admin</h1>
          <p className="text-sm text-white/55 mt-1">Management Portal</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-[28px] p-6 sm:p-7 shadow-[0_30px_60px_-24px_rgba(0,0,0,0.7)] space-y-4">
          <div>
            <label htmlFor="admin-password" className="block text-[13px] font-bold text-ink-950 mb-1.5">
              Admin Password
            </label>
            <input
              id="admin-password"
              type="password"
              placeholder="Enter password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full min-h-[52px] px-4 rounded-2xl border border-ink-200 bg-ivory-50 text-ink-950 text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
            />
          </div>

          {error && (
            <div role="alert" className="p-3 bg-red-50 text-danger-600 border border-red-200 rounded-xl text-sm font-semibold text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bv-btn3d w-full min-h-[54px] rounded-2xl text-base font-bold text-ink-950 bg-gold hover:brightness-105 flex items-center justify-center gap-2 disabled:opacity-75 [--bv-edge:#9A6A0E] [--bv-glow:rgba(245,197,66,0.55)]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
