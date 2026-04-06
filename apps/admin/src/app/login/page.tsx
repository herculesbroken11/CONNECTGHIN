'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? 'Login failed');
        return;
      }
      localStorage.setItem('cg_admin_access', data.accessToken);
      localStorage.setItem('cg_admin_refresh', data.refreshToken);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="admin-panel w-full max-w-sm space-y-4 p-6"
      >
        <h1 className="text-xl font-semibold">Admin login</h1>
        {error && (
          <p className="rounded-md bg-red-950/80 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}
        <div>
          <label className="block text-sm text-slate-400">Email</label>
          <input
            type="email"
            className="admin-input mt-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400">Password</label>
          <input
            type="password"
            className="admin-input mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="admin-button admin-button-primary w-full disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
