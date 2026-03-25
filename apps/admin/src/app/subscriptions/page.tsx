'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiJson } from '@/lib/api';

type Sub = {
  id: string;
  status: string;
  planCode?: string;
  user: { username: string; email: string };
};

export default function SubscriptionsPage() {
  const [rows, setRows] = useState<Sub[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiJson<Sub[]>('/admin/subscriptions')
      .then(setRows)
      .catch((e) => setErr(String(e.message)));
  }, []);

  return (
    <main className="min-h-screen p-8 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex justify-between">
          <h1 className="text-2xl font-semibold">Subscriptions</h1>
          <Link href="/dashboard" className="text-emerald-400 hover:underline">
            Dashboard
          </Link>
        </div>
        {err && <p className="text-red-400">{err}</p>}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-slate-400">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-t border-slate-800">
                  <td className="p-3">
                    <div>{s.user.username}</div>
                    <div className="text-slate-500">{s.user.email}</div>
                  </td>
                  <td className="p-3">{s.planCode ?? '—'}</td>
                  <td className="p-3">{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
