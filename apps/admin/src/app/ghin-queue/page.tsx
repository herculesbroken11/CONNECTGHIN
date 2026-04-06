'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiJson } from '@/lib/api';
import { AdminShell } from '@/components/admin-shell';

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
    <AdminShell
      title="GHIN Verification Queue"
      subtitle="Users pending manual GHIN approval"
    >
      <div className="mx-auto w-full max-w-4xl">
        <p className="mb-4 text-slate-400">
          Users with profiles not yet marked GHIN-verified. Verify externally in GHIN, then approve here.
        </p>
        {err && <p className="text-red-400">{err}</p>}
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="admin-panel flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-medium">{r.profile?.displayName ?? r.username}</div>
                <div className="text-sm text-slate-500">{r.email}</div>
              </div>
              <Link
                href={`/users/${r.id}`}
                className="text-sm text-sky-300 hover:underline"
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
    </AdminShell>
  );
}
