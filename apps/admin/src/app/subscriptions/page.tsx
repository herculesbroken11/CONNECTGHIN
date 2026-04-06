'use client';

import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';
import { AdminShell } from '@/components/admin-shell';

type Sub = {
  id: string;
  status: string;
  planCode?: string;
  user: { username: string; email: string };
};

export default function SubscriptionsPage() {
  const [rows, setRows] = useState<Sub[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'trialing' | 'canceled' | 'other'
  >('all');

  useEffect(() => {
    apiJson<Sub[]>('/admin/subscriptions')
      .then(setRows)
      .catch((e) => setErr(String(e.message)));
  }, []);

  const filteredRows = rows.filter((s) => {
    const status = s.status.toUpperCase();
    const normalized =
      status === 'ACTIVE'
        ? 'active'
        : status === 'TRIALING'
          ? 'trialing'
          : status === 'CANCELED'
            ? 'canceled'
            : ('other' as const);
    const statusMatch = statusFilter === 'all' || statusFilter === normalized;
    const text = `${s.user.username} ${s.user.email} ${s.planCode ?? ''} ${s.status}`.toLowerCase();
    const searchMatch = !search || text.includes(search.toLowerCase());
    return statusMatch && searchMatch;
  });

  return (
    <AdminShell title="Subscriptions" subtitle="Track plans, billing state, and account access.">
      <div className="mx-auto w-full max-w-6xl">
        <p className="mb-2 text-xs text-slate-500">Dashboard / Subscriptions</p>

        <div className="admin-panel p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900/60 p-1 text-xs">
              <TabButton active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
                All
              </TabButton>
              <TabButton
                active={statusFilter === 'active'}
                onClick={() => setStatusFilter('active')}
              >
                Active
              </TabButton>
              <TabButton
                active={statusFilter === 'trialing'}
                onClick={() => setStatusFilter('trialing')}
              >
                Trialing
              </TabButton>
              <TabButton
                active={statusFilter === 'canceled'}
                onClick={() => setStatusFilter('canceled')}
              >
                Canceled
              </TabButton>
              <TabButton active={statusFilter === 'other'} onClick={() => setStatusFilter('other')}>
                Other
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
            placeholder="Search user, email, plan, status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {err && <p className="mb-2 text-red-400">{err}</p>}

          <div className="admin-table-wrap">
            <table className="admin-table min-w-[760px]">
              <thead>
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Provider Status</th>
                  <th className="p-3">Access</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((s) => (
                  <tr key={s.id}>
                    <td className="p-3">
                      <div>{s.user.username}</div>
                      <div className="text-slate-500">{s.user.email}</div>
                    </td>
                    <td className="p-3">
                      <span className="rounded-full border border-slate-700 px-2 py-1 text-xs">
                        {s.planCode ?? 'FREE'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{s.status}</td>
                    <td className="p-3">
                      {s.status.toUpperCase() === 'ACTIVE' || s.status.toUpperCase() === 'TRIALING' ? (
                        <span className="text-emerald-400">Premium</span>
                      ) : (
                        <span className="text-slate-500">Free</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-500">
                      No subscriptions match current filters.
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
