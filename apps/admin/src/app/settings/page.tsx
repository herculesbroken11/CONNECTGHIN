'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { apiJson } from '@/lib/api';
import { AdminShell, showAdminToast } from '@/components/admin-shell';

type Setting = { id: string; key: string; valueJson: string };
type TabKey = 'profile' | 'preferences' | 'appearance';
type PreferenceToggle = {
  key: string;
  title: string;
  subtitle: string;
  defaultValue: boolean;
  scope: string;
};

const PREFERENCE_TOGGLES: PreferenceToggle[] = [
  {
    key: 'free_daily_swipe_limit_enabled',
    title: 'Free daily swipe limit',
    subtitle: 'Enforce daily swipe limits for free users.',
    defaultValue: true,
    scope: 'Swipes service',
  },
  {
    key: 'premium_direct_messaging_enabled',
    title: 'Premium direct messaging',
    subtitle: 'Allow premium users to message without a match.',
    defaultValue: false,
    scope: 'Messaging service',
  },
  {
    key: 'premium_trialing_features_enabled',
    title: 'Trial premium features',
    subtitle: 'Grant premium access while subscription is trialing.',
    defaultValue: true,
    scope: 'Subscriptions service',
  },
  {
    key: 'in_app_notifications_enabled',
    title: 'In-app notifications',
    subtitle: 'Store and show in-app notification records.',
    defaultValue: true,
    scope: 'Push + Notifications',
  },
  {
    key: 'push_notifications_enabled',
    title: 'Push notifications',
    subtitle: 'Send push notifications when push provider is configured.',
    defaultValue: true,
    scope: 'Push service',
  },
];
const ADMIN_SOUND_KEY = 'cg_admin_notification_sound';
const ADMIN_VIBRATE_KEY = 'cg_admin_notification_vibrate';

export default function AppSettingsPage() {
  const [rows, setRows] = useState<Setting[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<TabKey>('profile');
  const [savingToggle, setSavingToggle] = useState<string | null>(null);
  const [clientSoundEnabled, setClientSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(ADMIN_SOUND_KEY) === '1';
  });
  const [clientVibrateEnabled, setClientVibrateEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(ADMIN_VIBRATE_KEY) === '1';
  });

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
      showAdminToast({ message: 'Setting updated successfully.' });
    } catch (e) {
      setErr(String((e as Error).message));
      showAdminToast({ message: String((e as Error).message), type: 'error' });
    }
  }

  function rawValue(key: string): string | undefined {
    return rows.find((r) => r.key === key)?.valueJson;
  }

  function boolValue(key: string, fallback: boolean): boolean {
    const raw = rawValue(key);
    if (raw == null) return fallback;
    try {
      const parsed = JSON.parse(raw) as unknown;
      return typeof parsed === 'boolean' ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  async function saveToggle(key: string, value: boolean) {
    setSavingToggle(key);
    setErr(null);
    try {
      await apiJson(`/admin/settings/${encodeURIComponent(key)}`, {
        method: 'PATCH',
        body: JSON.stringify({ value }),
      });
      setRows((prev) => {
        const i = prev.findIndex((r) => r.key === key);
        if (i >= 0) {
          const next = [...prev];
          next[i] = { ...next[i], valueJson: JSON.stringify(value) };
          return next;
        }
        return [...prev, { id: `new-${key}`, key, valueJson: JSON.stringify(value) }];
      });
      showAdminToast({ message: 'Preference updated successfully.' });
    } catch (e) {
      setErr(String((e as Error).message));
      showAdminToast({ message: String((e as Error).message), type: 'error' });
    } finally {
      setSavingToggle(null);
    }
  }

  function saveClientPref(key: string, value: boolean, setter: (v: boolean) => void, label: string) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value ? '1' : '0');
    }
    setter(value);
    showAdminToast({ message: `${label} ${value ? 'enabled' : 'disabled'}.` });
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
                Runtime feature toggles used by backend services.
              </p>
              <div className="mt-4 space-y-3">
                {PREFERENCE_TOGGLES.map((t) => (
                  <PrefRow
                    key={t.key}
                    title={t.title}
                    subtitle={t.subtitle}
                    scope={t.scope}
                    enabled={boolValue(t.key, t.defaultValue)}
                    disabled={savingToggle === t.key}
                    onToggle={(next) => saveToggle(t.key, next)}
                  />
                ))}
              </div>
              <div className="mt-5 border-t border-slate-800/70 pt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                  Admin client alerts
                </p>
                <div className="space-y-3">
                  <PrefRow
                    title="Notification sound"
                    subtitle="Play a short sound for incoming realtime notifications."
                    scope="Admin Web UI"
                    enabled={clientSoundEnabled}
                    onToggle={(next) =>
                      saveClientPref(ADMIN_SOUND_KEY, next, setClientSoundEnabled, 'Notification sound')
                    }
                  />
                  <PrefRow
                    title="Notification vibration"
                    subtitle="Vibrate supported devices when realtime notifications arrive."
                    scope="Admin Web UI"
                    enabled={clientVibrateEnabled}
                    onToggle={(next) =>
                      saveClientPref(
                        ADMIN_VIBRATE_KEY,
                        next,
                        setClientVibrateEnabled,
                        'Notification vibration',
                      )
                    }
                  />
                </div>
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
  scope,
  enabled = false,
  disabled = false,
  onToggle,
}: {
  title: string;
  subtitle: string;
  scope: string;
  enabled?: boolean;
  disabled?: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <div className="admin-panel-muted flex items-center justify-between px-3 py-2">
      <div>
        <p className="text-sm text-slate-200">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
        <span className="mt-1 inline-flex rounded-full border border-slate-700/80 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-slate-400">
          {scope}
        </span>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onToggle(!enabled)}
        aria-pressed={enabled}
        className={`inline-flex h-5 w-9 items-center rounded-full border ${
          enabled
            ? 'border-emerald-500/40 bg-emerald-500/25'
            : 'border-slate-700 bg-slate-800/70'
        } ${disabled ? 'opacity-60' : ''}`}
      >
        <span
          className={`mx-0.5 h-3.5 w-3.5 rounded-full ${
            enabled ? 'translate-x-3.5 bg-emerald-300' : 'bg-slate-500'
          } transition`}
        />
      </button>
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
