'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string>('admin_login');
  const [password, setPassword] = useState<string>('admin@login.123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      <Header />

      <main className="flex-1 max-w-md mx-auto px-4 py-16 flex flex-col justify-center w-full">
        <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-xs">
          <div className="mb-6 border-b border-neutral-100 pb-4">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">Administrator Portal</h1>
            <p className="text-xs text-neutral-500 mt-1">Sign in to access event controls and live monitoring.</p>
          </div>

          {error && (
            <div className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Quick Credential Hint */}
          <div className="mb-5 rounded-lg border border-neutral-200 bg-neutral-50 p-3.5 text-xs text-neutral-700 font-mono">
            <div className="font-bold text-neutral-900 mb-1 flex items-center justify-between">
              <span>🔑 Default Admin Credentials</span>
              <button
                type="button"
                onClick={() => {
                  setUsername('admin_login');
                  setPassword('admin@login.123');
                }}
                className="text-[10px] bg-neutral-200 hover:bg-neutral-300 px-2 py-0.5 rounded text-neutral-800 font-sans font-medium"
              >
                Autofill
              </button>
            </div>
            <div>Username: <span className="font-bold text-neutral-900">admin_login</span></div>
            <div>Password: <span className="font-bold text-neutral-900">admin@login.123</span></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                User ID / Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin_login"
                className="w-full rounded-md border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin@login.123"
                className="w-full rounded-md border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rounded-md bg-neutral-900 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In as Admin →'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
