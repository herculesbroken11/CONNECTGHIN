'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiJson } from '@/lib/api';

type UserRow = {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isSuspended: boolean;
  membershipType: string;
  profile?: { isGHINVerified: boolean; displayName: string };
};

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<UserRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    apiJson<UserRow[]>(`/admin/users?${q.toString()}`)
      .then(setRows)
      .catch((e) => setErr(String(e.message)));
  }, [search]);

  return (
    <main className="min-h-screen p-8 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Users</h1>
          <Link href="/dashboard" className="text-sm text-emerald-400 hover:underline">
            ← Dashboard
          </Link>
        </div>
        <input
          type="search"
          placeholder="Search email, username, name…"
          className="mb-4 w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {err && <p className="text-red-400">{err}</p>}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-slate-400">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Membership</th>
                <th className="p-3">GHIN</th>
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-t border-slate-800">
                  <td className="p-3">
                    <div className="font-medium">{u.username}</div>
                    <div className="text-slate-500">{u.email}</div>
                  </td>
                  <td className="p-3">{u.membershipType}</td>
                  <td className="p-3">
                    {u.profile?.isGHINVerified ? (
                      <span className="text-emerald-400">Verified</span>
                    ) : (
                      <span className="text-slate-500">No</span>
                    )}
                  </td>
                  <td className="p-3">
                    {!u.isActive ? (
                      <span className="text-red-400">Inactive</span>
                    ) : u.isSuspended ? (
                      <span className="text-amber-400">Suspended</span>
                    ) : (
                      <span className="text-slate-400">OK</span>
                    )}
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/users/${u.id}`}
                      className="text-emerald-400 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
