'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AdminShell,
  notifyAdminNotificationsChanged,
  showAdminToast,
} from '@/components/admin-shell';
import { apiJson } from '@/lib/api';

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

type Tab = 'all' | 'unread' | 'read';

export default function NotificationsPage() {
  const [rows, setRows] = useState<NotificationItem[]>([]);
  const [tab, setTab] = useState<Tab>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = async (status: Tab = tab, type: string = typeFilter) => {
    setErr(null);
    try {
      const qs = new URLSearchParams();
      if (status !== 'all') qs.set('status', status);
      if (type !== 'all') qs.set('type', type);
      const res = await apiJson<{ items: NotificationItem[] }>(`/notifications?${qs.toString()}`);
      setRows(res.items);
    } catch (e) {
      const message = String((e as Error).message);
      setErr(message);
      showAdminToast({ message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void load(tab, typeFilter).finally(() => setLoading(false));
  }, [tab, typeFilter]);

  const typeOptions = useMemo(() => {
    const types = Array.from(new Set(rows.map((r) => r.type))).sort();
    return ['all', ...types];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((n) => {
      const tabOk =
        tab === 'all' ? true : tab === 'read' ? n.isRead : !n.isRead;
      if (!tabOk) return false;
      if (!q) return true;
      return (
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        n.type.toLowerCase().includes(q)
      );
    });
  }, [rows, search, tab]);

  async function markRead(id: string) {
    setBusyId(id);
    try {
      await apiJson(`/notifications/${id}/read`, { method: 'PATCH' });
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isRead: true } : r)));
      notifyAdminNotificationsChanged();
      showAdminToast({ message: 'Notification marked as read.' });
    } catch (e) {
      showAdminToast({ message: String((e as Error).message), type: 'error' });
    } finally {
      setBusyId(null);
    }
  }

  async function markUnread(id: string) {
    setBusyId(id);
    try {
      await apiJson(`/notifications/${id}/unread`, { method: 'PATCH' });
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isRead: false } : r)));
      notifyAdminNotificationsChanged();
      showAdminToast({ message: 'Notification marked as unread.' });
    } catch (e) {
      showAdminToast({ message: String((e as Error).message), type: 'error' });
    } finally {
      setBusyId(null);
    }
  }

  async function markAllRead() {
    if (!rows.some((r) => !r.isRead)) return;
    setBusyId('all');
    try {
      await apiJson('/notifications/read-all', { method: 'PATCH' });
      setRows((prev) => prev.map((r) => ({ ...r, isRead: true })));
      notifyAdminNotificationsChanged();
      showAdminToast({ message: 'All notifications marked as read.' });
    } catch (e) {
      showAdminToast({ message: String((e as Error).message), type: 'error' });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell title="Notifications" subtitle="Stay up to date with system alerts and activity.">
      <div className="mx-auto w-full max-w-6xl">
        <p className="mb-2 text-xs text-slate-500">Dashboard / Notifications</p>
        <section className="admin-panel p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="search"
                className="admin-input max-w-sm"
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="admin-input max-w-[170px]"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                {typeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t === 'all' ? 'All types' : t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900/60 p-1 text-xs">
                <TabButton label="All" active={tab === 'all'} onClick={() => setTab('all')} />
                <TabButton label="Unread" active={tab === 'unread'} onClick={() => setTab('unread')} />
                <TabButton label="Read" active={tab === 'read'} onClick={() => setTab('read')} />
              </div>
              <button
                type="button"
                className="admin-button text-xs"
                disabled={busyId === 'all' || !rows.some((r) => !r.isRead)}
                onClick={markAllRead}
              >
                {busyId === 'all' ? 'Updating...' : 'Mark all read'}
              </button>
            </div>
          </div>

          {err ? <p className="mb-2 text-sm text-red-400">{err}</p> : null}

          <div className="admin-table-wrap">
            <table className="admin-table min-w-[760px]">
              <thead>
                <tr>
                  <th className="p-3">Notification</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Time</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-500">
                      Loading notifications...
                    </td>
                  </tr>
                ) : filtered.length ? (
                  filtered.map((n) => (
                    <tr key={n.id}>
                      <td className="p-3">
                        <p className="font-medium text-slate-100">{n.title}</p>
                        <p className="text-xs text-slate-500">{n.body}</p>
                      </td>
                      <td className="p-3">
                        <span className="rounded-full border border-slate-700 px-2 py-1 text-xs">
                          {n.type}
                        </span>
                      </td>
                      <td className="p-3">
                        {n.isRead ? (
                          <span className="text-slate-400">Read</span>
                        ) : (
                          <span className="text-emerald-300">Unread</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-400">{timeAgo(n.createdAt)}</td>
                      <td className="p-3 text-right">
                        {!n.isRead ? (
                          <button
                            type="button"
                            className="admin-button text-xs"
                            disabled={busyId === n.id}
                            onClick={() => markRead(n.id)}
                          >
                            {busyId === n.id ? 'Saving...' : 'Mark read'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="admin-button text-xs"
                            disabled={busyId === n.id}
                            onClick={() => markUnread(n.id)}
                          >
                            {busyId === n.id ? 'Saving...' : 'Mark unread'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-1">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900/50 text-slate-400">
                          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
                            <path d="M12 4a4 4 0 0 0-4 4v2.6c0 .8-.3 1.6-.9 2.2L6 14h12l-1.1-1.2c-.6-.6-.9-1.4-.9-2.2V8a4 4 0 0 0-4-4Z" />
                            <path d="M10.4 16a1.8 1.8 0 0 0 3.2 0" />
                          </svg>
                        </span>
                        <p className="text-sm font-medium text-slate-200">No notifications</p>
                        <p className="text-xs text-slate-500">All caught up.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'rounded-md bg-emerald-500/20 px-3 py-1.5 text-emerald-200'
          : 'rounded-md px-3 py-1.5 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
      }
    >
      {label}
    </button>
  );
}

function timeAgo(input: string): string {
  const ms = Date.now() - new Date(input).getTime();
  if (Number.isNaN(ms) || ms < 0) return 'Just now';
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;
  const years = Math.floor(months / 12);
  return `${years} yr ago`;
}
