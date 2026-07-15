import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import { Api, ApiFormData } from "@/services/service";
import { toastSuccess, toastError } from "@/utils/swal";
import { Save, ImageIcon } from "lucide-react";

export default function HomeContentPage() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [headerFile, setHeaderFile] = useState(null);
  const [promoFile, setPromoFile] = useState(null);
  const [form, setForm] = useState({
    promoBadge: "LIMITED OFFER",
    promoTitle: "Save 20% on First Trip",
    promoDesc: "Use code FIRSTRIDE at checkout for all intercity bookings this month.",
    promoCode: "FIRSTRIDE",
    headerImage: "",
    promoImage: "",
  });

  useEffect(() => {
    Api("get", "admin/home", null, router)
      .then((res) => {
        const home = res?.data?.home;
        if (home) {
          setForm({
            promoBadge: home.promoBadge || "",
            promoTitle: home.promoTitle || "",
            promoDesc: home.promoDesc || "",
            promoCode: home.promoCode || "",
            headerImage: home.headerImage || "",
            promoImage: home.promoImage || "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("promoBadge", form.promoBadge);
    fd.append("promoTitle", form.promoTitle);
    fd.append("promoDesc", form.promoDesc);
    fd.append("promoCode", form.promoCode);
    if (headerFile) fd.append("headerImage", headerFile);
    if (promoFile) fd.append("promoImage", promoFile);
    try {
      const res = await ApiFormData("put", "admin/home", fd, router);
      const home = res?.data?.home;
      if (home) {
        setForm((prev) => ({
          ...prev,
          headerImage: home.headerImage || prev.headerImage,
          promoImage: home.promoImage || prev.promoImage,
        }));
      }
      setHeaderFile(null);
      setPromoFile(null);
      setSaved(true);
      toastSuccess("Home content saved");
      setTimeout(() => setSaved(false), 2500);
    } catch {
      toastError("Failed to save");
    }
  };

  if (loading) {
    return (
      <AdminLayout title="App Home">
        <p className="text-sm text-[#64748b]">Loading...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="App Home">
      <form onSubmit={save} className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <ImageIcon size={18} className="text-[#4a6d00]" />
            <h2 className="font-bold text-[#1e293b]">Header Image</h2>
          </div>
          {form.headerImage && (
            <div className="relative mb-3 h-36 w-full overflow-hidden rounded-xl">
              <Image src={form.headerImage} alt="Header" fill className="object-cover" />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setHeaderFile(e.target.files?.[0] || null)}
            className="w-full text-sm"
          />
        </div>

        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <ImageIcon size={18} className="text-[#4a6d00]" />
            <h2 className="font-bold text-[#1e293b]">Promo Banner</h2>
          </div>
          {form.promoImage && (
            <div className="relative mb-3 h-36 w-full overflow-hidden rounded-xl">
              <Image src={form.promoImage} alt="Promo" fill className="object-cover" />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPromoFile(e.target.files?.[0] || null)}
            className="mb-4 w-full text-sm"
          />
          {[
            { l: "Badge Text", n: "promoBadge" },
            { l: "Title", n: "promoTitle" },
            { l: "Description", n: "promoDesc" },
            { l: "Promo Code", n: "promoCode" },
          ].map(({ l, n }) => (
            <div key={n} className="mb-3">
              <label className="mb-1 block text-xs font-medium text-[#64748b]">{l}</label>
              <input
                value={form[n]}
                onChange={(e) => setForm({ ...form, [n]: e.target.value })}
                className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4a6d00] py-3 text-sm font-semibold text-white hover:bg-[#3d5a00]"
        >
          <Save size={16} />
          {saved ? "Saved!" : "Save Home Content"}
        </button>
      </form>
    </AdminLayout>
  );
}
