import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import { AuthApi } from "@/services/service";
import { toastSuccess, toastError } from "@/utils/swal";
import { Save, User, Lock, Camera } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    phone: "",
    image: "",
    role: "admin",
  });
  const [pass, setPass] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const syncLocalUser = (user) => {
    if (!user || typeof window === "undefined") return;
    localStorage.setItem("userDetail", JSON.stringify(user));
    window.dispatchEvent(new Event("alagare-user-updated"));
  };

  useEffect(() => {
    AuthApi("get", "auth/profile", null, router)
      .then((res) => {
        const user = res?.data?.data || res?.data;
        if (user) {
          setForm({
            fullname: user.fullname || "",
            email: user.email || "",
            phone: user.phone || "",
            image: user.image || "",
            role: user.role || "admin",
          });
          setPreview(user.image || "");
          syncLocalUser(user);
        }
      })
      .catch(() => toastError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [router]);

  const onPickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!form.fullname.trim()) {
      toastError("Name is required");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("fullname", form.fullname.trim());
      fd.append("phone", form.phone.trim());
      if (imageFile) fd.append("image", imageFile);

      const res = await AuthApi("put", "auth/profile", fd, router);
      const user = res?.data?.data || res?.data;
      if (user) {
        setForm({
          fullname: user.fullname || "",
          email: user.email || "",
          phone: user.phone || "",
          image: user.image || "",
          role: user.role || "admin",
        });
        setPreview(user.image || "");
        setImageFile(null);
        syncLocalUser(user);
      }
      toastSuccess("Profile updated");
    } catch (err) {
      toastError(err?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (!pass.currentPassword || !pass.newPassword) {
      toastError("Enter current and new password");
      return;
    }
    if (pass.newPassword.length < 6) {
      toastError("New password must be at least 6 characters");
      return;
    }
    if (pass.newPassword !== pass.confirmPassword) {
      toastError("New passwords do not match");
      return;
    }
    setSavingPass(true);
    try {
      await AuthApi(
        "put",
        "auth/password",
        {
          currentPassword: pass.currentPassword,
          newPassword: pass.newPassword,
        },
        router,
      );
      setPass({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toastSuccess("Password updated");
    } catch (err) {
      toastError(err?.message || "Failed to update password");
    } finally {
      setSavingPass(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Profile">
        <p className="text-sm text-[#64748b]">Loading profile…</p>
      </AdminLayout>
    );
  }

  const initial = (form.fullname || "A").charAt(0).toUpperCase();

  return (
    <AdminLayout title="Profile">
      <div className="mx-auto max-w-2xl space-y-6">
        <form onSubmit={saveProfile} className="space-y-6">
          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
            <div className="mb-5 flex items-center gap-2">
              <User size={18} className="text-[#4a6d00]" />
              <h2 className="font-bold text-[#1e293b]">Account</h2>
            </div>

            <div className="mb-6 flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-[#4a6d00]">
                {preview ? (
                  <Image src={preview} alt="Avatar" fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                    {initial}
                  </div>
                )}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#e2e8f0] px-3 py-2 text-sm font-medium text-[#1e293b] hover:bg-[#f8fafc]"
                >
                  <Camera size={16} className="text-[#4a6d00]" />
                  Change photo
                </button>
                <p className="mt-1 text-xs text-[#94a3b8]">JPG, PNG up to 5MB</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={onPickImage}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#64748b]">Full name</label>
                <input
                  type="text"
                  value={form.fullname}
                  onChange={(e) => setForm({ ...form, fullname: e.target.value })}
                  className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#64748b]">Email</label>
                <input
                  type="email"
                  value={form.email}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#64748b]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#64748b]">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+49 ..."
                  className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#4a6d00] py-3 text-sm font-semibold text-white hover:bg-[#3d5a00] disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? "Saving…" : "Save Profile"}
            </button>
          </div>
        </form>

        <form onSubmit={savePassword} className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Lock size={18} className="text-[#4a6d00]" />
            <h2 className="font-bold text-[#1e293b]">Change Password</h2>
          </div>
          <div className="space-y-4">
            {[
              { l: "Current password", n: "currentPassword" },
              { l: "New password", n: "newPassword" },
              { l: "Confirm new password", n: "confirmPassword" },
            ].map(({ l, n }) => (
              <div key={n}>
                <label className="mb-1 block text-xs font-medium text-[#64748b]">{l}</label>
                <input
                  type="password"
                  value={pass[n]}
                  onChange={(e) => setPass({ ...pass, [n]: e.target.value })}
                  className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                />
              </div>
            ))}
          </div>
          <button
            type="submit"
            disabled={savingPass}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#4a6d00] py-3 text-sm font-semibold text-[#4a6d00] hover:bg-[#f4f8ec] disabled:opacity-60"
          >
            <Lock size={16} />
            {savingPass ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
