'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiJson } from '@/lib/api';

type Log = {
  id: string;
  actionType: string;
  targetUserId?: string;
  createdAt: string;
  adminUser: { username: string; email: string };
};

export default function AuditPage() {
  const [rows, setRows] = useState<Log[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiJson<Log[]>('/admin/audit-logs')
      .then(setRows)
      .catch((e) => setErr(String(e.message)));
  }, []);

  return (
    <main className="min-h-screen p-8 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex justify-between">
          <h1 className="text-2xl font-semibold">Audit log</h1>
          <Link href="/dashboard" className="text-emerald-400 hover:underline">
            Dashboard
          </Link>
        </div>
        {err && <p className="text-red-400">{err}</p>}
        <ul className="space-y-2 text-sm">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2"
            >
              <span className="text-emerald-400">{r.actionType}</span>
              {r.targetUserId && (
                <span className="text-slate-500"> → {r.targetUserId}</span>
              )}
              <span className="ml-2 text-slate-500">
                by {r.adminUser.username}
              </span>
              <span className="ml-2 text-slate-600">
                {new Date(r.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
