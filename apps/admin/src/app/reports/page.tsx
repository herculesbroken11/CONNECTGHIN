'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiJson } from '@/lib/api';

type Report = {
  id: string;
  reason: string;
  details?: string;
  status: string;
  reportedByUser: { username: string; email: string };
  targetUser: { username: string; email: string };
};

export default function ReportsPage() {
  const [rows, setRows] = useState<Report[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiJson<Report[]>('/admin/reports')
      .then(setRows)
      .catch((e) => setErr(String(e.message)));
  }, []);

  async function review(id: string, status: string) {
    try {
      await apiJson(`/admin/reports/${id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r)),
      );
    } catch (e) {
      setErr(String((e as Error).message));
    }
  }

  return (
    <main className="min-h-screen p-8 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex justify-between">
          <h1 className="text-2xl font-semibold">Reports</h1>
          <Link href="/dashboard" className="text-emerald-400 hover:underline">
            Dashboard
          </Link>
        </div>
        {err && <p className="text-red-400">{err}</p>}
        <div className="space-y-4">
          {rows.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <div className="text-sm text-slate-400">
                From <span className="text-slate-200">{r.reportedByUser.username}</span>{' '}
                → target{' '}
                <span className="text-slate-200">{r.targetUser.username}</span>
              </div>
              <p className="mt-2 font-medium">{r.reason}</p>
              {r.details && (
                <p className="mt-1 text-sm text-slate-400">{r.details}</p>
              )}
              <p className="mt-2 text-xs uppercase text-slate-500">{r.status}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded bg-slate-700 px-3 py-1 text-xs"
                  onClick={() => review(r.id, 'REVIEWED')}
                >
                  Mark reviewed
                </button>
                <button
                  type="button"
                  className="rounded bg-emerald-900 px-3 py-1 text-xs"
                  onClick={() => review(r.id, 'RESOLVED')}
                >
                  Resolve
                </button>
                <button
                  type="button"
                  className="rounded bg-slate-800 px-3 py-1 text-xs"
                  onClick={() => review(r.id, 'DISMISSED')}
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
