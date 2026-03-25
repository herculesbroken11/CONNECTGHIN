'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
      <main className="p-8">
        <p className="text-red-300">{err}</p>
        <Link href="/login" className="mt-4 inline-block text-fairway-light">
          Login
        </Link>
      </main>
    );
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-slate-400">ConnectGHIN overview</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      <nav className="mt-10 flex flex-wrap gap-4 text-sm">
        <Link href="/users" className="text-fairway-light hover:underline">
          Users
        </Link>
        <Link href="/ghin-queue" className="text-fairway-light hover:underline">
          GHIN queue
        </Link>
        <Link href="/reports" className="text-fairway-light hover:underline">
          Reports
        </Link>
        <Link href="/subscriptions" className="text-fairway-light hover:underline">
          Subscriptions
        </Link>
        <Link href="/audit" className="text-fairway-light hover:underline">
          Audit log
        </Link>
        <Link href="/settings" className="text-fairway-light hover:underline">
          App settings
        </Link>
      </nav>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
