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
    <AdminShell
      title="Dashboard"
      subtitle="Welcome back. Here's what is happening with your business today."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats ? (
          <>
            <StatCard label="Total Members" value={stats.users} trend="+8.2%" color="emerald" />
            <StatCard label="Premium Users" value={stats.premiumUsers} trend="+5.1%" color="sky" />
            <StatCard label="Open Reports" value={stats.openReports} trend="-2.6%" color="amber" />
            <StatCard
              label="GHIN Verified"
              value={stats.ghinVerifiedProfiles}
              trend="+12.4%"
              color="violet"
            />
          </>
        ) : (
          <p className="text-slate-500">Loading…</p>
        )}
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[2fr_1fr]">
        <section className="admin-panel p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Overview</h2>
              <p className="text-xs text-slate-500">Monthly performance for current year</p>
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-900/50 p-1 text-[11px]">
              <button type="button" className="rounded bg-emerald-500/20 px-2 py-1 text-emerald-200">
                Revenue
              </button>
              <button type="button" className="px-2 py-1 text-slate-400">
                Users
              </button>
              <button type="button" className="px-2 py-1 text-slate-400">
                Growth
              </button>
            </div>
          </div>
          <div className="mt-4 h-[290px] rounded-xl border border-slate-800/80 bg-gradient-to-b from-emerald-500/5 to-transparent p-4">
            <svg viewBox="0 0 560 220" className="h-full w-full">
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(16,185,129,0.8)" />
                  <stop offset="100%" stopColor="rgba(16,185,129,0.05)" />
                </linearGradient>
              </defs>
              <path
                d="M0 170 C 40 160, 70 150, 100 160 C 140 175, 180 145, 220 132 C 260 120, 300 128, 340 110 C 380 90, 420 95, 460 78 C 500 62, 530 60, 560 52"
                fill="none"
                stroke="rgba(16,185,129,0.9)"
                strokeWidth="2.5"
              />
              <path
                d="M0 170 C 40 160, 70 150, 100 160 C 140 175, 180 145, 220 132 C 260 120, 300 128, 340 110 C 380 90, 420 95, 460 78 C 500 62, 530 60, 560 52 L560 220 L0 220 Z"
                fill="url(#lineGrad)"
              />
            </svg>
          </div>
        </section>

        <div className="space-y-3">
          <section className="admin-panel p-4">
            <h3 className="text-sm font-semibold text-white">Traffic Sources</h3>
            <p className="text-xs text-slate-500">Where your visitors come from</p>
            <div className="mt-4 flex items-center justify-between">
              <div className="h-24 w-24 rounded-full border-[10px] border-emerald-400/80 border-r-sky-400/80 border-b-violet-400/80 border-l-slate-700/80" />
              <div className="space-y-1 text-xs">
                <p className="text-slate-300">Direct 35%</p>
                <p className="text-slate-400">Organic 28%</p>
                <p className="text-slate-400">Referral 22%</p>
                <p className="text-slate-400">Social 15%</p>
              </div>
            </div>
          </section>

          <section className="admin-panel p-4">
            <h3 className="text-sm font-semibold text-white">Monthly Goals</h3>
            <p className="text-xs text-slate-500">Track progress toward targets</p>
            <GoalRow label="Monthly Revenue" percent={88} />
            <GoalRow label="New Customers" percent={93} />
            <GoalRow label="Conversion Rate" percent={76} />
          </section>
        </div>
      </div>
    </AdminShell>
  );
}

function StatCard({
  label,
  value,
  trend,
  color,
}: {
  label: string;
  value: number;
  trend: string;
  color: 'emerald' | 'sky' | 'amber' | 'violet';
}) {
  const line =
    color === 'emerald'
      ? 'from-emerald-400/70'
      : color === 'sky'
        ? 'from-sky-400/70'
        : color === 'amber'
          ? 'from-amber-400/70'
          : 'from-violet-400/70';

  return (
    <div className="admin-panel overflow-hidden p-4">
      <div className="flex items-start justify-between">
        <p className="text-xs text-slate-500">{label}</p>
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-800 bg-slate-900/60 text-[10px] text-slate-300">
          {color === 'emerald' ? '$' : color === 'sky' ? 'U' : color === 'amber' ? '!' : 'G'}
        </span>
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className={`mt-1 text-xs ${trend.startsWith('+') ? 'text-emerald-300' : 'text-rose-300'}`}>
        {trend} vs last month
      </p>
      <div className={`mt-3 h-[2px] w-full bg-gradient-to-r ${line} to-transparent`} />
      <Sparkline color={color} />
    </div>
  );
}

function Sparkline({ color }: { color: 'emerald' | 'sky' | 'amber' | 'violet' }) {
  const stroke =
    color === 'emerald'
      ? 'rgba(52,211,153,0.9)'
      : color === 'sky'
        ? 'rgba(56,189,248,0.9)'
        : color === 'amber'
          ? 'rgba(251,191,36,0.9)'
          : 'rgba(167,139,250,0.9)';
  return (
    <svg viewBox="0 0 260 34" className="mt-2 h-8 w-full">
      <path
        d="M0 24 C20 22, 35 19, 52 21 C70 24, 88 12, 106 15 C124 17, 140 10, 158 13 C176 15, 194 11, 210 12 C228 13, 244 10, 260 9"
        fill="none"
        stroke={stroke}
        strokeWidth="1.8"
      />
    </svg>
  );
}

function GoalRow({ label, percent }: { label: string; percent: number }) {
  return (
    <div className="mt-3">
      <div className="mb-1 flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800">
        <div className="h-1.5 rounded-full bg-emerald-400" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
