'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiJson } from '@/lib/api';

type Row = {
  id: string;
  email: string;
  username: string;
  profile: { displayName: string; isGHINVerified: boolean };
};

export default function GhinQueuePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiJson<Row[]>('/admin/users/ghin-queue')
      .then(setRows)
      .catch((e) => setErr(String(e.message)));
  }, []);

  return (
    <main className="min-h-screen p-8 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex justify-between">
          <h1 className="text-2xl font-semibold">GHIN verification queue</h1>
          <Link href="/dashboard" className="text-emerald-400 hover:underline">
            Dashboard
          </Link>
        </div>
        <p className="mb-4 text-slate-400">
          Users with profiles not yet marked GHIN-verified. Verify externally in GHIN, then approve here.
        </p>
        {err && <p className="text-red-400">{err}</p>}
        <ul className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3"
            >
              <div>
                <div className="font-medium">{r.profile?.displayName ?? r.username}</div>
                <div className="text-sm text-slate-500">{r.email}</div>
              </div>
              <Link
                href={`/users/${r.id}`}
                className="text-sm text-emerald-400 hover:underline"
              >
                Open →
              </Link>
            </li>
          ))}
        </ul>
        {rows.length === 0 && !err && (
          <p className="mt-8 text-slate-500">Queue is empty.</p>
        )}
      </div>
    </main>
  );
}
