'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiJson } from '@/lib/api';

type Setting = { id: string; key: string; valueJson: string };

export default function AppSettingsPage() {
  const [rows, setRows] = useState<Setting[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, string>>({});

  const load = () => {
    apiJson<Setting[]>('/admin/settings')
      .then(setRows)
      .catch((e) => setErr(String(e.message)));
  };

  useEffect(() => {
    load();
  }, []);

  async function save(key: string, fallback: string) {
    const raw = editing[key] ?? fallback;
    try {
      const value = JSON.parse(raw);
      await apiJson(`/admin/settings/${encodeURIComponent(key)}`, {
        method: 'PATCH',
        body: JSON.stringify({ value }),
      });
      setEditing((e) => {
        const n = { ...e };
        delete n[key];
        return n;
      });
      load();
    } catch (e) {
      setErr(String((e as Error).message));
    }
  }

  return (
    <main className="min-h-screen p-8 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex justify-between">
          <h1 className="text-2xl font-semibold">App settings</h1>
          <Link href="/dashboard" className="text-emerald-400 hover:underline">
            Dashboard
          </Link>
        </div>
        <p className="mb-4 text-slate-400">
          Values are JSON. Keys match seed defaults:{' '}
          <code className="text-slate-300">free_daily_swipe_limit</code>,{' '}
          <code className="text-slate-300">premium_direct_messaging_enabled</code>, etc.
        </p>
        {err && <p className="text-red-400">{err}</p>}
        <div className="space-y-4">
          {rows.map((r) => (
            <div
              key={r.id}
              className="rounded-lg border border-slate-800 bg-slate-900/60 p-4"
            >
              <div className="font-mono text-sm text-emerald-400">{r.key}</div>
              <textarea
                className="mt-2 w-full rounded border border-slate-700 bg-slate-950 p-2 font-mono text-sm"
                rows={2}
                defaultValue={r.valueJson}
                onChange={(e) =>
                  setEditing((x) => ({ ...x, [r.key]: e.target.value }))
                }
              />
              <button
                type="button"
                className="mt-2 rounded bg-emerald-800 px-3 py-1 text-sm"
                onClick={() => save(r.key, r.valueJson)}
              >
                Save
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
