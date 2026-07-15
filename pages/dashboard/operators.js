import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import { Api } from "@/services/service";
import { toastSuccess, toastError, swalConfirm } from "@/utils/swal";
import { Plus, Search, Pencil, Trash2, Building2, Star } from "lucide-react";

const emptyForm = {
  name: "",
  contact: "",
  phone: "",
  status: "active",
  rating: "4.8",
  reviewCount: "1200",
  description: "",
};

export default function OperatorsPage() {
  const router = useRouter();
  const [operators, setOperators] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Api("get", "admin/operators", null, router)
      .then((res) => setOperators(res?.data?.operators || []))
      .catch(() => toastError("Failed to load operators"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = operators.filter((o) =>
    o.name?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setModal(true);
  };

  const openEdit = (o) => {
    setEditId(o.id);
    setForm({
      name: o.name,
      contact: o.contact,
      phone: o.phone,
      status: o.status,
      rating: String(o.rating ?? 0),
      reviewCount: String(o.reviewCount ?? 0),
      description: o.description || "",
    });
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      rating: parseFloat(form.rating) || 0,
      reviewCount: parseInt(form.reviewCount, 10) || 0,
    };
    try {
      if (editId) {
        await Api("put", `admin/operators/${editId}`, payload, router);
        toastSuccess("Operator updated");
      } else {
        await Api("post", "admin/operators", payload, router);
        toastSuccess("Operator created");
      }
      setModal(false);
      load();
    } catch {
      toastError("Failed to save operator");
    }
  };

  const remove = async (id) => {
    const ok = await swalConfirm("Delete this operator?");
    if (!ok) return;
    try {
      await Api("delete", `admin/operators/${id}`, null, router);
      toastSuccess("Operator deleted");
      load();
    } catch {
      toastError("Failed to delete");
    }
  };

  return (
    <AdminLayout title="Operators">
      {loading ? (
        <p className="text-sm text-[#64748b]">Loading...</p>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search operators..."
                className="w-full rounded-xl border border-[#e2e8f0] bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#4a6d00]"
              />
            </div>
            <button
              onClick={openAdd}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#4a6d00] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3d5a00]"
            >
              <Plus size={16} /> Add Operator
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((o) => (
              <div key={o.id} className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf5dd]">
                      <Building2 size={20} className="text-[#4a6d00]" />
                    </div>
                    <div>
                      <p className="font-bold text-[#1e293b]">{o.name}</p>
                      <p className="text-xs text-[#94a3b8]">{o.contact}</p>
                    </div>
                  </div>
                  <Badge variant={o.status}>{o.status}</Badge>
                </div>
                <div className="mb-4 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-[#f26522]">
                    <Star size={14} fill="#f26522" />
                    <span className="font-bold">{o.rating}</span>
                  </div>
                  <span className="text-[#64748b]">{o.routes} routes</span>
                  <span className="text-[#64748b]">{o.phone}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(o)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-[#e2e8f0] py-2 text-xs font-medium hover:bg-[#f8fafc]"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    onClick={() => remove(o.id)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-red-200 py-2 text-xs font-medium text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-16 text-[#94a3b8]">
              <Building2 size={40} className="mb-3 opacity-40" />
              <p>No operators found</p>
            </div>
          )}
        </>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? "Edit Operator" : "Add Operator"}>
        <form onSubmit={save} className="space-y-4">
          {[
            { l: "Company Name", n: "name" },
            { l: "Contact Email", n: "contact", t: "email" },
            { l: "Phone", n: "phone" },
            { l: "Rating (0-5)", n: "rating", t: "number" },
            { l: "Review Count", n: "reviewCount", t: "number" },
          ].map(({ l, n, t }) => (
            <div key={n}>
              <label className="mb-1 block text-xs font-medium text-[#64748b]">{l}</label>
              <input
                type={t || "text"}
                value={form[n]}
                onChange={(e) => setForm({ ...form, [n]: e.target.value })}
                required={n !== "rating" && n !== "reviewCount"}
                className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
              />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-xs font-medium text-[#64748b]">Company Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="About this bus company (shown under operator on app)"
              className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#64748b]">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModal(false)}
              className="flex-1 rounded-xl border border-[#e2e8f0] py-2.5 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-[#4a6d00] py-2.5 text-sm font-semibold text-white"
            >
              {editId ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
