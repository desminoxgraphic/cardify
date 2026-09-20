'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2 } from 'lucide-react';

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
    <div className="min-h-dvh flex items-center justify-center p-4 bg-[#F8FAFC]">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl border border-[#E2E8F0]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#2563EB]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#2563EB]">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A]">CARDIFY Admin</h1>
          <p className="text-xs text-[#64748B] mt-1">Management Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
              Admin Password
            </label>
            <input
              type="password"
              placeholder="Enter password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-[#DC2626] border border-red-200 rounded-xl text-xs font-semibold text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2563EB] hover:bg-blue-700 active:scale-[0.98] text-white font-semibold py-3 px-4 rounded-xl transition-all text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-75"
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