'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiJson } from '@/lib/api';
import { AdminShell, showAdminToast } from '@/components/admin-shell';

type UserRow = {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  isSuspended: boolean;
  membershipType: string;
  createdAt: string;
  profile?: { isGHINVerified: boolean; displayName: string };
};

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<UserRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>(
    'all',
  );
  const [roleFilter, setRoleFilter] = useState<'all' | 'USER' | 'ADMIN'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<UserRow | null>(null);

  useEffect(() => {
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    apiJson<UserRow[]>(`/admin/users?${q.toString()}`)
      .then(setRows)
      .catch((e) => {
        const message = String(e.message);
        setErr(message);
        showAdminToast({ message, type: 'error' });
      });
  }, [search]);

  const filteredRows = rows.filter((u) => {
    const status = !u.isActive ? 'inactive' : u.isSuspended ? 'suspended' : 'active';
    const statusMatch = statusFilter === 'all' || statusFilter === status;
    const roleMatch = roleFilter === 'all' || roleFilter === u.role;
    return statusMatch && roleMatch;
  });

  async function confirmDeleteUser() {
    if (!pendingDelete) return;
    setDeletingId(pendingDelete.id);
    setErr(null);
    try {
      await apiJson(`/admin/users/${pendingDelete.id}/delete`, { method: 'PATCH' });
      setRows((prev) => prev.filter((u) => u.id !== pendingDelete.id));
      setPendingDelete(null);
      showAdminToast({ message: 'User deleted successfully.' });
    } catch (e) {
      const message = String((e as Error).message);
      setErr(message);
      showAdminToast({ message, type: 'error' });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminShell title="Users" subtitle="Manage team members, roles, and permissions.">
      <div className="mx-auto w-full max-w-6xl">
        <p className="mb-2 text-xs text-slate-500">Dashboard / Users</p>

        <div className="admin-panel p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900/60 p-1 text-xs">
              <TabButton
                active={statusFilter === 'all'}
                onClick={() => setStatusFilter('all')}
                label="All"
              />
              <TabButton
                active={statusFilter === 'active'}
                onClick={() => setStatusFilter('active')}
                label="Active"
              />
              <TabButton
                active={statusFilter === 'inactive'}
                onClick={() => setStatusFilter('inactive')}
                label="Inactive"
              />
              <TabButton
                active={statusFilter === 'suspended'}
                onClick={() => setStatusFilter('suspended')}
                label="Suspended"
              />
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

          <div className="mb-3 grid gap-2 md:grid-cols-[1fr_160px]">
            <input
              type="search"
              placeholder="Search users..."
              className="admin-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="admin-input"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | 'USER' | 'ADMIN')}
            >
              <option value="all">All roles</option>
              <option value="ADMIN">Admin</option>
              <option value="USER">User</option>
            </select>
          </div>

          {err && <p className="mb-2 text-sm text-red-400">{err}</p>}
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Membership</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Last Active</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((u) => (
                  <tr key={u.id}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-semibold text-emerald-300">
                          {getInitials(u)}
                        </span>
                        <div>
                          <div className="font-medium">{u.firstName || u.lastName ? `${u.firstName} ${u.lastName}`.trim() : u.username}</div>
                          <div className="text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="rounded-full border border-slate-700 px-2 py-1 text-xs">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="rounded-full border border-slate-700 px-2 py-1 text-xs">
                        {u.membershipType}
                      </span>
                    </td>
                    <td className="p-3">{renderStatus(u)}</td>
                    <td className="p-3 text-slate-400">{timeAgo(u.createdAt)}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Link
                          href={`/users/${u.id}`}
                          className="admin-button h-7 w-7 px-0 py-0 text-xs"
                          title="Edit user"
                          aria-label="Edit user"
                        >
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-[1.8]">
                            <path d="M4 20h4l10-10-4-4L4 16v4Z" />
                            <path d="m12.8 7.2 4 4" />
                          </svg>
                        </Link>
                        <button
                          type="button"
                          className="admin-button h-7 w-7 border-rose-700/40 bg-rose-900/20 px-0 py-0 text-xs text-rose-300"
                          disabled={deletingId === u.id}
                          onClick={() => setPendingDelete(u)}
                          title="Delete user"
                          aria-label="Delete user"
                        >
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-[1.8]">
                            <path d="M5 7h14" />
                            <path d="M9 7V5h6v2" />
                            <path d="M8 7l1 12h6l1-12" />
                            <path d="M10 10v6M14 10v6" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-slate-500">
                      No users match current filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {pendingDelete ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[1px]">
          <div className="admin-panel w-full max-w-md p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-white">Delete User</h3>
                <p className="mt-1 text-xs text-slate-500">
                  This will deactivate and suspend this account.
                </p>
              </div>
              <button
                type="button"
                className="admin-button h-7 w-7 p-0 text-xs"
                onClick={() => setPendingDelete(null)}
                aria-label="Close delete dialog"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-slate-300">
              Are you sure you want to delete{' '}
              <span className="font-medium text-white">
                {pendingDelete.firstName || pendingDelete.lastName
                  ? `${pendingDelete.firstName} ${pendingDelete.lastName}`.trim()
                  : pendingDelete.username}
              </span>
              ?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="admin-button text-sm"
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-button border-rose-700/40 bg-rose-900/20 text-sm text-rose-300"
                disabled={deletingId === pendingDelete.id}
                onClick={confirmDeleteUser}
              >
                {deletingId === pendingDelete.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
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

function renderStatus(u: UserRow) {
  if (!u.isActive) return <span className="text-rose-400">Inactive</span>;
  if (u.isSuspended) return <span className="text-amber-400">Suspended</span>;
  return <span className="text-emerald-400">Active</span>;
}

function getInitials(u: UserRow): string {
  const first = (u.firstName?.[0] ?? '').toUpperCase();
  const last = (u.lastName?.[0] ?? '').toUpperCase();
  return (first + last || u.username.slice(0, 2)).toUpperCase();
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
