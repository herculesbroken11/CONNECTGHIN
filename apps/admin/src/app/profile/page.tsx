'use client';

import { useEffect, useState } from 'react';
import { AdminShell, showAdminToast } from '@/components/admin-shell';
import { apiJson } from '@/lib/api';

type MeResponse = {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    username: string;
    role: string;
    membershipType: string;
    membershipStatus: string;
    createdAt: string;
  };
};

export default function AdminProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    role: '',
  });

  useEffect(() => {
    apiJson<MeResponse>('/auth/me')
      .then((res) => {
        setForm({
          firstName: res.user.firstName ?? '',
          lastName: res.user.lastName ?? '',
          email: res.user.email ?? '',
          username: res.user.username ?? '',
          role: res.user.role ?? '',
        });
      })
      .catch((e) => setErr(String(e.message)))
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      await apiJson('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
        }),
      });
      showAdminToast({ message: 'Profile updated successfully.' });
    } catch (e) {
      const message = String((e as Error).message);
      setErr(message);
      showAdminToast({ message, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell title="My Profile" subtitle="Update your admin account information.">
      <div className="mx-auto w-full max-w-4xl">
        <p className="mb-2 text-xs text-slate-500">Dashboard / Profile</p>
        <form onSubmit={saveProfile} className="admin-panel p-4">
          {loading ? <p className="text-sm text-slate-400">Loading profile...</p> : null}
          {err ? <p className="mb-2 text-sm text-red-400">{err}</p> : null}
          <div className="grid gap-3 md:grid-cols-2">
            <Field
              label="First name"
              value={form.firstName}
              onChange={(v) => setForm((x) => ({ ...x, firstName: v }))}
              disabled={loading || saving}
            />
            <Field
              label="Last name"
              value={form.lastName}
              onChange={(v) => setForm((x) => ({ ...x, lastName: v }))}
              disabled={loading || saving}
            />
            <Field label="Email" value={form.email} onChange={() => {}} disabled readOnly />
            <Field label="Username" value={form.username} onChange={() => {}} disabled readOnly />
            <Field label="Role" value={form.role} onChange={() => {}} disabled readOnly />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="admin-button admin-button-primary text-sm"
              disabled={loading || saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled = false,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      <input
        className="admin-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        readOnly={readOnly}
      />
    </div>
  );
}
