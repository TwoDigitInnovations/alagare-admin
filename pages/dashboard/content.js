import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import ContentEditor from "@/components/ContentEditor";
import { Api } from "@/services/service";
import { toastSuccess, toastError } from "@/utils/swal";
import { Save, FileText, Shield, HelpCircle, Plus, Trash2 } from "lucide-react";

export default function ContentPage() {
  const router = useRouter();
  const [tab, setTab] = useState("terms");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    termsTitle: "Terms of Service",
    termsBody: "",
    privacyTitle: "Privacy Policy",
    privacyBody: "",
    faqs: [],
  });

  useEffect(() => {
    Api("get", "admin/content", null, router)
      .then((res) => {
        const c = res?.data?.content;
        if (c) {
          setForm({
            termsTitle: c.termsTitle || "Terms of Service",
            termsBody: c.termsBody || "",
            privacyTitle: c.privacyTitle || "Privacy Policy",
            privacyBody: c.privacyBody || "",
            faqs: Array.isArray(c.faqs) ? c.faqs : [],
          });
        }
      })
      .catch(() => toastError("Failed to load content"))
      .finally(() => setLoading(false));
  }, [router]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await Api("put", "admin/content", form, router);
      const c = res?.data?.content;
      if (c) {
        setForm({
          termsTitle: c.termsTitle || "",
          termsBody: c.termsBody || "",
          privacyTitle: c.privacyTitle || "",
          privacyBody: c.privacyBody || "",
          faqs: Array.isArray(c.faqs) ? c.faqs : [],
        });
      }
      toastSuccess("Content saved — app will show updated text");
    } catch (err) {
      toastError(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const addFaq = () => {
    setForm((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { question: "", answer: "" }],
    }));
  };

  const updateFaq = (index, key, value) => {
    setForm((prev) => {
      const faqs = prev.faqs.map((f, i) => (i === index ? { ...f, [key]: value } : f));
      return { ...prev, faqs };
    });
  };

  const removeFaq = (index) => {
    setForm((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <AdminLayout title="Content">
        <p className="text-sm text-[#64748b]">Loading...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Content">
      <p className="mb-4 text-sm text-[#64748b]">
        Manage Terms, Privacy Policy, and FAQs shown in the mobile app.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { id: "terms", label: "Terms of Service", Icon: FileText },
          { id: "privacy", label: "Privacy Policy", Icon: Shield },
          { id: "faqs", label: "FAQs", Icon: HelpCircle },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              tab === id
                ? "bg-[#4a6d00] text-white"
                : "border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={save} className="mx-auto max-w-3xl space-y-4">
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
          {tab === "terms" && (
            <>
              <label className="mb-1 block text-xs font-medium text-[#64748b]">Title</label>
              <input
                value={form.termsTitle}
                onChange={(e) => setForm({ ...form, termsTitle: e.target.value })}
                className="mb-4 w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
              />
              <label className="mb-1 block text-xs font-medium text-[#64748b]">Body (Jodit)</label>
              <ContentEditor
                key="terms-editor"
                value={form.termsBody}
                onChange={(html) => setForm((prev) => ({ ...prev, termsBody: html }))}
                placeholder="Write Terms of Service..."
              />
            </>
          )}

          {tab === "privacy" && (
            <>
              <label className="mb-1 block text-xs font-medium text-[#64748b]">Title</label>
              <input
                value={form.privacyTitle}
                onChange={(e) => setForm({ ...form, privacyTitle: e.target.value })}
                className="mb-4 w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
              />
              <label className="mb-1 block text-xs font-medium text-[#64748b]">Body (Jodit)</label>
              <ContentEditor
                key="privacy-editor"
                value={form.privacyBody}
                onChange={(html) => setForm((prev) => ({ ...prev, privacyBody: html }))}
                placeholder="Write Privacy Policy..."
              />
            </>
          )}

          {tab === "faqs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#64748b]">
                  These FAQs appear on Help & Support in the app.
                </p>
                <button
                  type="button"
                  onClick={addFaq}
                  className="flex items-center gap-1.5 rounded-xl bg-[#eaf5dd] px-3 py-2 text-xs font-semibold text-[#4a6d00]"
                >
                  <Plus size={14} /> Add FAQ
                </button>
              </div>

              {form.faqs.length === 0 && (
                <p className="rounded-xl border border-dashed border-[#e2e8f0] py-10 text-center text-sm text-[#94a3b8]">
                  No FAQs yet. Click Add FAQ to create one.
                </p>
              )}

              {form.faqs.map((faq, index) => (
                <div
                  key={`faq-${index}`}
                  className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#64748b]">FAQ #{index + 1}</p>
                    <button
                      type="button"
                      onClick={() => removeFaq(index)}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <label className="mb-1 block text-xs font-medium text-[#64748b]">Question</label>
                  <input
                    value={faq.question}
                    onChange={(e) => updateFaq(index, "question", e.target.value)}
                    placeholder="e.g. How do I cancel my ticket?"
                    className="mb-3 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                  />
                  <label className="mb-1 block text-xs font-medium text-[#64748b]">Answer</label>
                  <textarea
                    value={faq.answer}
                    onChange={(e) => updateFaq(index, "answer", e.target.value)}
                    rows={3}
                    placeholder="Write a clear short answer..."
                    className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4a6d00] py-3 text-sm font-semibold text-white hover:bg-[#3d5a00] disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Content"}
        </button>
      </form>
    </AdminLayout>
  );
}
