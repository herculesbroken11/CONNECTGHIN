'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

type NavItem = {
  href: string;
  label: string;
  section: 'overview' | 'management' | 'apps' | 'system';
  icon: IconName;
};

type IconName =
  | 'dashboard'
  | 'users'
  | 'queue'
  | 'reports'
  | 'subscriptions'
  | 'audit'
  | 'settings';

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', section: 'overview', icon: 'dashboard' },
  { href: '/users', label: 'Users', section: 'management', icon: 'users' },
  { href: '/ghin-queue', label: 'GHIN Queue', section: 'management', icon: 'queue' },
  { href: '/reports', label: 'Reports', section: 'management', icon: 'reports' },
  { href: '/subscriptions', label: 'Subscriptions', section: 'apps', icon: 'subscriptions' },
  { href: '/audit', label: 'Audit Log', section: 'system', icon: 'audit' },
  { href: '/settings', label: 'Settings', section: 'system', icon: 'settings' },
];

function isActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === '/users' && pathname.startsWith('/users/')) return true;
  return false;
}

function getNavLinkClass(active: boolean): string {
  return active
    ? 'flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-2 text-sm text-emerald-200'
    : 'flex items-center gap-2 rounded-lg border border-transparent px-2.5 py-2 text-sm text-slate-300 hover:border-slate-800 hover:bg-slate-900/60 hover:text-white';
}

