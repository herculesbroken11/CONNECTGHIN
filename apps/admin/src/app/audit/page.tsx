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

  useEffect(() => {
    apiJson<Log[]>('/admin/audit-logs')
      .then(setRows)
      .catch((e) => setErr(String(e.message)));
  }, []);

  return (
    <AdminShell title="Audit Log" subtitle="Recent admin actions">
      <div className="mx-auto w-full max-w-5xl">
        {err && <p className="text-red-400">{err}</p>}
        <ul className="space-y-2 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="admin-panel-muted px-3 py-2.5">
              <span className="text-sky-300">{r.actionType}</span>
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
    </AdminShell>
  );
}
