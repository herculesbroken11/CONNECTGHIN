'use client';

import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';
import { AdminShell } from '@/components/admin-shell';

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
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiJson<Log[]>('/admin/audit-logs')
      .then(setRows)
      .catch((e) => setErr(String(e.message)));
  }, []);

  const filteredRows = rows.filter((r) => {
    const text = `${r.actionType} ${r.targetUserId ?? ''} ${r.adminUser.username} ${r.adminUser.email}`.toLowerCase();
    return !search || text.includes(search.toLowerCase());
  });

  return (
    <AdminShell title="Audit Log" subtitle="Track all admin actions and accountability.">
      <div className="mx-auto w-full max-w-6xl">
        <p className="mb-2 text-xs text-slate-500">Dashboard / Audit Log</p>
        <div className="admin-panel p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900/60 p-1 text-xs">
              <button type="button" className="rounded-md bg-emerald-500/20 px-3 py-1.5 text-emerald-200">
                Recent
              </button>
            </div>
            <div className="flex gap-2">
              <button type="button" className="admin-button text-xs">
                Columns
              </button>
              <button type="button" className="admin-button text-xs">
                Export
              </button>
            </div>
          </div>

          <input
            type="search"
            className="admin-input mb-3"
            placeholder="Search action, admin, target user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {err && <p className="mb-2 text-red-400">{err}</p>}

          <div className="admin-table-wrap">
            <table className="admin-table min-w-[760px]">
              <thead>
                <tr>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Admin</th>
                  <th className="p-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => (
                  <tr key={r.id}>
                    <td className="p-3">
                      <span className="rounded-full border border-slate-700 px-2 py-1 text-xs">
                        {r.actionType}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{r.targetUserId ?? '—'}</td>
                    <td className="p-3">
                      <p>{r.adminUser.username}</p>
                      <p className="text-xs text-slate-500">{r.adminUser.email}</p>
                    </td>
                    <td className="p-3 text-slate-400">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-500">
                      No audit logs match current filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
