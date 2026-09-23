import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import { Api } from "@/services/service";
import { toastSuccess, toastError } from "@/utils/swal";
import { Save, Bell, Shield, Globe, Mail, Percent, Receipt, CreditCard, Wrench, AlertTriangle } from "lucide-react";

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
            ? "border-[#dc2626] bg-[#dc2626]"
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
  currency: "USD",
  timezone: "UTC",
  commissionRate: "5",
  taxRate: "0",
  serviceFee: "0",
  notifyBookings: true,
  notifyUsers: true,
  maintenanceMode: false,
  maintenanceTitleEn: "Under Maintenance",
  maintenanceMessageEn: "Alagare is currently undergoing scheduled maintenance. We'll be back shortly!",
  maintenanceTitleFr: "Maintenance en cours",
  maintenanceMessageFr: "Alagare est actuellement en maintenance planifiée. Nous serons bientôt de retour !",
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
            commissionRate: s.commissionRate != null ? String(s.commissionRate) : "5",
            taxRate: s.taxRate != null ? String(s.taxRate) : "0",
            serviceFee: s.serviceFee != null ? String(s.serviceFee) : "0",
            notifyBookings: !!s.notifyBookings,
            notifyUsers: !!s.notifyUsers,
            maintenanceMode: !!s.maintenanceMode,
            maintenanceTitleEn: s.maintenanceTitleEn || EMPTY_FORM.maintenanceTitleEn,
            maintenanceMessageEn: s.maintenanceMessageEn || EMPTY_FORM.maintenanceMessageEn,
            maintenanceTitleFr: s.maintenanceTitleFr || EMPTY_FORM.maintenanceTitleFr,
            maintenanceMessageFr: s.maintenanceMessageFr || EMPTY_FORM.maintenanceMessageFr,
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
      const rateNum =
        form.commissionRate === "" || form.commissionRate == null
          ? 0
          : Math.max(0, parseFloat(form.commissionRate) || 0);

      const taxNum =
        form.taxRate === "" || form.taxRate == null
          ? 0
          : Math.max(0, parseFloat(form.taxRate) || 0);

      const feeNum =
        form.serviceFee === "" || form.serviceFee == null
          ? 0
          : Math.max(0, parseFloat(form.serviceFee) || 0);

      const payload = {
        ...form,
        commissionRate: rateNum,
        taxRate: taxNum,
        serviceFee: feeNum,
      };

      const res = await Api("put", "admin/settings", payload, router);
      const s = res?.data?.settings;
      if (s) {
        setForm({
          platformName: s.platformName || "",
          supportEmail: s.supportEmail || "",
          currency: s.currency || "USD",
          timezone: s.timezone || "UTC",
          commissionRate: s.commissionRate != null ? String(s.commissionRate) : "0",
          taxRate: s.taxRate != null ? String(s.taxRate) : "0",
          serviceFee: s.serviceFee != null ? String(s.serviceFee) : "0",
          notifyBookings: !!s.notifyBookings,
          notifyUsers: !!s.notifyUsers,
          maintenanceMode: !!s.maintenanceMode,
          maintenanceTitleEn: s.maintenanceTitleEn || EMPTY_FORM.maintenanceTitleEn,
          maintenanceMessageEn: s.maintenanceMessageEn || EMPTY_FORM.maintenanceMessageEn,
          maintenanceTitleFr: s.maintenanceTitleFr || EMPTY_FORM.maintenanceTitleFr,
          maintenanceMessageFr: s.maintenanceMessageFr || EMPTY_FORM.maintenanceMessageFr,
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

  const effectiveRate =
    form.commissionRate === "" ? 0 : parseFloat(form.commissionRate) || 0;
  const effectiveTax =
    form.taxRate === "" ? 0 : parseFloat(form.taxRate) || 0;
  const effectiveFee =
    form.serviceFee === "" ? 0 : parseFloat(form.serviceFee) || 0;

  const sampleTicketPrice = 10000 * (1 + effectiveRate / 100);
  const sampleTaxAmount = sampleTicketPrice * (effectiveTax / 100);
  const sampleTotal = sampleTicketPrice + sampleTaxAmount + effectiveFee;

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

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-xs font-medium text-[#64748b]">Platform Commission Rate (%)</label>
                <span className="text-xs font-semibold text-[#4a6d00]">
                  Dynamic Extra Fee
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={form.commissionRate ?? ""}
                  onChange={(e) => {
                    let val = e.target.value.replace(/[^0-9.]/g, "");
                    const parts = val.split(".");
                    if (parts.length > 2) val = parts[0] + "." + parts.slice(1).join("");
                    if (/^0[0-9]/.test(val)) {
                      val = val.replace(/^0+/, "") || "0";
                    }
                    setForm({ ...form, commissionRate: val });
                  }}
                  className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 pr-8 text-sm font-semibold text-[#1e293b] outline-none focus:border-[#4a6d00]"
                />
                <span className="absolute right-3 top-2.5 text-sm font-bold text-[#64748b]">%</span>
              </div>
              <p className="mt-1.5 text-xs text-[#94a3b8]">
                Added dynamically to bus company price. Example: If route base price is 10,000 and commission is {effectiveRate}%, customer ticket fare is {sampleTicketPrice.toLocaleString()}.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-xs font-medium text-[#64748b]">Tax & Regulatory Fees (%)</label>
                  <span className="text-xs font-semibold text-[#0284c7]">Dynamic Tax</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={form.taxRate ?? ""}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9.]/g, "");
                      const parts = val.split(".");
                      if (parts.length > 2) val = parts[0] + "." + parts.slice(1).join("");
                      if (/^0[0-9]/.test(val)) {
                        val = val.replace(/^0+/, "") || "0";
                      }
                      setForm({ ...form, taxRate: val });
                    }}
                    className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 pr-8 text-sm font-semibold text-[#1e293b] outline-none focus:border-[#4a6d00]"
                  />
                  <span className="absolute right-3 top-2.5 text-sm font-bold text-[#64748b]">%</span>
                </div>
                <p className="mt-1 text-[11px] text-[#94a3b8]">
                  {effectiveTax > 0 ? `${effectiveTax}% added at checkout` : "0% (No tax added)"}
                </p>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-xs font-medium text-[#64748b]">Booking Service Fee (Fixed)</label>
                  <span className="text-xs font-semibold text-[#f26522]">Fixed Fee</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={form.serviceFee ?? ""}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9.]/g, "");
                      const parts = val.split(".");
                      if (parts.length > 2) val = parts[0] + "." + parts.slice(1).join("");
                      if (/^0[0-9]/.test(val)) {
                        val = val.replace(/^0+/, "") || "0";
                      }
                      setForm({ ...form, serviceFee: val });
                    }}
                    className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 pr-8 text-sm font-semibold text-[#1e293b] outline-none focus:border-[#4a6d00]"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-[#64748b]">
                    $
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[#94a3b8]">
                  {effectiveFee > 0 ? `+$${effectiveFee} flat fee per booking` : "$0 (No booking fee)"}
                </p>
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
          </div>
        </div>

        {/* System & Maintenance Mode Section */}
        <div className={`rounded-2xl border transition-all p-5 bg-white ${form.maintenanceMode ? 'border-amber-300 ring-2 ring-amber-100' : 'border-[#e2e8f0]'}`}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench size={18} className={form.maintenanceMode ? "text-amber-600" : "text-[#4a6d00]"} />
              <h2 className="font-bold text-[#1e293b]">Maintenance Mode</h2>
            </div>
            {form.maintenanceMode && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                <AlertTriangle size={12} /> App Disabled for Users
              </span>
            )}
          </div>

          <div className="space-y-4">
            <SettingsToggle
              label="Enable Maintenance Mode"
              desc="Temporarily disable customer mobile app access and display maintenance screen"
              checked={form.maintenanceMode}
              onChange={(v) => setForm((prev) => ({ ...prev, maintenanceMode: v }))}
            />

            {form.maintenanceMode && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                <p className="text-xs font-semibold text-amber-900 mb-3">
                  ⚠️ When active, mobile users on any screen will immediately be shown this maintenance message in their selected language.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* English Customization */}
                  <div className="rounded-xl border border-[#e2e8f0] bg-white p-3.5 space-y-2.5">
                    <div className="flex items-center gap-1.5 border-b border-[#f1f5f9] pb-2">
                      <span className="text-base">🇬🇧</span>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e293b]">English Notice</h3>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#64748b] mb-1">Title (English)</label>
                      <input
                        type="text"
                        value={form.maintenanceTitleEn}
                        onChange={(e) => setForm((p) => ({ ...p, maintenanceTitleEn: e.target.value }))}
                        placeholder="e.g. Under Maintenance"
                        className="w-full rounded-lg border border-[#cbd5e1] px-3 py-2 text-xs font-medium text-[#1e293b] focus:border-[#4a6d00] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#64748b] mb-1">Message (English)</label>
                      <textarea
                        rows={3}
                        value={form.maintenanceMessageEn}
                        onChange={(e) => setForm((p) => ({ ...p, maintenanceMessageEn: e.target.value }))}
                        placeholder="Explain maintenance to English users..."
                        className="w-full rounded-lg border border-[#cbd5e1] px-3 py-2 text-xs font-normal text-[#1e293b] focus:border-[#4a6d00] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* French Customization */}
                  <div className="rounded-xl border border-[#e2e8f0] bg-white p-3.5 space-y-2.5">
                    <div className="flex items-center gap-1.5 border-b border-[#f1f5f9] pb-2">
                      <span className="text-base">🇫🇷</span>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e293b]">Message Français</h3>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#64748b] mb-1">Titre (Français)</label>
                      <input
                        type="text"
                        value={form.maintenanceTitleFr}
                        onChange={(e) => setForm((p) => ({ ...p, maintenanceTitleFr: e.target.value }))}
                        placeholder="ex. Maintenance en cours"
                        className="w-full rounded-lg border border-[#cbd5e1] px-3 py-2 text-xs font-medium text-[#1e293b] focus:border-[#4a6d00] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#64748b] mb-1">Message (Français)</label>
                      <textarea
                        rows={3}
                        value={form.maintenanceMessageFr}
                        onChange={(e) => setForm((p) => ({ ...p, maintenanceMessageFr: e.target.value }))}
                        placeholder="Expliquer la maintenance aux utilisateurs francophones..."
                        className="w-full rounded-lg border border-[#cbd5e1] px-3 py-2 text-xs font-normal text-[#1e293b] focus:border-[#4a6d00] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
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
