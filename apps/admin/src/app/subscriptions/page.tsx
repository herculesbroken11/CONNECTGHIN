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

  useEffect(() => {
    apiJson<Sub[]>('/admin/subscriptions')
      .then(setRows)
      .catch((e) => setErr(String(e.message)));
  }, []);

  return (
    <AdminShell title="Subscriptions" subtitle="Plan and status overview">
      <div className="mx-auto w-full max-w-5xl">
        {err && <p className="text-red-400">{err}</p>}
        <div className="admin-table-wrap">
          <table className="admin-table min-w-[640px]">
            <thead>
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
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
    </AdminShell>
  );
}
