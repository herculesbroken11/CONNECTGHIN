'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { apiJson } from '@/lib/api';
import { AdminShell } from '@/components/admin-shell';

type Setting = { id: string; key: string; valueJson: string };
type TabKey = 'profile' | 'preferences' | 'appearance';

export default function AppSettingsPage() {
  const [rows, setRows] = useState<Setting[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<TabKey>('profile');

  const load = () => {
    apiJson<Setting[]>('/admin/settings')
      .then(setRows)
      .catch((e) => setErr(String(e.message)));
  };

  useEffect(() => {
    load();
  }, []);

  async function save(key: string, fallback: string) {
    const raw = editing[key] ?? fallback;
    try {
      const value = JSON.parse(raw);
      await apiJson(`/admin/settings/${encodeURIComponent(key)}`, {
        method: 'PATCH',
        body: JSON.stringify({ value }),
      });
      setEditing((e) => {
        const n = { ...e };
        delete n[key];
        return n;
      });
      load();
    } catch (e) {
      setErr(String((e as Error).message));
    }
  }

  return (
    <AdminShell title="Settings" subtitle="Manage your account settings and preferences.">
      <div className="mx-auto w-full max-w-6xl">
        {err && <p className="text-red-400">{err}</p>}

        <div className="admin-panel p-4">
          <div className="mb-4 inline-flex rounded-lg border border-slate-800 bg-slate-900/60 p-1 text-xs">
            <TabButton active={tab === 'profile'} onClick={() => setTab('profile')}>
              Profile
            </TabButton>
            <TabButton active={tab === 'preferences'} onClick={() => setTab('preferences')}>
              Preferences
            </TabButton>
            <TabButton active={tab === 'appearance'} onClick={() => setTab('appearance')}>
              Appearance
            </TabButton>
          </div>

          {tab === 'profile' ? (
            <section>
              <h3 className="text-base font-semibold text-white">Profile</h3>
              <p className="mt-1 text-xs text-slate-500">
                Update runtime app settings (JSON-backed, live values).
              </p>
              <div className="mt-4 grid gap-4">
                {rows.map((r) => (
                  <div key={r.id} className="admin-panel-muted p-3">
                    <div className="font-mono text-sm text-emerald-300">{r.key}</div>
                    <textarea
                      className="admin-input mt-2 font-mono"
                      rows={2}
                      defaultValue={r.valueJson}
                      onChange={(e) =>
                        setEditing((x) => ({ ...x, [r.key]: e.target.value }))
                      }
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        className="admin-button admin-button-primary text-sm"
                        onClick={() => save(r.key, r.valueJson)}
                      >
                        Save changes
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {tab === 'preferences' ? (
            <section>
              <h3 className="text-base font-semibold text-white">Preferences</h3>
              <p className="mt-1 text-xs text-slate-500">
                Notification and communication preferences.
              </p>
              <div className="mt-4 space-y-3">
                <PrefRow title="Order notifications" subtitle="Receive emails for status changes" enabled />
                <PrefRow title="Marketing emails" subtitle="Receive product and promotion updates" />
                <PrefRow title="Security alerts" subtitle="Get notified about suspicious account activity" enabled />
                <PrefRow title="Push notifications" subtitle="Receive in-app updates for critical actions" enabled />
                <PrefRow title="Weekly digest" subtitle="Summary of weekly admin metrics" />
              </div>
            </section>
          ) : null}

          {tab === 'appearance' ? (
            <section>
              <h3 className="text-base font-semibold text-white">Appearance</h3>
              <p className="mt-1 text-xs text-slate-500">
                Theme controls for admin interface preview.
              </p>

              <div className="mt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Theme</p>
                <div className="grid gap-2 md:grid-cols-3">
                  <ChoiceCard label="Light" />
                  <ChoiceCard label="Dark" active />
                  <ChoiceCard label="System" />
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Density</p>
                <div className="grid gap-2 md:grid-cols-3">
                  <ChoiceCard label="Compact" />
                  <ChoiceCard label="Comfortable" active />
                  <ChoiceCard label="Spacious" />
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </AdminShell>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
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
      {children}
    </button>
  );
}

function PrefRow({
  title,
  subtitle,
  enabled = false,
}: {
  title: string;
  subtitle: string;
  enabled?: boolean;
}) {
  return (
    <div className="admin-panel-muted flex items-center justify-between px-3 py-2">
      <div>
        <p className="text-sm text-slate-200">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      <span
        className={`inline-flex h-5 w-9 items-center rounded-full border ${
          enabled
            ? 'border-emerald-500/40 bg-emerald-500/25'
            : 'border-slate-700 bg-slate-800/70'
        }`}
      >
        <span
          className={`mx-0.5 h-3.5 w-3.5 rounded-full ${
            enabled ? 'translate-x-3.5 bg-emerald-300' : 'bg-slate-500'
          } transition`}
        />
      </span>
    </div>
  );
}

function ChoiceCard({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      className={`rounded-lg border px-3 py-3 text-sm ${
        active
          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200'
          : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700'
      }`}
    >
      {label}
    </button>
  );
}
