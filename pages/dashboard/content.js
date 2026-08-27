import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import ContentEditor from "@/components/ContentEditor";
import { Api } from "@/services/service";
import { toastSuccess, toastError, swalConfirm } from "@/utils/swal";
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
    operatorTermsTitle: "Operator Terms of Service",
    operatorTermsBody: "",
    operatorPrivacyTitle: "Operator Privacy Policy",
    operatorPrivacyBody: "",
    faqs: [],
    operatorFaqs: [],
  });

  useEffect(() => {
    Api("get", "admin/content", null, router)
      .then((res) => {
        const c = res?.data?.content || res?.content;
        if (c) {
          setForm({
            termsTitle: c.termsTitle || "Terms of Service",
            termsBody: c.termsBody || "",
            privacyTitle: c.privacyTitle || "Privacy Policy",
            privacyBody: c.privacyBody || "",
            operatorTermsTitle: c.operatorTermsTitle || "Operator Terms of Service",
            operatorTermsBody: c.operatorTermsBody || "",
            operatorPrivacyTitle: c.operatorPrivacyTitle || "Operator Privacy Policy",
            operatorPrivacyBody: c.operatorPrivacyBody || "",
            faqs: Array.isArray(c.faqs) ? c.faqs : [],
            operatorFaqs: Array.isArray(c.operatorFaqs) ? c.operatorFaqs : [],
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
      const c = res?.data?.content || res?.content;
      if (c) {
        setForm({
          termsTitle: c.termsTitle || "",
          termsBody: c.termsBody || "",
          privacyTitle: c.privacyTitle || "",
          privacyBody: c.privacyBody || "",
          operatorTermsTitle: c.operatorTermsTitle || "",
          operatorTermsBody: c.operatorTermsBody || "",
          operatorPrivacyTitle: c.operatorPrivacyTitle || "",
          operatorPrivacyBody: c.operatorPrivacyBody || "",
          faqs: Array.isArray(c.faqs) ? c.faqs : [],
          operatorFaqs: Array.isArray(c.operatorFaqs) ? c.operatorFaqs : [],
        });
      }
      toastSuccess("Content saved — app and website will show updated text");
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

  const removeFaq = async (index) => {
    const ok = await swalConfirm("Delete FAQ?", "Are you sure you want to delete this question?");
    if (!ok) return;
    setForm((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
  };

  const addOperatorFaq = () => {
    setForm((prev) => ({
      ...prev,
      operatorFaqs: [...(prev.operatorFaqs || []), { question: "", answer: "" }],
    }));
  };

  const updateOperatorFaq = (index, key, value) => {
    setForm((prev) => {
      const operatorFaqs = (prev.operatorFaqs || []).map((f, i) => (i === index ? { ...f, [key]: value } : f));
      return { ...prev, operatorFaqs };
    });
  };

  const removeOperatorFaq = async (index) => {
    const ok = await swalConfirm("Delete FAQ?", "Are you sure you want to delete this question?");
    if (!ok) return;
    setForm((prev) => ({
      ...prev,
      operatorFaqs: (prev.operatorFaqs || []).filter((_, i) => i !== index),
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
        Manage Passenger App & Operator Partner Terms, Privacy Policies, and FAQs.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { id: "terms", label: "App Terms", Icon: FileText },
          { id: "privacy", label: "App Privacy", Icon: Shield },
          { id: "faqs", label: "App FAQs", Icon: HelpCircle },
          { id: "operator-terms", label: "Operator Terms", Icon: FileText },
          { id: "operator-privacy", label: "Operator Privacy", Icon: Shield },
          { id: "operator-faqs", label: "Operator FAQs", Icon: HelpCircle },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              tab === id
                ? "bg-[#4a6d00] text-white shadow-sm"
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
              <label className="mb-1 block text-xs font-medium text-[#64748b]">Passenger Terms Title</label>
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
                placeholder="Write Passenger Terms of Service..."
              />
            </>
          )}

          {tab === "privacy" && (
            <>
              <label className="mb-1 block text-xs font-medium text-[#64748b]">Passenger Privacy Title</label>
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
                placeholder="Write Passenger Privacy Policy..."
              />
            </>
          )}

          {tab === "operator-terms" && (
            <>
              <label className="mb-1 block text-xs font-medium text-[#64748b]">Operator Partner Terms Title</label>
              <input
                value={form.operatorTermsTitle}
                onChange={(e) => setForm({ ...form, operatorTermsTitle: e.target.value })}
                className="mb-4 w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
              />
              <label className="mb-1 block text-xs font-medium text-[#64748b]">Body (Jodit)</label>
              <ContentEditor
                key="op-terms-editor"
                value={form.operatorTermsBody}
                onChange={(html) => setForm((prev) => ({ ...prev, operatorTermsBody: html }))}
                placeholder="Write Operator Partner Terms of Service..."
              />
            </>
          )}

          {tab === "operator-privacy" && (
            <>
              <label className="mb-1 block text-xs font-medium text-[#64748b]">Operator Partner Privacy Title</label>
              <input
                value={form.operatorPrivacyTitle}
                onChange={(e) => setForm({ ...form, operatorPrivacyTitle: e.target.value })}
                className="mb-4 w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
              />
              <label className="mb-1 block text-xs font-medium text-[#64748b]">Body (Jodit)</label>
              <ContentEditor
                key="op-privacy-editor"
                value={form.operatorPrivacyBody}
                onChange={(html) => setForm((prev) => ({ ...prev, operatorPrivacyBody: html }))}
                placeholder="Write Operator Partner Privacy Policy..."
              />
            </>
          )}

          {tab === "faqs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#64748b]">
                  These FAQs appear on Help & Support in the passenger mobile app.
                </p>
                <button
                  type="button"
                  onClick={addFaq}
                  className="flex items-center gap-1.5 rounded-xl bg-[#eaf5dd] px-3 py-2 text-xs font-semibold text-[#4a6d00]"
                >
                  <Plus size={14} /> Add App FAQ
                </button>
              </div>

              {form.faqs.length === 0 && (
                <p className="rounded-xl border border-dashed border-[#e2e8f0] py-10 text-center text-sm text-[#94a3b8]">
                  No Passenger FAQs yet. Click Add App FAQ to create one.
                </p>
              )}

              {form.faqs.map((faq, index) => (
                <div
                  key={`faq-${index}`}
                  className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#64748b]">App FAQ #{index + 1}</p>
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

          {tab === "operator-faqs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#64748b]">
                  These FAQs appear on the Operator Partner Portal website.
                </p>
                <button
                  type="button"
                  onClick={addOperatorFaq}
                  className="flex items-center gap-1.5 rounded-xl bg-[#eaf5dd] px-3 py-2 text-xs font-semibold text-[#4a6d00]"
                >
                  <Plus size={14} /> Add Operator FAQ
                </button>
              </div>

              {(form.operatorFaqs || []).length === 0 && (
                <p className="rounded-xl border border-dashed border-[#e2e8f0] py-10 text-center text-sm text-[#94a3b8]">
                  No Operator FAQs yet. Click Add Operator FAQ to create one.
                </p>
              )}

              {(form.operatorFaqs || []).map((faq, index) => (
                <div
                  key={`op-faq-${index}`}
                  className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#64748b]">Operator FAQ #{index + 1}</p>
                    <button
                      type="button"
                      onClick={() => removeOperatorFaq(index)}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <label className="mb-1 block text-xs font-medium text-[#64748b]">Question</label>
                  <input
                    value={faq.question}
                    onChange={(e) => updateOperatorFaq(index, "question", e.target.value)}
                    placeholder="e.g. How do payout settlements work?"
                    className="mb-3 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                  />
                  <label className="mb-1 block text-xs font-medium text-[#64748b]">Answer</label>
                  <textarea
                    value={faq.answer}
                    onChange={(e) => updateOperatorFaq(index, "answer", e.target.value)}
                    rows={3}
                    placeholder="Write a clear short answer for operators..."
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
