'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/admin-shell';

const API =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

type Stats = {
  users: number;
  premiumUsers: number;
  openReports: number;
  ghinVerifiedProfiles: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('cg_admin_access');
    if (!token) return;
    fetch(`${API}/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error('Unauthorized');
        return r.json();
      })
      .then(setStats)
      .catch(() => setErr('Could not load stats. Sign in again.'));
  }, []);

  if (err) {
    return (
      <main className="p-6">
        <p className="text-red-300">{err}</p>
        <Link href="/login" className="mt-4 inline-block text-fairway-light">
          Login
        </Link>
      </main>
    );
  }

  return (
    <AdminShell title="Dashboard" subtitle="ConnectGHIN overview">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats ? (
          <>
            <StatCard label="Users" value={stats.users} />
            <StatCard label="Premium" value={stats.premiumUsers} />
            <StatCard label="Open reports" value={stats.openReports} />
            <StatCard label="GHIN verified" value={stats.ghinVerifiedProfiles} />
          </>
        ) : (
          <p className="text-slate-500">Loading…</p>
        )}
      </div>
    </AdminShell>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-panel p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}
