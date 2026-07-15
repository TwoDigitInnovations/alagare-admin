import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import { Api } from "@/services/service";
import { toastSuccess, toastError, swalConfirm } from "@/utils/swal";
import { Plus, Search, Pencil, Trash2, Bus } from "lucide-react";

const emptyForm = {
  name: "",
  status: "active",
  rowCount: "10",
  seatsPerSide: "2",
  totalSeats: "40",
};

export default function BusTypesPage() {
  const router = useRouter();
  const [types, setTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Api("get", "admin/bus-types", null, router)
      .then((res) => setTypes(res?.data?.busTypes || []))
      .catch(() => toastError("Failed to load bus types"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = types.filter((t) =>
    t.name?.toLowerCase().includes(search.toLowerCase())
  );

  const setLayoutField = (name, value) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      const rows = Number(name === "rowCount" ? value : next.rowCount);
      const perSide = Number(name === "seatsPerSide" ? value : next.seatsPerSide);
      if (rows > 0 && perSide > 0) {
        next.totalSeats = String(rows * perSide * 2);
      }
      return next;
    });
  };

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setModal(true);
  };

  const openEdit = (t) => {
    setEditId(t.id);
    setForm({
      name: t.name,
      status: t.status,
      rowCount: String(t.rowCount || 10),
      seatsPerSide: String(t.seatsPerSide || 2),
      totalSeats: String(t.totalSeats || (t.rowCount || 10) * (t.seatsPerSide || 2) * 2),
    });
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      status: form.status,
      rowCount: parseInt(form.rowCount, 10) || 10,
      seatsPerSide: parseInt(form.seatsPerSide, 10) || 2,
      totalSeats: parseInt(form.totalSeats, 10) || 40,
    };
    try {
      if (editId) {
        await Api("put", `admin/bus-types/${editId}`, payload, router);
        toastSuccess("Bus type updated");
      } else {
        await Api("post", "admin/bus-types", payload, router);
        toastSuccess("Bus type created");
      }
      setModal(false);
      load();
    } catch (err) {
      toastError(err?.message || "Failed to save");
    }
  };

  const remove = async (id) => {
    const ok = await swalConfirm("Delete this bus type?");
    if (!ok) return;
    try {
      await Api("delete", `admin/bus-types/${id}`, null, router);
      toastSuccess("Bus type deleted");
      load();
    } catch {
      toastError("Failed to delete");
    }
  };

  return (
    <AdminLayout title="Bus Types">
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
                placeholder="Search bus types..."
                className="w-full rounded-xl border border-[#e2e8f0] bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#4a6d00]"
              />
            </div>
            <button
              onClick={openAdd}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#4a6d00] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3d5a00]"
            >
              <Plus size={16} /> Add Bus Type
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-left text-xs text-[#64748b]">
                  {["Name", "Layout", "Seats", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b border-[#f8fafc] hover:bg-[#fafafa]">
                    <td className="px-4 py-3 font-semibold text-[#1e293b]">{t.name}</td>
                    <td className="px-4 py-3 text-[#64748b]">
                      {t.rowCount || 10} rows × {t.seatsPerSide || 2}+{t.seatsPerSide || 2}
                    </td>
                    <td className="px-4 py-3 text-[#64748b]">{t.totalSeats || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={t.status}>{t.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(t)} className="rounded-lg p-1.5 hover:bg-[#eaf5dd]">
                          <Pencil size={15} className="text-[#4a6d00]" />
                        </button>
                        <button onClick={() => remove(t.id)} className="rounded-lg p-1.5 hover:bg-red-50">
                          <Trash2 size={15} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center py-16 text-[#94a3b8]">
                <Bus size={40} className="mb-3 opacity-40" />
                <p>No bus types found</p>
              </div>
            )}
          </div>
        </>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? "Edit Bus Type" : "Add Bus Type"}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#64748b]">Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. AC Sleeper"
              className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#64748b]">Rows</label>
              <input
                type="number"
                min="1"
                required
                value={form.rowCount}
                onChange={(e) => setLayoutField("rowCount", e.target.value)}
                className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#64748b]">Seats per side</label>
              <input
                type="number"
                min="1"
                required
                value={form.seatsPerSide}
                onChange={(e) => setLayoutField("seatsPerSide", e.target.value)}
                className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
              />
            </div>
          </div>
          <p className="text-[11px] text-[#94a3b8]">
            Layout: {form.rowCount || "?"} rows × {form.seatsPerSide || "?"}+{form.seatsPerSide || "?"} (aisle) = {form.totalSeats || "?"} seats
          </p>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#64748b]">Total Seats (auto)</label>
            <input
              type="number"
              min="1"
              required
              value={form.totalSeats}
              onChange={(e) => setForm({ ...form, totalSeats: e.target.value })}
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
            <button type="button" onClick={() => setModal(false)} className="flex-1 rounded-xl border border-[#e2e8f0] py-2.5 text-sm">
              Cancel
            </button>
            <button type="submit" className="flex-1 rounded-xl bg-[#4a6d00] py-2.5 text-sm font-semibold text-white">
              {editId ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
