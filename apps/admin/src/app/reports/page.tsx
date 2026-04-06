'use client';

import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';
import { AdminShell } from '@/components/admin-shell';

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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'OPEN' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED'
  >('all');

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

  const filteredRows = rows.filter((r) => {
    const statusMatch = statusFilter === 'all' || r.status === statusFilter;
    const text = `${r.reason} ${r.details ?? ''} ${r.reportedByUser.username} ${r.targetUser.username}`.toLowerCase();
    const searchMatch = !search || text.includes(search.toLowerCase());
    return statusMatch && searchMatch;
  });

  return (
    <AdminShell title="Reports" subtitle="Moderate user reports and safety actions.">
      <div className="mx-auto w-full max-w-6xl">
        <p className="mb-2 text-xs text-slate-500">Dashboard / Reports</p>

        <div className="admin-panel p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900/60 p-1 text-xs">
              <TabButton active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
                All
              </TabButton>
              <TabButton active={statusFilter === 'OPEN'} onClick={() => setStatusFilter('OPEN')}>
                Open
              </TabButton>
              <TabButton
                active={statusFilter === 'REVIEWED'}
                onClick={() => setStatusFilter('REVIEWED')}
              >
                Reviewed
              </TabButton>
              <TabButton
                active={statusFilter === 'RESOLVED'}
                onClick={() => setStatusFilter('RESOLVED')}
              >
                Resolved
              </TabButton>
              <TabButton
                active={statusFilter === 'DISMISSED'}
                onClick={() => setStatusFilter('DISMISSED')}
              >
                Dismissed
              </TabButton>
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
            placeholder="Search reason, reporter, target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {err && <p className="mb-2 text-sm text-red-400">{err}</p>}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="p-3">Report</th>
                  <th className="p-3">Reporter</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => (
                  <tr key={r.id}>
                    <td className="p-3">
                      <p className="font-medium">{r.reason}</p>
                      {r.details ? <p className="text-xs text-slate-500">{r.details}</p> : null}
                    </td>
                    <td className="p-3">
                      <p className="text-sm">{r.reportedByUser.username}</p>
                      <p className="text-xs text-slate-500">{r.reportedByUser.email}</p>
                    </td>
                    <td className="p-3">
                      <p className="text-sm">{r.targetUser.username}</p>
                      <p className="text-xs text-slate-500">{r.targetUser.email}</p>
                    </td>
                    <td className="p-3">
                      <span className="rounded-full border border-slate-700 px-2 py-1 text-xs">
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          className="admin-button px-2 py-1 text-xs"
                          onClick={() => review(r.id, 'REVIEWED')}
                        >
                          Review
                        </button>
                        <button
                          type="button"
                          className="admin-button admin-button-primary px-2 py-1 text-xs"
                          onClick={() => review(r.id, 'RESOLVED')}
                        >
                          Resolve
                        </button>
                        <button
                          type="button"
                          className="admin-button px-2 py-1 text-xs"
                          onClick={() => review(r.id, 'DISMISSED')}
                        >
                          Dismiss
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-500">
                      No reports match current filters.
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

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'rounded-md bg-emerald-500/20 px-3 py-1.5 text-emerald-200'
          : 'rounded-md px-3 py-1.5 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
      }
    >
      {children}
    </button>
  );
}
