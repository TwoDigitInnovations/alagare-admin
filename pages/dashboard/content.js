import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import ContentEditor from "@/components/ContentEditor";
import { Api } from "@/services/service";
import { toastSuccess, toastError, swalConfirm } from "@/utils/swal";
import { Save, FileText, Shield, HelpCircle, Plus, Trash2, Globe } from "lucide-react";

export default function ContentPage() {
  const router = useRouter();
  const [tab, setTab] = useState("terms");
  const [editLang, setEditLang] = useState("en"); // 'en' | 'fr'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    termsTitleEn: "Terms of Service",
    termsTitleFr: "Conditions Générales d'Utilisation",
    termsBodyEn: "",
    termsBodyFr: "",

    privacyTitleEn: "Privacy Policy",
    privacyTitleFr: "Politique de Confidentialité",
    privacyBodyEn: "",
    privacyBodyFr: "",

    operatorTermsTitleEn: "Operator Terms of Service",
    operatorTermsTitleFr: "Conditions Générales Partenaires Transporteurs",
    operatorTermsBodyEn: "",
    operatorTermsBodyFr: "",

    operatorPrivacyTitleEn: "Operator Privacy Policy",
    operatorPrivacyTitleFr: "Politique de Confidentialité Partenaires",
    operatorPrivacyBodyEn: "",
    operatorPrivacyBodyFr: "",

    faqs: [],
    operatorFaqs: [],
  });

  useEffect(() => {
    Api("get", "admin/content", null, router)
      .then((res) => {
        const c = res?.data?.content || res?.content;
        if (c) {
          setForm({
            termsTitleEn: c.termsTitleEn || c.termsTitle || "Terms of Service",
            termsTitleFr: c.termsTitleFr || "Conditions Générales d'Utilisation",
            termsBodyEn: c.termsBodyEn || c.termsBody || "",
            termsBodyFr: c.termsBodyFr || "",

            privacyTitleEn: c.privacyTitleEn || c.privacyTitle || "Privacy Policy",
            privacyTitleFr: c.privacyTitleFr || "Politique de Confidentialité",
            privacyBodyEn: c.privacyBodyEn || c.privacyBody || "",
            privacyBodyFr: c.privacyBodyFr || "",

            operatorTermsTitleEn: c.operatorTermsTitleEn || c.operatorTermsTitle || "Operator Terms of Service",
            operatorTermsTitleFr: c.operatorTermsTitleFr || "Conditions Générales Partenaires Transporteurs",
            operatorTermsBodyEn: c.operatorTermsBodyEn || c.operatorTermsBody || "",
            operatorTermsBodyFr: c.operatorTermsBodyFr || "",

            operatorPrivacyTitleEn: c.operatorPrivacyTitleEn || c.operatorPrivacyTitle || "Operator Privacy Policy",
            operatorPrivacyTitleFr: c.operatorPrivacyTitleFr || "Politique de Confidentialité Partenaires",
            operatorPrivacyBodyEn: c.operatorPrivacyBodyEn || c.operatorPrivacyBody || "",
            operatorPrivacyBodyFr: c.operatorPrivacyBodyFr || "",

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
      const payload = {
        ...form,
        termsTitle: form.termsTitleEn,
        termsBody: form.termsBodyEn,
        privacyTitle: form.privacyTitleEn,
        privacyBody: form.privacyBodyEn,
        operatorTermsTitle: form.operatorTermsTitleEn,
        operatorTermsBody: form.operatorTermsBodyEn,
        operatorPrivacyTitle: form.operatorPrivacyTitleEn,
        operatorPrivacyBody: form.operatorPrivacyBodyEn,
      };

      const res = await Api("put", "admin/content", payload, router);
      const c = res?.data?.content || res?.content;
      if (c) {
        setForm({
          termsTitleEn: c.termsTitleEn || c.termsTitle || "",
          termsTitleFr: c.termsTitleFr || "",
          termsBodyEn: c.termsBodyEn || c.termsBody || "",
          termsBodyFr: c.termsBodyFr || "",

          privacyTitleEn: c.privacyTitleEn || c.privacyTitle || "",
          privacyTitleFr: c.privacyTitleFr || "",
          privacyBodyEn: c.privacyBodyEn || c.privacyBody || "",
          privacyBodyFr: c.privacyBodyFr || "",

          operatorTermsTitleEn: c.operatorTermsTitleEn || c.operatorTermsTitle || "",
          operatorTermsTitleFr: c.operatorTermsTitleFr || "",
          operatorTermsBodyEn: c.operatorTermsBodyEn || c.operatorTermsBody || "",
          operatorTermsBodyFr: c.operatorTermsBodyFr || "",

          operatorPrivacyTitleEn: c.operatorPrivacyTitleEn || c.operatorPrivacyTitle || "",
          operatorPrivacyTitleFr: c.operatorPrivacyTitleFr || "",
          operatorPrivacyBodyEn: c.operatorPrivacyBodyEn || c.operatorPrivacyBody || "",
          operatorPrivacyBodyFr: c.operatorPrivacyBodyFr || "",

          faqs: Array.isArray(c.faqs) ? c.faqs : [],
          operatorFaqs: Array.isArray(c.operatorFaqs) ? c.operatorFaqs : [],
        });
      }
      toastSuccess("Content saved — English and French versions updated successfully");
    } catch (err) {
      toastError(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const addFaq = () => {
    setForm((prev) => ({
      ...prev,
      faqs: [
        ...prev.faqs,
        {
          questionEn: "",
          answerEn: "",
          questionFr: "",
          answerFr: "",
          question: "",
          answer: "",
        },
      ],
    }));
  };

  const updateFaq = (index, key, value) => {
    setForm((prev) => {
      const faqs = prev.faqs.map((f, i) => {
        if (i === index) {
          const updated = { ...f, [key]: value };
          if (key === "questionEn") updated.question = value;
          if (key === "answerEn") updated.answer = value;
          return updated;
        }
        return f;
      });
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
      operatorFaqs: [
        ...(prev.operatorFaqs || []),
        {
          questionEn: "",
          answerEn: "",
          questionFr: "",
          answerFr: "",
          question: "",
          answer: "",
        },
      ],
    }));
  };

  const updateOperatorFaq = (index, key, value) => {
    setForm((prev) => {
      const operatorFaqs = (prev.operatorFaqs || []).map((f, i) => {
        if (i === index) {
          const updated = { ...f, [key]: value };
          if (key === "questionEn") updated.question = value;
          if (key === "answerEn") updated.answer = value;
          return updated;
        }
        return f;
      });
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
        <p className="text-sm text-[#64748b]">Loading content...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Content">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#64748b]">
          Manage Passenger App & Operator Partner Terms, Privacy Policies, and FAQs in English & French.
        </p>

        {/* Global Language Toggle for Editors */}
        <div className="flex items-center gap-1 self-start rounded-xl border border-[#e2e8f0] bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setEditLang("en")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              editLang === "en"
                ? "bg-[#4a6d00] text-white shadow-sm"
                : "text-[#64748b] hover:bg-[#f8fafc]"
            }`}
          >
            <span>🇬🇧</span> English
          </button>
          <button
            type="button"
            onClick={() => setEditLang("fr")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              editLang === "fr"
                ? "bg-[#4a6d00] text-white shadow-sm"
                : "text-[#64748b] hover:bg-[#f8fafc]"
            }`}
          >
            <span>🇫🇷</span> Français
          </button>
        </div>
      </div>

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

      <form onSubmit={save} className="mx-auto max-w-4xl space-y-4">
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
          {/* Active Language Notice */}
          <div className="mb-4 flex items-center justify-between rounded-xl bg-[#f8fafc] border border-[#e2e8f0] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-[#4a6d00]" />
              <span className="text-xs font-medium text-[#475569]">
                Currently Editing: <strong className="text-[#1e293b]">{editLang === "en" ? "🇬🇧 English Version" : "🇫🇷 French Version (Français)"}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setEditLang("en")}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  editLang === "en" ? "bg-[#eaf5dd] text-[#4a6d00]" : "text-[#94a3b8]"
                }`}
              >
                🇬🇧 EN
              </button>
              <button
                type="button"
                onClick={() => setEditLang("fr")}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  editLang === "fr" ? "bg-[#eaf5dd] text-[#4a6d00]" : "text-[#94a3b8]"
                }`}
              >
                🇫🇷 FR
              </button>
            </div>
          </div>

          {/* Passenger App Terms */}
          {tab === "terms" && (
            <>
              {editLang === "en" ? (
                <>
                  <label className="mb-1 block text-xs font-semibold text-[#64748b]">
                    🇬🇧 Passenger Terms Title (English)
                  </label>
                  <input
                    value={form.termsTitleEn}
                    onChange={(e) => setForm({ ...form, termsTitleEn: e.target.value })}
                    placeholder="e.g. Terms of Service"
                    className="mb-4 w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                  />
                  <label className="mb-1 block text-xs font-semibold text-[#64748b]">
                    🇬🇧 Terms Content (English)
                  </label>
                  <ContentEditor
                    key="terms-editor-en"
                    value={form.termsBodyEn}
                    onChange={(html) => setForm((prev) => ({ ...prev, termsBodyEn: html }))}
                    placeholder="Write Passenger Terms of Service in English..."
                  />
                </>
              ) : (
                <>
                  <label className="mb-1 block text-xs font-semibold text-[#64748b]">
                    🇫🇷 Passenger Terms Title (Français)
                  </label>
                  <input
                    value={form.termsTitleFr}
                    onChange={(e) => setForm({ ...form, termsTitleFr: e.target.value })}
                    placeholder="e.g. Conditions Générales d'Utilisation"
                    className="mb-4 w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                  />
                  <label className="mb-1 block text-xs font-semibold text-[#64748b]">
                    🇫🇷 Contenu des Conditions (Français)
                  </label>
                  <ContentEditor
                    key="terms-editor-fr"
                    value={form.termsBodyFr}
                    onChange={(html) => setForm((prev) => ({ ...prev, termsBodyFr: html }))}
                    placeholder="Rédigez les Conditions Générales en français..."
                  />
                </>
              )}
            </>
          )}

          {/* Passenger App Privacy */}
          {tab === "privacy" && (
            <>
              {editLang === "en" ? (
                <>
                  <label className="mb-1 block text-xs font-semibold text-[#64748b]">
                    🇬🇧 Passenger Privacy Title (English)
                  </label>
                  <input
                    value={form.privacyTitleEn}
                    onChange={(e) => setForm({ ...form, privacyTitleEn: e.target.value })}
                    placeholder="e.g. Privacy Policy"
                    className="mb-4 w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                  />
                  <label className="mb-1 block text-xs font-semibold text-[#64748b]">
                    🇬🇧 Privacy Policy Content (English)
                  </label>
                  <ContentEditor
                    key="privacy-editor-en"
                    value={form.privacyBodyEn}
                    onChange={(html) => setForm((prev) => ({ ...prev, privacyBodyEn: html }))}
                    placeholder="Write Passenger Privacy Policy in English..."
                  />
                </>
              ) : (
                <>
                  <label className="mb-1 block text-xs font-semibold text-[#64748b]">
                    🇫🇷 Passenger Privacy Title (Français)
                  </label>
                  <input
                    value={form.privacyTitleFr}
                    onChange={(e) => setForm({ ...form, privacyTitleFr: e.target.value })}
                    placeholder="e.g. Politique de Confidentialité"
                    className="mb-4 w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                  />
                  <label className="mb-1 block text-xs font-semibold text-[#64748b]">
                    🇫🇷 Contenu de la Politique de Confidentialité (Français)
                  </label>
                  <ContentEditor
                    key="privacy-editor-fr"
                    value={form.privacyBodyFr}
                    onChange={(html) => setForm((prev) => ({ ...prev, privacyBodyFr: html }))}
                    placeholder="Rédigez la Politique de Confidentialité en français..."
                  />
                </>
              )}
            </>
          )}

          {/* Operator Terms */}
          {tab === "operator-terms" && (
            <>
              {editLang === "en" ? (
                <>
                  <label className="mb-1 block text-xs font-semibold text-[#64748b]">
                    🇬🇧 Operator Partner Terms Title (English)
                  </label>
                  <input
                    value={form.operatorTermsTitleEn}
                    onChange={(e) => setForm({ ...form, operatorTermsTitleEn: e.target.value })}
                    placeholder="e.g. Operator Terms of Service"
                    className="mb-4 w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                  />
                  <label className="mb-1 block text-xs font-semibold text-[#64748b]">
                    🇬🇧 Operator Terms Content (English)
                  </label>
                  <ContentEditor
                    key="op-terms-editor-en"
                    value={form.operatorTermsBodyEn}
                    onChange={(html) => setForm((prev) => ({ ...prev, operatorTermsBodyEn: html }))}
                    placeholder="Write Operator Terms of Service in English..."
                  />
                </>
              ) : (
                <>
                  <label className="mb-1 block text-xs font-semibold text-[#64748b]">
                    🇫🇷 Operator Partner Terms Title (Français)
                  </label>
                  <input
                    value={form.operatorTermsTitleFr}
                    onChange={(e) => setForm({ ...form, operatorTermsTitleFr: e.target.value })}
                    placeholder="e.g. Conditions Générales Partenaires Transporteurs"
                    className="mb-4 w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                  />
                  <label className="mb-1 block text-xs font-semibold text-[#64748b]">
                    🇫🇷 Contenu des Conditions Transporteurs (Français)
                  </label>
                  <ContentEditor
                    key="op-terms-editor-fr"
                    value={form.operatorTermsBodyFr}
                    onChange={(html) => setForm((prev) => ({ ...prev, operatorTermsBodyFr: html }))}
                    placeholder="Rédigez les Conditions Générales Partenaires en français..."
                  />
                </>
              )}
            </>
          )}

          {/* Operator Privacy */}
          {tab === "operator-privacy" && (
            <>
              {editLang === "en" ? (
                <>
                  <label className="mb-1 block text-xs font-semibold text-[#64748b]">
                    🇬🇧 Operator Partner Privacy Title (English)
                  </label>
                  <input
                    value={form.operatorPrivacyTitleEn}
                    onChange={(e) => setForm({ ...form, operatorPrivacyTitleEn: e.target.value })}
                    placeholder="e.g. Operator Privacy Policy"
                    className="mb-4 w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                  />
                  <label className="mb-1 block text-xs font-semibold text-[#64748b]">
                    🇬🇧 Operator Privacy Content (English)
                  </label>
                  <ContentEditor
                    key="op-privacy-editor-en"
                    value={form.operatorPrivacyBodyEn}
                    onChange={(html) => setForm((prev) => ({ ...prev, operatorPrivacyBodyEn: html }))}
                    placeholder="Write Operator Privacy Policy in English..."
                  />
                </>
              ) : (
                <>
                  <label className="mb-1 block text-xs font-semibold text-[#64748b]">
                    🇫🇷 Operator Partner Privacy Title (Français)
                  </label>
                  <input
                    value={form.operatorPrivacyTitleFr}
                    onChange={(e) => setForm({ ...form, operatorPrivacyTitleFr: e.target.value })}
                    placeholder="e.g. Politique de Confidentialité Partenaires"
                    className="mb-4 w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                  />
                  <label className="mb-1 block text-xs font-semibold text-[#64748b]">
                    🇫🇷 Contenu de la Politique Partenaires (Français)
                  </label>
                  <ContentEditor
                    key="op-privacy-editor-fr"
                    value={form.operatorPrivacyBodyFr}
                    onChange={(html) => setForm((prev) => ({ ...prev, operatorPrivacyBodyFr: html }))}
                    placeholder="Rédigez la Politique de Confidentialité Partenaires en français..."
                  />
                </>
              )}
            </>
          )}

          {/* App FAQs */}
          {tab === "faqs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#64748b]">
                  These FAQs appear on Help & Support in the passenger mobile app (Bilingual).
                </p>
                <button
                  type="button"
                  onClick={addFaq}
                  className="flex items-center gap-1.5 rounded-xl bg-[#eaf5dd] px-3.5 py-2 text-xs font-semibold text-[#4a6d00] hover:bg-[#d8edbe] transition"
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
                  className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#1e293b]">App FAQ #{index + 1}</p>
                    <button
                      type="button"
                      onClick={() => removeFaq(index)}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition"
                      title="Delete FAQ"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#475569]">
                        🇬🇧 Question (English)
                      </label>
                      <input
                        value={faq.questionEn ?? faq.question ?? ""}
                        onChange={(e) => updateFaq(index, "questionEn", e.target.value)}
                        placeholder="e.g. How do I cancel my ticket?"
                        className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm outline-none focus:border-[#4a6d00]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#475569]">
                        🇫🇷 Question (Français)
                      </label>
                      <input
                        value={faq.questionFr ?? ""}
                        onChange={(e) => updateFaq(index, "questionFr", e.target.value)}
                        placeholder="e.g. Comment annuler mon billet ?"
                        className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm outline-none focus:border-[#4a6d00]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#475569]">
                        🇬🇧 Answer (English)
                      </label>
                      <textarea
                        value={faq.answerEn ?? faq.answer ?? ""}
                        onChange={(e) => updateFaq(index, "answerEn", e.target.value)}
                        rows={3}
                        placeholder="Write a clear short answer in English..."
                        className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm outline-none focus:border-[#4a6d00]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#475569]">
                        🇫🇷 Réponse (Français)
                      </label>
                      <textarea
                        value={faq.answerFr ?? ""}
                        onChange={(e) => updateFaq(index, "answerFr", e.target.value)}
                        rows={3}
                        placeholder="Rédigez une réponse claire en français..."
                        className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm outline-none focus:border-[#4a6d00]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Operator FAQs */}
          {tab === "operator-faqs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#64748b]">
                  These FAQs appear on the Operator Partner Portal website (Bilingual).
                </p>
                <button
                  type="button"
                  onClick={addOperatorFaq}
                  className="flex items-center gap-1.5 rounded-xl bg-[#eaf5dd] px-3.5 py-2 text-xs font-semibold text-[#4a6d00] hover:bg-[#d8edbe] transition"
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
                  className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#1e293b]">Operator FAQ #{index + 1}</p>
                    <button
                      type="button"
                      onClick={() => removeOperatorFaq(index)}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition"
                      title="Delete Operator FAQ"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#475569]">
                        🇬🇧 Question (English)
                      </label>
                      <input
                        value={faq.questionEn ?? faq.question ?? ""}
                        onChange={(e) => updateOperatorFaq(index, "questionEn", e.target.value)}
                        placeholder="e.g. How do payout settlements work?"
                        className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm outline-none focus:border-[#4a6d00]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#475569]">
                        🇫🇷 Question (Français)
                      </label>
                      <input
                        value={faq.questionFr ?? ""}
                        onChange={(e) => updateOperatorFaq(index, "questionFr", e.target.value)}
                        placeholder="e.g. Comment fonctionnent les versements ?"
                        className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm outline-none focus:border-[#4a6d00]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#475569]">
                        🇬🇧 Answer (English)
                      </label>
                      <textarea
                        value={faq.answerEn ?? faq.answer ?? ""}
                        onChange={(e) => updateOperatorFaq(index, "answerEn", e.target.value)}
                        rows={3}
                        placeholder="Write a clear short answer for operators..."
                        className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm outline-none focus:border-[#4a6d00]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#475569]">
                        🇫🇷 Réponse (Français)
                      </label>
                      <textarea
                        value={faq.answerFr ?? ""}
                        onChange={(e) => updateOperatorFaq(index, "answerFr", e.target.value)}
                        rows={3}
                        placeholder="Rédigez une réponse claire pour les transporteurs..."
                        className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm outline-none focus:border-[#4a6d00]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4a6d00] py-3.5 text-sm font-semibold text-white shadow-md hover:bg-[#3d5a00] disabled:opacity-60 transition"
        >
          <Save size={16} />
          {saving ? "Saving All Languages..." : "Save Content (All Languages)"}
        </button>
      </form>
    </AdminLayout>
  );
}
