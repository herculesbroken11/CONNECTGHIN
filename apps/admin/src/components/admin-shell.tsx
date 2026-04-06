'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  href: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/users', label: 'Users' },
  { href: '/ghin-queue', label: 'GHIN Queue' },
  { href: '/reports', label: 'Reports' },
  { href: '/subscriptions', label: 'Subscriptions' },
  { href: '/audit', label: 'Audit Log' },
  { href: '/settings', label: 'Settings' },
];

function isActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === '/users' && pathname.startsWith('/users/')) return true;
  return false;
}

function linkClass(active: boolean): string {
  return active
    ? 'rounded-xl border border-sky-500/30 bg-sky-500/15 px-3 py-2 text-sky-200'
    : 'rounded-xl border border-transparent px-3 py-2 text-slate-300 hover:border-slate-700 hover:bg-slate-900/70 hover:text-white';
}

export function AdminShell({
  title,
  subtitle,
  children,
  headerRight,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  headerRight?: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen text-slate-100">
      <div className="mx-auto flex w-full max-w-[1520px] flex-col px-3 py-3 md:flex-row md:gap-4 md:px-4 md:py-4">
        <aside className="hidden min-h-[calc(100vh-2rem)] w-72 flex-col rounded-2xl border border-slate-800/90 bg-slate-900/55 p-4 md:flex">
          <div className="admin-panel-muted mb-6 px-3 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-sky-300">ConnectGHIN</p>
            <p className="mt-1 text-lg font-semibold text-white">Admin Console</p>
            <p className="mt-1 text-xs text-slate-400">Operations and moderation</p>
          </div>
          <nav className="space-y-1.5 text-sm">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={linkClass(isActive(pathname, item.href))}
              >
                <span className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
          <div className="mt-auto pt-4 text-xs text-slate-500">v1 admin interface</div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 rounded-2xl border border-slate-800/80 bg-slate-950/85 px-4 py-3 backdrop-blur md:px-6">
            <div className="mb-3 flex items-center justify-between gap-4 md:mb-2">
              <div>
                <h1 className="text-xl font-semibold text-white md:text-2xl">{title}</h1>
                {subtitle ? (
                  <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
                ) : null}
              </div>
              {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
            </div>
            <nav className="flex gap-2 overflow-x-auto pb-1 text-xs md:hidden">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap ${linkClass(
                    isActive(pathname, item.href),
                  )}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>

          <section className="px-1 py-4 md:px-2 md:py-6">{children}</section>
        </main>
      </div>
    </div>
  );
}
