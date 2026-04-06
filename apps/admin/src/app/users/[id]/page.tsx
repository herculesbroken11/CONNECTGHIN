'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiJson } from '@/lib/api';
import { AdminShell, showAdminToast } from '@/components/admin-shell';

export default function UserDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const load = () => {
    setErr(null);
    apiJson<Record<string, unknown>>(`/admin/users/${id}`)
      .then(setUser)
      .catch((e) => setErr(String(e.message)));
  };

  useEffect(() => {
    load();
  }, [id]);

  async function act(
    suffix: string,
    method: string,
    body?: Record<string, unknown>,
  ) {
    try {
      await apiJson(`/admin/users/${id}${suffix}`, {
        method,
        body: body ? JSON.stringify(body) : undefined,
      });
      showAdminToast({ message: 'User updated successfully.' });
      load();
    } catch (e: unknown) {
      showAdminToast({ message: String((e as Error).message), type: 'error' });
    }
  }

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      const fd = new FormData(e.currentTarget);
      await apiJson(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: String(fd.get('firstName') ?? ''),
          lastName: String(fd.get('lastName') ?? ''),
          email: String(fd.get('email') ?? ''),
          username: String(fd.get('username') ?? ''),
          role: String(fd.get('role') ?? 'USER'),
          membershipType: String(fd.get('membershipType') ?? 'FREE'),
          isActive: String(fd.get('isActive') ?? 'true') === 'true',
          isSuspended: String(fd.get('isSuspended') ?? 'false') === 'true',
          profile: {
            displayName: String(fd.get('displayName') ?? ''),
            handicap: fd.get('handicap') ? Number(fd.get('handicap')) : null,
            city: String(fd.get('city') ?? ''),
            state: String(fd.get('state') ?? ''),
            country: String(fd.get('country') ?? ''),
            drinkingPreference: String(fd.get('drinkingPreference') ?? ''),
            smokingPreference: String(fd.get('smokingPreference') ?? ''),
            bio: String(fd.get('bio') ?? ''),
          },
        }),
      });
      showAdminToast({ message: 'User updated successfully.' });
      load();
    } catch (e) {
      const message = String((e as Error).message);
      setErr(message);
      showAdminToast({ message, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser() {
    setErr(null);
    try {
      await apiJson(`/admin/users/${id}/delete`, { method: 'PATCH' });
      showAdminToast({ message: 'User deleted successfully.' });
      setShowDeleteModal(false);
      load();
    } catch (e) {
      const message = String((e as Error).message);
      setErr(message);
      showAdminToast({ message, type: 'error' });
    }
  }

  if (!user && !err) {
    return (
      <main className="p-8 text-slate-100">
        <p>Loading…</p>
      </main>
    );
  }

  const profile = user?.profile as Record<string, unknown> | undefined;
  const subscription = (user?.subscriptions as Array<Record<string, unknown>> | undefined)?.[0];

  return (
    <AdminShell
      title={`Edit ${(user?.firstName as string) ?? ''} ${(user?.lastName as string) ?? ''}`.trim() || ((user?.username as string) ?? id)}
      subtitle="Update user information and moderation controls."
      headerRight={
        <Link href="/users" className="text-sm text-sky-300 hover:underline">
          ← Users
        </Link>
      }
    >
      <div className="mx-auto w-full max-w-6xl">
        <p className="mb-2 text-xs text-slate-500">Dashboard / Users / {user?.username as string} / Edit</p>
        <form onSubmit={saveProfile} className="admin-panel p-4">
          {err && <p className="mb-2 text-red-400">{err}</p>}

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="First name" name="firstName" defaultValue={(user?.firstName as string) ?? ''} />
            <Field label="Last name" name="lastName" defaultValue={(user?.lastName as string) ?? ''} />
            <Field label="Email" name="email" defaultValue={(user?.email as string) ?? ''} />
            <Field label="Username" name="username" defaultValue={(user?.username as string) ?? ''} />
            <Field label="Display name" name="displayName" defaultValue={(profile?.displayName as string) ?? ''} />
            <Field label="Handicap" name="handicap" type="number" defaultValue={String(profile?.handicap ?? '')} />
            <Field label="City" name="city" defaultValue={(profile?.city as string) ?? ''} />
            <Field label="State" name="state" defaultValue={(profile?.state as string) ?? ''} />
            <Field label="Country" name="country" defaultValue={(profile?.country as string) ?? ''} />
            <Field label="Drinking pref" name="drinkingPreference" defaultValue={(profile?.drinkingPreference as string) ?? ''} />
            <Field label="Smoking pref" name="smokingPreference" defaultValue={(profile?.smokingPreference as string) ?? ''} />
            <div>
              <label className="mb-1 block text-xs text-slate-500">Role</label>
              <select name="role" className="admin-input" defaultValue={(user?.role as string) ?? 'USER'}>
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Membership</label>
              <select
                name="membershipType"
                className="admin-input"
                defaultValue={(user?.membershipType as string) ?? 'FREE'}
              >
                <option value="FREE">Free</option>
                <option value="PREMIUM">Premium</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Active</label>
              <select name="isActive" className="admin-input" defaultValue={String(Boolean(user?.isActive))}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Suspended</label>
              <select name="isSuspended" className="admin-input" defaultValue={String(Boolean(user?.isSuspended))}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-xs text-slate-500">Bio</label>
            <textarea
              name="bio"
              className="admin-input min-h-[84px]"
              defaultValue={(profile?.bio as string) ?? ''}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="submit" disabled={saving} className="admin-button admin-button-primary text-sm">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              className="admin-button text-sm"
              onClick={() => act('/verify-ghin', 'PATCH')}
            >
              {profile?.isGHINVerified ? 'Verified' : 'Verify GHIN'}
            </button>
            <button
              type="button"
              className="admin-button border-rose-700/40 bg-rose-900/20 text-sm text-rose-300"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete User
            </button>
          </div>

          <div className="mt-5 grid gap-2 text-xs text-slate-500 md:grid-cols-2">
            <p>Subscription: {(subscription?.status as string) ?? (user?.membershipStatus as string) ?? 'NONE'}</p>
            <p>GHIN verified: {profile?.isGHINVerified ? 'Yes' : 'No'}</p>
          </div>
        </form>
      </div>
      {showDeleteModal ? (
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
                onClick={() => setShowDeleteModal(false)}
                aria-label="Close delete dialog"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-slate-300">
              Are you sure you want to delete{' '}
              <span className="font-medium text-white">
                {(user?.firstName as string) || (user?.lastName as string)
                  ? `${(user?.firstName as string) ?? ''} ${(user?.lastName as string) ?? ''}`.trim()
                  : ((user?.username as string) ?? 'this user')}
              </span>
              ?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="admin-button text-sm"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-button border-rose-700/40 bg-rose-900/20 text-sm text-rose-300"
                onClick={deleteUser}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = 'text',
}: {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      <input type={type} name={name} className="admin-input" defaultValue={defaultValue} />
    </div>
  );
}
