'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiJson } from '@/lib/api';

export default function UserDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => {
    setErr(null);
    apiJson<Record<string, unknown>>(`/admin/users/${id}`)
      .then(setUser)
      .catch((e) => setErr(String(e.message)));
  };

  useEffect(() => {
    load();
  }, [id]);

  async function act(
    suffix: string,
    method: string,
    body?: Record<string, unknown>,
  ) {
    setMsg(null);
    try {
      await apiJson(`/admin/users/${id}${suffix}`, {
        method,
        body: body ? JSON.stringify(body) : undefined,
      });
      setMsg('Saved');
      load();
    } catch (e: unknown) {
      setMsg(String((e as Error).message));
    }
  }

  if (!user && !err) {
    return (
      <main className="p-8 text-slate-100">
        <p>Loading…</p>
      </main>
    );
  }

  const profile = user?.profile as Record<string, unknown> | undefined;

  return (
    <main className="min-h-screen p-8 text-slate-100">
      <div className="mx-auto max-w-2xl">
        <Link href="/users" className="text-sm text-emerald-400 hover:underline">
          ← Users
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">
          {(user?.username as string) ?? id}
        </h1>
        {err && <p className="mt-2 text-red-400">{err}</p>}
        {msg && <p className="mt-2 text-slate-400">{msg}</p>}
        <p className="mt-2 text-slate-400">{user?.email as string}</p>
        <p className="text-slate-400">
          GHIN verified: {profile?.isGHINVerified ? 'Yes' : 'No'}
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg bg-amber-700 px-4 py-2 text-sm"
            onClick={() => act('/suspend', 'PATCH', { reason: 'Admin suspend' })}
          >
            Suspend
          </button>
          <button
            type="button"
            className="rounded-lg bg-red-800 px-4 py-2 text-sm"
            onClick={() => act('/ban', 'PATCH', { reason: 'Admin ban' })}
          >
            Ban
          </button>
          <button
            type="button"
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm"
            onClick={() => act('/restore', 'PATCH')}
          >
            Restore
          </button>
          <button
            type="button"
            className="rounded-lg bg-emerald-800 px-4 py-2 text-sm"
            onClick={() => act('/verify-ghin', 'PATCH')}
          >
            Verify GHIN
          </button>
        </div>
      </div>
    </main>
  );
}
