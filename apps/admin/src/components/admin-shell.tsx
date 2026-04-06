'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { apiJson } from '@/lib/api';

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
  | 'notifications'
  | 'profile'
  | 'settings';

type ToastType = 'success' | 'error' | 'info';
type Toast = { id: string; message: string; type: ToastType };
type ToastInput = { message: string; type?: ToastType; durationMs?: number };
type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};
type AdminMeResponse = {
  user: {
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    role?: string;
  };
};
const ADMIN_TOAST_EVENT = 'cg-admin-toast';
const ADMIN_NOTIFICATIONS_CHANGED_EVENT = 'cg-admin-notifications-changed';
const ADMIN_SOUND_KEY = 'cg_admin_notification_sound';
const ADMIN_VIBRATE_KEY = 'cg_admin_notification_vibrate';

export function showAdminToast(input: ToastInput) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ToastInput>(ADMIN_TOAST_EVENT, { detail: input }));
}

export function notifyAdminNotificationsChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(ADMIN_NOTIFICATIONS_CHANGED_EVENT));
}

function apiHostFromBase(apiBase: string): string {
  return apiBase.replace(/\/api\/v1\/?$/, '');
}

function getAdminClientPref(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw == null) return fallback;
  return raw === '1';
}

function playNotificationTone() {
  if (typeof window === 'undefined') return;
  try {
    const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.start(now);
    osc.stop(now + 0.2);
    setTimeout(() => {
      void ctx.close();
    }, 260);
  } catch {
    // no-op on unsupported browsers
  }
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', section: 'overview', icon: 'dashboard' },
  { href: '/users', label: 'Users', section: 'management', icon: 'users' },
  { href: '/ghin-queue', label: 'GHIN Queue', section: 'management', icon: 'queue' },
  { href: '/reports', label: 'Reports', section: 'management', icon: 'reports' },
  { href: '/subscriptions', label: 'Subscriptions', section: 'apps', icon: 'subscriptions' },
  { href: '/audit', label: 'Audit Log', section: 'system', icon: 'audit' },
  { href: '/notifications', label: 'Notifications', section: 'system', icon: 'notifications' },
  { href: '/profile', label: 'Profile', section: 'system', icon: 'profile' },
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
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('cg_admin_sidebar_collapsed') === '1';
  });
  const [showCollapsedContent, setShowCollapsedContent] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('cg_admin_sidebar_collapsed') === '1';
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [adminIdentity, setAdminIdentity] = useState<AdminMeResponse['user'] | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() =>
    getAdminClientPref(ADMIN_SOUND_KEY, false),
  );
  const seenUnreadIdsRef = useRef<Set<string>>(new Set());
  const initializedNotifsRef = useRef(false);
  const notifWrapRef = useRef<HTMLDivElement | null>(null);
  const accountWrapRef = useRef<HTMLDivElement | null>(null);
  const notifSocketRef = useRef<Socket | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem('cg_admin_theme') !== 'light';
  });

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

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    if (collapsed) {
      timeout = setTimeout(() => setShowCollapsedContent(true), 400);
    } else {
      setShowCollapsedContent(false);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [collapsed]);

  const grouped = useMemo(
    () => ({
      overview: NAV_ITEMS.filter((item) => item.section === 'overview'),
      management: NAV_ITEMS.filter((item) => item.section === 'management'),
      apps: NAV_ITEMS.filter((item) => item.section === 'apps'),
      system: NAV_ITEMS.filter((item) => item.section === 'system'),
    }),
    [],
  );

  const dismissToast = useCallback((id: string) => {
    const timer = toastTimersRef.current[id];
    if (timer) {
      clearTimeout(timer);
      delete toastTimersRef.current[id];
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    ({ message, type = 'success', durationMs = 2800 }: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      toastTimersRef.current[id] = setTimeout(() => dismissToast(id), durationMs);
    },
    [dismissToast],
  );

  useEffect(() => {
    return () => {
      for (const timer of Object.values(toastTimersRef.current)) clearTimeout(timer);
      toastTimersRef.current = {};
    };
  }, []);

  useEffect(() => {
    function onToast(event: Event) {
      const custom = event as CustomEvent<ToastInput>;
      if (!custom.detail?.message) return;
      pushToast(custom.detail);
    }
    window.addEventListener(ADMIN_TOAST_EVENT, onToast as EventListener);
    return () => window.removeEventListener(ADMIN_TOAST_EVENT, onToast as EventListener);
  }, [pushToast]);

  useEffect(() => {
    apiJson<AdminMeResponse>('/auth/me')
      .then((res) => setAdminIdentity(res.user))
      .catch(() => setAdminIdentity(null));
  }, []);

  useEffect(() => {
    let active = true;
    apiJson<{ items: NotificationItem[] }>('/notifications')
      .then((res) => {
        if (!active) return;
        const items = res.items ?? [];
        setRecentNotifications(items.slice(0, 6));
        const unread = items.filter((n) => !n.isRead);
        setUnreadCount(unread.length);
        seenUnreadIdsRef.current = new Set(unread.map((n) => n.id));
        initializedNotifsRef.current = true;
      })
      .catch(() => {
        if (!active) return;
        setUnreadCount(0);
        setRecentNotifications([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const token = window.localStorage.getItem('cg_admin_access');
    if (!token) return;
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
    const host = apiHostFromBase(apiBase);
    const socket = io(`${host}/notifications`, {
      transports: ['websocket'],
      auth: { token },
    });
    notifSocketRef.current = socket;

    socket.on('notification', (n: NotificationItem) => {
      setRecentNotifications((prev) => [n, ...prev].slice(0, 6));
      setUnreadCount((v) => v + 1);
      if (initializedNotifsRef.current && !seenUnreadIdsRef.current.has(n.id)) {
        if (getAdminClientPref(ADMIN_SOUND_KEY, false)) {
          playNotificationTone();
        }
        if (getAdminClientPref(ADMIN_VIBRATE_KEY, false) && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(120);
        }
        showAdminToast({
          message: n.title || 'New notification received.',
          type: 'info',
          durationMs: 2200,
        });
      }
      seenUnreadIdsRef.current.add(n.id);
    });

    return () => {
      socket.disconnect();
      notifSocketRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onChanged = () => {
      apiJson<{ items: NotificationItem[] }>('/notifications')
        .then((res) => {
          const items = res.items ?? [];
          setRecentNotifications(items.slice(0, 6));
          const unread = items.filter((n) => !n.isRead);
          setUnreadCount(unread.length);
          seenUnreadIdsRef.current = new Set(unread.map((n) => n.id));
        })
        .catch(() => {
          setUnreadCount(0);
        });
    };
    window.addEventListener(ADMIN_NOTIFICATIONS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(ADMIN_NOTIFICATIONS_CHANGED_EVENT, onChanged);
  }, []);

  useEffect(() => {
    const syncSoundPref = () => setSoundEnabled(getAdminClientPref(ADMIN_SOUND_KEY, false));
    window.addEventListener('storage', syncSoundPref);
    window.addEventListener('focus', syncSoundPref);
    return () => {
      window.removeEventListener('storage', syncSoundPref);
      window.removeEventListener('focus', syncSoundPref);
    };
  }, []);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!notifWrapRef.current) return;
      if (!notifWrapRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) window.addEventListener('mousedown', onClickOutside);
    return () => window.removeEventListener('mousedown', onClickOutside);
  }, [notifOpen]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!accountWrapRef.current) return;
      if (!accountWrapRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }
    if (accountOpen) window.addEventListener('mousedown', onClickOutside);
    return () => window.removeEventListener('mousedown', onClickOutside);
  }, [accountOpen]);

  function logout() {
    window.localStorage.removeItem('cg_admin_access');
    window.localStorage.removeItem('cg_admin_refresh');
    setAccountOpen(false);
    router.push('/login');
  }

  const displayName =
    `${adminIdentity?.firstName ?? ''} ${adminIdentity?.lastName ?? ''}`.trim() ||
    adminIdentity?.username ||
    'Admin';
  const displayRole = adminIdentity?.role || 'ADMIN';
  const displayEmail = adminIdentity?.email || 'admin@connectghin.com';
  const initials = (
    `${adminIdentity?.firstName?.[0] ?? ''}${adminIdentity?.lastName?.[0] ?? ''}` ||
    displayName.slice(0, 2)
  ).toUpperCase();

  return (
    <div className={`min-h-screen ${darkMode ? 'theme-dark text-slate-100' : 'theme-light text-slate-900'}`}>
      <div className="mx-auto flex min-h-screen w-full max-w-none gap-2 px-0 py-0">
        <aside
          className={`sticky top-0 hidden h-screen self-start overflow-hidden transition-[width] duration-[400ms] ease-out md:flex ${
            collapsed ? 'w-[56px]' : 'w-[260px]'
          }`}
        >
          <div
            className={
              showCollapsedContent
                ? 'pointer-events-auto'
                : 'pointer-events-none absolute opacity-0'
            }
          >
            <div className="admin-rail">
              <div className="flex flex-col items-center gap-2">
                <Link
                  href="/dashboard"
                  className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-md border border-slate-800 bg-slate-900/60"
                  title="ConnectGHIN Dashboard"
                >
                  <Image src="/logo.jpeg" alt="ConnectGHIN logo" width={28} height={28} className="h-7 w-7 object-contain" />
                </Link>
                <button
                  type="button"
                  aria-label="Expand menu"
                  className="inline-flex h-8 w-8 items-center justify-center border border-slate-800 bg-slate-900/55 text-xs text-slate-300"
                  onClick={toggleMenu}
                >
                  &gt;
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
                <Link
                  href="/profile"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 bg-slate-900/55 text-slate-300"
                  aria-label="Account"
                  title="Account"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-semibold text-emerald-300">
                    {initials}
                  </span>
                </Link>
              </div>
            </div>
          </div>

          <div
            className={
              showCollapsedContent
                ? 'pointer-events-none absolute opacity-0'
                : 'pointer-events-auto'
            }
          >
            <div className="admin-menu w-[260px] overflow-y-auto">
              <div className="mb-4 flex items-start justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <Link href="/dashboard" className="inline-flex items-center gap-2">
                    <Image
                      src="/logo.jpeg"
                      alt="ConnectGHIN logo"
                      width={28}
                      height={28}
                      className="h-7 w-7 rounded object-contain"
                      priority
                    />
                    <span>
                      <span className="block text-sm font-semibold text-white">ConnectGHIN</span>
                      <span className="block text-[10px] uppercase tracking-[0.2em] text-slate-500">
                        Admin Console
                      </span>
                    </span>
                  </Link>
                </div>
                <button
                  type="button"
                  aria-label="Collapse menu"
                  className="inline-flex h-7 w-7 items-center justify-center border border-slate-800 bg-slate-900/55 text-xs text-slate-300"
                  onClick={toggleMenu}
                >
                  &lt;
                </button>
              </div>
              <NavGroup title="Overview" items={grouped.overview} pathname={pathname} unreadCount={unreadCount} />
              <NavGroup title="Management" items={grouped.management} pathname={pathname} unreadCount={unreadCount} />
              <NavGroup title="Apps" items={grouped.apps} pathname={pathname} unreadCount={unreadCount} />
              <NavGroup title="System" items={grouped.system} pathname={pathname} unreadCount={unreadCount} />
              <div className="mt-auto border-t border-slate-800/80 pt-3">
                <Link
                  href="/profile"
                  className="flex w-full items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-2.5 py-2 text-left"
                  aria-label="Sidebar account"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-semibold text-emerald-300">
                    {initials}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium text-slate-200">{displayName}</span>
                    <span className="block truncate text-[11px] text-slate-500">{displayRole}</span>
                  </span>
                  <span className="ml-auto text-slate-500">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-[1.8]">
                      <path d="M9 6h9v12H9" />
                      <path d="M14 12H4" />
                      <path d="m7 9-3 3 3 3" />
                    </svg>
                  </span>
                </Link>
              </div>
            </div>
          </div>
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
            <div className="relative hidden md:block" ref={notifWrapRef}>
              <button
                type="button"
                className="admin-icon-btn relative inline-flex"
                aria-label="Notifications"
                title="Notifications"
                onClick={async () => {
                  setNotifOpen((v) => !v);
                  if (unreadCount > 0) {
                    setUnreadCount(0);
                    setRecentNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                    try {
                      await apiJson('/notifications/read-all', { method: 'PATCH' });
                      notifyAdminNotificationsChanged();
                    } catch {
                      // keep UI responsive even if request fails
                    }
                  }
                }}
              >
                <HeaderIcon type="bell" />
                {!soundEnabled ? (
                  <span
                    className="absolute -left-1 -bottom-1 inline-flex h-3.5 min-w-[14px] items-center justify-center rounded-full border border-slate-700 bg-slate-900 px-1 text-[9px] font-semibold text-slate-300"
                    title="Notification sound disabled"
                    aria-label="Notification sound disabled"
                  >
                    M
                  </span>
                ) : null}
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                ) : null}
              </button>
              {notifOpen ? (
                <div className="absolute right-0 top-10 z-40 w-80 rounded-lg border border-slate-800 bg-[#06120d] p-2 shadow-xl">
                  <div className="mb-1 px-2 py-1">
                    <p className="text-xs font-semibold text-slate-200">Notifications</p>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {recentNotifications.length ? (
                      recentNotifications.map((n) => (
                        <Link
                          key={n.id}
                          href="/notifications"
                          className="block rounded-md px-2 py-2 hover:bg-slate-800/50"
                          onClick={() => setNotifOpen(false)}
                        >
                          <p className="truncate text-xs font-medium text-slate-200">{n.title}</p>
                          <p className="truncate text-[11px] text-slate-500">{n.body}</p>
                        </Link>
                      ))
                    ) : (
                      <p className="px-2 py-3 text-xs text-slate-500">No recent notifications.</p>
                    )}
                  </div>
                  <div className="mt-1 border-t border-slate-800 pt-1 text-center">
                    <Link
                      href="/notifications"
                      className="text-xs text-emerald-300 hover:underline"
                      onClick={() => setNotifOpen(false)}
                    >
                      View all notifications
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="relative hidden md:block" ref={accountWrapRef}>
              <button
                type="button"
                className="admin-icon-btn inline-flex !w-auto gap-2 px-2.5 text-[11px] font-medium"
                aria-label="Account menu"
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                onClick={() => setAccountOpen((v) => !v)}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-emerald-500/20 text-emerald-300">
                  {initials}
                </span>
              </button>
              {accountOpen ? (
                <div className="absolute right-0 top-10 z-40 w-56 rounded-lg border border-slate-800 bg-[#06120d] p-1 shadow-xl">
                  <div className="border-b border-slate-800 px-3 py-2">
                    <p className="text-sm font-medium text-slate-100">{displayName}</p>
                    <p className="text-xs text-slate-500">{displayEmail}</p>
                  </div>
                  <Link
                    href="/settings"
                    className="mt-1 block rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/60 hover:text-white"
                    onClick={() => setAccountOpen(false)}
                  >
                    Settings
                  </Link>
                  <Link
                    href="/notifications"
                    className="block rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/60 hover:text-white"
                    onClick={() => setAccountOpen(false)}
                  >
                    Notifications
                  </Link>
                  <Link
                    href="/profile"
                    className="block rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/60 hover:text-white"
                    onClick={() => setAccountOpen(false)}
                  >
                    Profile
                  </Link>
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
      <ToastViewport toasts={toasts} onClose={dismissToast} />
    </div>
  );
}

function NavGroup({
  title,
  items,
  pathname,
  unreadCount,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  unreadCount: number;
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
            {item.href === '/notifications' && unreadCount > 0 ? (
              <span className="ml-auto inline-flex min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
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
    case 'notifications':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path d="M12 4a4 4 0 0 0-4 4v2.6c0 .8-.3 1.6-.9 2.2L6 14h12l-1.1-1.2c-.6-.6-.9-1.4-.9-2.2V8a4 4 0 0 0-4-4Z" />
          <path d="M10.4 16a1.8 1.8 0 0 0 3.2 0" />
        </svg>
      );
    case 'profile':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5.8 18c1.4-2.3 3.5-3.4 6.2-3.4s4.8 1.1 6.2 3.4" />
        </svg>
      );
    default:
      return null;
  }
}

function ToastViewport({
  toasts,
  onClose,
}: {
  toasts: Toast[];
  onClose: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[70] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2 shadow-lg ${
            t.type === 'error'
              ? 'border-rose-700/40 bg-rose-950/90 text-rose-100'
              : t.type === 'info'
                ? 'border-sky-700/40 bg-sky-950/90 text-sky-100'
                : 'border-emerald-700/40 bg-emerald-950/90 text-emerald-100'
          }`}
          role="status"
          aria-live="polite"
        >
          <span className="mt-0.5 text-xs">
            {t.type === 'error' ? '!' : t.type === 'info' ? 'i' : '✓'}
          </span>
          <p className="flex-1 text-sm">{t.message}</p>
          <button
            type="button"
            className="text-xs opacity-70 hover:opacity-100"
            onClick={() => onClose(t.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
