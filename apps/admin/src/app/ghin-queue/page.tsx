'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiJson } from '@/lib/api';
import { AdminShell } from '@/components/admin-shell';

type Row = {
  id: string;
  email: string;
  username: string;
  profile: {
    displayName: string;
    isGHINVerified: boolean;
    ghinVerificationRequestedAt?: string | null;
    ghinVerificationRequestNote?: string | null;
  };
};

function formatRequestedAt(iso: string | null | undefined) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return '—';
  }
}

export default function GhinQueuePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiJson<Row[]>('/admin/users/ghin-queue')
      .then(setRows)
      .catch((e) => setErr(String(e.message)));
  }, []);

  const filteredRows = rows.filter((r) => {
    const text = `${r.profile?.displayName ?? ''} ${r.username} ${r.email}`.toLowerCase();
    return !search || text.includes(search.toLowerCase());
  });

  return (
    <AdminShell
      title="GHIN Verification Queue"
      subtitle="Users pending manual GHIN approval"
    >
      <div className="mx-auto w-full max-w-6xl">
        <p className="mb-2 text-xs text-slate-500">Dashboard / GHIN Queue</p>
        <p className="mb-3 text-slate-400">
          Users with profiles not yet marked GHIN-verified. Verify externally in GHIN, then approve here.
        </p>
        <div className="admin-panel p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900/60 p-1 text-xs">
              <button type="button" className="rounded-md bg-emerald-500/20 px-3 py-1.5 text-emerald-200">
                Pending
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
            placeholder="Search display name, username, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {err && <p className="mb-2 text-red-400">{err}</p>}

          <div className="admin-table-wrap">
            <table className="admin-table min-w-[760px]">
              <thead>
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">GHIN Status</th>
                  <th className="p-3">Requested</th>
                  <th className="p-3">User note</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => (
                  <tr key={r.id}>
                    <td className="p-3">
                      <div className="font-medium">{r.profile?.displayName ?? r.username}</div>
                      <div className="text-xs text-slate-500">@{r.username}</div>
                    </td>
                    <td className="p-3">{r.email}</td>
                    <td className="p-3">
                      <span className="rounded-full border border-amber-600/40 bg-amber-500/10 px-2 py-1 text-xs text-amber-300">
                        Pending
                      </span>
                    </td>
                    <td className="max-w-[160px] p-3 text-xs text-slate-400">
                      {formatRequestedAt(r.profile?.ghinVerificationRequestedAt)}
                    </td>
                    <td className="max-w-[220px] p-3 text-xs text-slate-400" title={r.profile?.ghinVerificationRequestNote ?? undefined}>
                      {r.profile?.ghinVerificationRequestNote
                        ? r.profile.ghinVerificationRequestNote.length > 90
                          ? `${r.profile.ghinVerificationRequestNote.slice(0, 90)}…`
                          : r.profile.ghinVerificationRequestNote
                        : '—'}
                    </td>
                    <td className="p-3">
                      <Link href={`/users/${r.id}`} className="admin-button admin-button-primary px-2 py-1 text-xs">
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-slate-500">
                      Queue is empty.
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
