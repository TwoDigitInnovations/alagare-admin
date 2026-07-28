import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Api } from "@/services/service";
import { toastSuccess, toastError } from "@/utils/swal";
import {
  User, ArrowLeft, Bus, Upload, Building2, Phone, Mail, FileText
} from "lucide-react";

const GREEN = "#4a6d00";

function readUser() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem("userDetail") || "null"); } catch { return null; }
}

export default function OperatorProfile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState("");

  useEffect(() => {
    const u = readUser();
    if (!u || u.role !== "operator") {
      router.replace("/login");
      return;
    }
    setUser(u);
    fetchProfile();
  }, [router]);

  const fetchProfile = () => {
    setLoading(true);
    Api("get", "operator/profile", null, router)
      .then(res => {
        const p = res?.data?.profile || {};
        setFullname(p.fullname || "");
        setEmail(p.email || "");
        setPhone(p.phone || "");
        setCompanyName(p.companyName || "");
        setDescription(p.description || "");
        setLogo(p.logo || "");
      })
      .catch(() => toastError("Failed to load profile details"))
      .finally(() => setLoading(false));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toastError("Image size must be less than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result;
      if (typeof dataUrl === "string") {
        setLogo(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!fullname.trim() || !companyName.trim()) {
      toastError("Full Name and Company Name are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fullname: fullname.trim(),
        phone: phone.trim(),
        companyName: companyName.trim(),
        description: description.trim(),
        logo: logo.trim(),
      };
      const res = await Api("put", "operator/profile", payload, router);
      toastSuccess("Profile updated successfully!");

      const currentUser = readUser() || {};
      const updatedUser = {
        ...currentUser,
        fullname: payload.fullname,
        phone: payload.phone,
      };
      localStorage.setItem("userDetail", JSON.stringify(updatedUser));

      if (res?.data?.profile) {
        setLogo(res.data.profile.logo || "");
      }
    } catch (err) {
      toastError(err?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e2e8f0] bg-white px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/operator")}
            className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3 py-2 text-xs font-medium text-[#64748b] hover:bg-[#f4f6f8]">
            <ArrowLeft size={14} /> Back
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eaf5dd]">
            <Building2 size={16} style={{ color: GREEN }} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1e293b]">Operator Profile</p>
            <p className="text-xs text-[#64748b]">Company logo, bus branding & profile settings</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
        {loading ? (
          <div className="py-20 text-center text-sm text-[#94a3b8]">Loading profile...</div>
        ) : (
          <form onSubmit={saveProfile} className="space-y-6">
            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-[#1e293b] flex items-center gap-2">
                <Bus size={18} style={{ color: GREEN }} /> Company Logo & Bus Branding
              </h2>
              <p className="mb-6 text-xs text-[#64748b]">
                This logo will be displayed on the Alagare mobile app next to your buses and trip details.
              </p>

              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                <div className="flex flex-col items-center">
                  <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#cbd5e1] bg-[#f8fafc]">
                    {logo ? (
                      <img src={logo} alt="Company Logo" className="h-full w-full object-cover" />
                    ) : (
                      <Building2 size={36} className="text-[#94a3b8]" />
                    )}
                  </div>
                  <span className="mt-2 text-[11px] font-semibold text-[#64748b]">Logo Preview</span>
                </div>

                <div className="flex-1 space-y-4 w-full">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#374151]">Company Logo Image URL / Upload File</label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input value={logo}
                        onChange={e => setLogo(e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="flex-1 rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm outline-none focus:border-[#4a6d00] focus:ring-2 focus:ring-[#4a6d00]/20" />
                      <label className="flex items-center justify-center gap-1.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-2 text-xs font-bold text-[#374151] cursor-pointer hover:bg-[#f1f5f9]">
                        <Upload size={14} /> Upload Image
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-[#1e293b] flex items-center gap-2">
                <User size={18} style={{ color: GREEN }} /> Account & Operator Information
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#374151]">
                    Operator / Company Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                    <input value={companyName} onChange={e => setCompanyName(e.target.value)} required
                      placeholder="e.g. Alagare Express"
                      className="w-full rounded-xl border border-[#e2e8f0] bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#4a6d00] focus:ring-2 focus:ring-[#4a6d00]/20" />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#374151]">
                    Account Contact Person <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                    <input value={fullname} onChange={e => setFullname(e.target.value)} required
                      placeholder="e.g. John Doe"
                      className="w-full rounded-xl border border-[#e2e8f0] bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#4a6d00] focus:ring-2 focus:ring-[#4a6d00]/20" />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#374151]">Email Address (Login)</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                    <input value={email} disabled
                      className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-2.5 pl-9 pr-4 text-sm text-[#64748b] cursor-not-allowed" />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#374151]">Contact Phone</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                    <input value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="+49 151 1234567"
                      className="w-full rounded-xl border border-[#e2e8f0] bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#4a6d00] focus:ring-2 focus:ring-[#4a6d00]/20" />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#374151]">Company Description (Shown on mobile app)</label>
                <div className="relative">
                  <FileText size={14} className="absolute left-3 top-3 text-[#94a3b8]" />
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                    placeholder="Provide a brief description of your bus service, fleet quality and safety standards..."
                    className="w-full rounded-xl border border-[#e2e8f0] bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#4a6d00] focus:ring-2 focus:ring-[#4a6d00]/20" />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button type="submit" disabled={saving}
                  className="rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md disabled:opacity-60 transition-all hover:shadow-lg"
                  style={{ backgroundColor: GREEN }}>
                  {saving ? "Saving Changes..." : "Save Profile & Branding"}
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