function getRailIconClass(active: boolean): string {
  return active
    ? 'inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-500/35 bg-emerald-500/20 text-emerald-200'
    : 'inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200';
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
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const v = window.localStorage.getItem('cg_admin_sidebar_collapsed');
    if (v === '1') setCollapsed(true);
    const theme = window.localStorage.getItem('cg_admin_theme');
    if (theme === 'light') setDarkMode(false);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('cg_admin_theme', darkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-admin-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  function toggleMenu() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem('cg_admin_sidebar_collapsed', next ? '1' : '0');
      return next;
    });
  }

  function logout() {
    window.localStorage.removeItem('cg_admin_access');
    window.localStorage.removeItem('cg_admin_refresh');
    setAccountOpen(false);
    router.push('/login');
  }

  const grouped = useMemo(
    () => ({
      overview: NAV_ITEMS.filter((item) => item.section === 'overview'),
      management: NAV_ITEMS.filter((item) => item.section === 'management'),
      apps: NAV_ITEMS.filter((item) => item.section === 'apps'),
      system: NAV_ITEMS.filter((item) => item.section === 'system'),
    }),
    [],
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'theme-dark text-slate-100' : 'theme-light text-slate-900'}`}>
      <div className="mx-auto flex w-full max-w-[1600px] gap-3 px-3 py-3">
        <aside className="hidden md:flex">
          <div className="admin-rail mr-2">
            <div className="flex flex-col items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/20 text-[11px] font-semibold text-emerald-300">
                C
              </span>
              <button
                type="button"
                aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 bg-slate-900/55 text-xs text-slate-300"
                onClick={toggleMenu}
              >
                {collapsed ? '>' : '<'}
              </button>
            </div>

            <nav className="mt-3 flex flex-1 flex-col items-center gap-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={getRailIconClass(isActive(pathname, item.href))}
                  title={item.label}
                  aria-label={item.label}
                >
                  <AppIcon name={item.icon} />
                </Link>
              ))}
            </nav>

            <div className="mt-auto flex flex-col items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 bg-slate-900/55 text-xs text-slate-400">
                ?
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 bg-slate-900/55 text-xs text-slate-400">
                •
              </span>
            </div>
          </div>

          {!collapsed ? (
            <div className="admin-menu w-[220px]">
              <div className="mb-4 border-b border-slate-800/80 pb-3">
                <p className="text-sm font-semibold text-white">Apex</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  ConnectGHIN Admin
                </p>
              </div>
              <NavGroup title="Overview" items={grouped.overview} pathname={pathname} />
              <NavGroup title="Management" items={grouped.management} pathname={pathname} />
              <NavGroup title="Apps" items={grouped.apps} pathname={pathname} />
              <NavGroup title="System" items={grouped.system} pathname={pathname} />
              <div className="mt-auto border-t border-slate-800/80 pt-3 text-xs text-slate-500">
                Operations Console
              </div>
            </div>
          ) : null}
        </aside>

        <main className="min-w-0 flex-1">
          <header className="admin-topbar sticky top-0 z-20">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                Search
              </span>
              <input
                aria-label="Search admin pages"
                placeholder="Search anything..."
                className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/50 pl-14 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
              />
            </div>
            <button
              type="button"
              className="admin-icon-btn hidden md:inline-flex"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => setDarkMode((v) => !v)}
            >
              {darkMode ? <HeaderIcon type="sun" /> : <HeaderIcon type="moon" />}
            </button>
            <span className="admin-icon-btn hidden md:inline-flex">
              <HeaderIcon type="bell" />
            </span>
            <div className="relative hidden md:block">
              <button
                type="button"
                className="admin-icon-btn inline-flex !w-auto gap-2 px-2.5 text-[11px] font-medium"
                onClick={() => setAccountOpen((v) => !v)}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-emerald-500/20 text-emerald-300">
                  AS
                </span>
                <span className="text-slate-300">Account</span>
              </button>
              {accountOpen ? (
                <div className="absolute right-0 top-11 z-30 w-56 rounded-lg border border-slate-800 bg-[#05100c] p-1 shadow-xl">
                  <div className="border-b border-slate-800 px-3 py-2">
                    <p className="text-sm font-medium text-slate-100">Admin</p>
                    <p className="text-xs text-slate-500">admin@connectghin.com</p>
                  </div>
                  <Link
                    href="/settings"
                    className="mt-1 block rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/60 hover:text-white"
                    onClick={() => setAccountOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    type="button"
                    className="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  >
                    Notifications
                  </button>
                  <button
                    type="button"
                    className="block w-full rounded-md px-3 py-2 text-left text-sm text-rose-300 hover:bg-rose-500/10"
                    onClick={logout}
                  >
                    Log out
                  </button>
                </div>
              ) : null}
            </div>
          </header>

          <div className="mt-3 px-1">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold text-white">{title}</h1>
                {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
              </div>
              {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavGroup({
  title,
  items,
  pathname,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div className="mb-4">
      <p className="mb-1 px-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <nav className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={getNavLinkClass(isActive(pathname, item.href))}
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-slate-900/60 text-[10px] text-slate-400">
              <AppIcon name={item.icon} />
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function HeaderIcon({ type }: { type: 'bell' | 'user' | 'sun' | 'moon' }) {
  if (type === 'bell') {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-[1.8]">
        <path d="M12 4a4 4 0 0 0-4 4v2.6c0 .8-.3 1.6-.9 2.2L6 14h12l-1.1-1.2c-.6-.6-.9-1.4-.9-2.2V8a4 4 0 0 0-4-4Z" />
        <path d="M10.4 16a1.8 1.8 0 0 0 3.2 0" />
      </svg>
    );
  }
  if (type === 'sun') {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-[1.8]">
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 2.8v2.1M12 19.1v2.1M21.2 12h-2.1M4.9 12H2.8M18.6 5.4l-1.5 1.5M6.9 17.1l-1.5 1.5M18.6 18.6l-1.5-1.5M6.9 6.9 5.4 5.4" />
      </svg>
    );
  }
  if (type === 'moon') {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-[1.8]">
        <path d="M14.8 3.8a8.2 8.2 0 1 0 5.4 12.8 8.5 8.5 0 0 1-5.4-12.8Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-[1.8]">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.8 18c1.4-2.3 3.5-3.4 6.2-3.4s4.8 1.1 6.2 3.4" />
    </svg>
  );
}

function AppIcon({ name }: { name: IconName }) {
  const className = 'h-3.5 w-3.5 fill-none stroke-current stroke-[1.8]';
  switch (name) {
    case 'dashboard':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <rect x="4" y="4" width="7" height="7" rx="1.2" />
          <rect x="13" y="4" width="7" height="5" rx="1.2" />
          <rect x="13" y="11" width="7" height="9" rx="1.2" />
          <rect x="4" y="13" width="7" height="7" rx="1.2" />
        </svg>
      );
    case 'users':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <circle cx="9" cy="8" r="2.6" />
          <circle cx="16.6" cy="9.3" r="2.1" />
          <path d="M4.8 17.2c1-2.1 2.5-3.1 4.4-3.1 1.9 0 3.4 1 4.4 3.1" />
          <path d="M14.1 16.8c.7-1.4 1.8-2 3.2-2 .8 0 1.6.2 2.4.9" />
        </svg>
      );
    case 'queue':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path d="M6 6h12M6 10h9M6 14h7" />
          <circle cx="16.5" cy="15.5" r="3.5" />
          <path d="m19.3 18.3 2.2 2.2" />
        </svg>
      );
    case 'reports':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path d="M7 4h10l-1 4 1 4H7V4Z" />
          <path d="M7 20V4" />
        </svg>
      );
    case 'subscriptions':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <rect x="4" y="6" width="16" height="12" rx="2" />
          <path d="M4 10h16" />
        </svg>
      );
    case 'audit':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <circle cx="12" cy="12" r="7.5" />
          <path d="M12 8v4l2.5 1.5" />
        </svg>
      );
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <circle cx="12" cy="12" r="2.5" />
          <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4.8a7.2 7.2 0 0 0-1.7-1l-.4-2.5H9.6l-.4 2.5a7.2 7.2 0 0 0-1.7 1l-2.4-.8-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-.8a7.2 7.2 0 0 0 1.7 1l.4 2.5h4.8l.4-2.5a7.2 7.2 0 0 0 1.7-1l2.4.8 2-3.4-2-1.5c.1-.3.1-.7.1-1Z" />
        </svg>
      );
    default:
      return null;
  }
}
