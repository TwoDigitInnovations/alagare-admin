import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import { Api } from "@/services/service";
import { toastSuccess, toastError } from "@/utils/swal";
import { Save, Bell, Shield, Globe, Mail } from "lucide-react";

/** Outside page — avoids remount/jank on every toggle click */
function SettingsToggle({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-[#fafafa] p-4">
      <div className="pr-4">
        <p className="text-sm font-semibold text-[#1e293b]">{label}</p>
        <p className="text-xs text-[#94a3b8]">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-200 ${
          checked
            ? "border-[#4a6d00] bg-[#4a6d00]"
            : "border-[#cbd5e1] bg-[#e2e8f0]"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

const EMPTY_FORM = {
  platformName: "Alagare",
  supportEmail: "support@alagare.com",
  currency: "EUR",
  timezone: "Europe/Berlin",
  notifyBookings: true,
  notifyUsers: true,
  maintenanceMode: false,
};

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    Api("get", "admin/settings", null, router)
      .then((res) => {
        const s = res?.data?.settings;
        if (s) {
          setForm({
            platformName: s.platformName || EMPTY_FORM.platformName,
            supportEmail: s.supportEmail || EMPTY_FORM.supportEmail,
            currency: s.currency || EMPTY_FORM.currency,
            timezone: s.timezone || EMPTY_FORM.timezone,
            notifyBookings: !!s.notifyBookings,
            notifyUsers: !!s.notifyUsers,
            maintenanceMode: !!s.maintenanceMode,
          });
        }
      })
      .catch(() => toastError("Failed to load settings"))
      .finally(() => setLoading(false));
  }, [router]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await Api("put", "admin/settings", form, router);
      const s = res?.data?.settings;
      if (s) {
        setForm({
          platformName: s.platformName || "",
          supportEmail: s.supportEmail || "",
          currency: s.currency || "EUR",
          timezone: s.timezone || "Europe/Berlin",
          notifyBookings: !!s.notifyBookings,
          notifyUsers: !!s.notifyUsers,
          maintenanceMode: !!s.maintenanceMode,
        });
      }
      toastSuccess("Settings saved");
    } catch (err) {
      toastError(err?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Settings">
        <p className="text-sm text-[#64748b]">Loading settings…</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings">
      <form onSubmit={save} className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Globe size={18} className="text-[#4a6d00]" />
            <h2 className="font-bold text-[#1e293b]">General</h2>
          </div>
          <div className="space-y-4">
            {[
              { l: "Platform Name", n: "platformName", icon: Shield },
              { l: "Support Email", n: "supportEmail", icon: Mail, t: "email" },
            ].map(({ l, n, t }) => (
              <div key={n}>
                <label className="mb-1 block text-xs font-medium text-[#64748b]">{l}</label>
                <input
                  type={t || "text"}
                  value={form[n]}
                  onChange={(e) => setForm({ ...form, [n]: e.target.value })}
                  className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#64748b]">Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#64748b]">Timezone</label>
                <select
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                >
                  <option value="Europe/Berlin">Europe/Berlin</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Bell size={18} className="text-[#4a6d00]" />
            <h2 className="font-bold text-[#1e293b]">Notifications</h2>
          </div>
          <div className="space-y-3">
            <SettingsToggle
              label="Booking Alerts"
              desc="Get notified on new bookings"
              checked={form.notifyBookings}
              onChange={(v) => setForm((prev) => ({ ...prev, notifyBookings: v }))}
            />
            <SettingsToggle
              label="New User Alerts"
              desc="Get notified when users sign up"
              checked={form.notifyUsers}
              onChange={(v) => setForm((prev) => ({ ...prev, notifyUsers: v }))}
            />
            <SettingsToggle
              label="Maintenance Mode"
              desc="Disable app for maintenance"
              checked={form.maintenanceMode}
              onChange={(v) => setForm((prev) => ({ ...prev, maintenanceMode: v }))}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4a6d00] py-3 text-sm font-semibold text-white hover:bg-[#3d5a00] disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </form>
    </AdminLayout>
  );
}
