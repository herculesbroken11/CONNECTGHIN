'use client';

import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';
import { AdminShell } from '@/components/admin-shell';

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
    <AdminShell title="App Settings" subtitle="JSON-backed runtime configuration">
      <div className="mx-auto w-full max-w-3xl">
        <p className="mb-4 text-slate-400">
          Values are JSON. Keys match seed defaults:{' '}
          <code className="text-slate-300">free_daily_swipe_limit</code>,{' '}
          <code className="text-slate-300">premium_direct_messaging_enabled</code>, etc.
        </p>
        {err && <p className="text-red-400">{err}</p>}
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.id} className="admin-panel p-4">
              <div className="font-mono text-sm text-sky-300">{r.key}</div>
              <textarea
                className="admin-input mt-2 font-mono"
                rows={2}
                defaultValue={r.valueJson}
                onChange={(e) =>
                  setEditing((x) => ({ ...x, [r.key]: e.target.value }))
                }
              />
              <button
                type="button"
                className="admin-button admin-button-primary mt-2 text-sm"
                onClick={() => save(r.key, r.valueJson)}
              >
                Save
              </button>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
