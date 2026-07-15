import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import { Api } from "@/services/service";
import { toastSuccess, toastError, swalConfirm } from "@/utils/swal";
import { searchBusPlaces } from "@/utils/placeSearch";
import { Plus, Search, Pencil, Trash2, MapPin } from "lucide-react";
import axios from "axios";

const emptyForm = { name: "", country: "", status: "active" };

export default function CitiesPage() {
  const router = useRouter();
  const [cities, setCities] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [photonQ, setPhotonQ] = useState("");
  const [photonResults, setPhotonResults] = useState([]);
  const [photonLoading, setPhotonLoading] = useState(false);
  const debounceRef = useRef(null);

  const load = () => {
    Api("get", "admin/cities", null, router)
      .then((res) => setCities(res?.data?.cities || []))
      .catch(() => toastError("Failed to load cities"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!modal || editId || photonQ.trim().length < 2) {
      setPhotonResults([]);
      return;
    }
    setPhotonLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        setPhotonResults(await searchBusPlaces(photonQ, 14, axios));
      } catch {
        setPhotonResults([]);
      } finally {
        setPhotonLoading(false);
      }
    }, 350);
  }, [photonQ, modal, editId]);

  const filtered = cities.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.country?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setPhotonQ("");
    setPhotonResults([]);
    setModal(true);
  };

  const openEdit = (c) => {
    setEditId(c.id);
    setForm({ name: c.name, country: c.country || "", status: c.status });
    setModal(true);
  };

  const pickPhoton = (p) => {
    const name = p.parentCity ? `${p.name}, ${p.parentCity}` : p.name;
    setForm({ ...form, name, country: p.country || "India" });
    setPhotonQ(p.label || name);
    setPhotonResults([]);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await Api("put", `admin/cities/${editId}`, form, router);
        toastSuccess("City updated");
      } else {
        await Api("post", "admin/cities", form, router);
        toastSuccess("City created");
      }
      setModal(false);
      load();
    } catch (err) {
      toastError(err?.message || "Failed to save city");
    }
  };

  const remove = async (id) => {
    const ok = await swalConfirm("Delete this city?");
    if (!ok) return;
    try {
      await Api("delete", `admin/cities/${id}`, null, router);
      toastSuccess("City deleted");
      load();
    } catch {
      toastError("Failed to delete");
    }
  };

  return (
    <AdminLayout title="Cities">
      <p className="mb-4 text-sm text-[#64748b]">
        These places appear in the app From/To autocomplete. Search shows cities and main local areas
        (e.g. Alambagh, Charbagh) — not tiny colonies/schools.
      </p>

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
                placeholder="Search cities..."
                className="w-full rounded-xl border border-[#e2e8f0] bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#4a6d00]"
              />
            </div>
            <button
              onClick={openAdd}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#4a6d00] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3d5a00]"
            >
              <Plus size={16} /> Add City
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-left text-xs text-[#64748b]">
                  {["City", "Country", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-[#f8fafc] hover:bg-[#fafafa]">
                    <td className="px-4 py-3 font-semibold text-[#1e293b]">{c.name}</td>
                    <td className="px-4 py-3 text-[#64748b]">{c.country || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={c.status}>{c.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 hover:bg-[#eaf5dd]">
                          <Pencil size={15} className="text-[#4a6d00]" />
                        </button>
                        <button onClick={() => remove(c.id)} className="rounded-lg p-1.5 hover:bg-red-50">
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
                <MapPin size={40} className="mb-3 opacity-40" />
                <p>No cities found</p>
              </div>
            )}
          </div>
        </>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? "Edit City" : "Add City"}>
        <form onSubmit={save} className="space-y-4">
          {!editId && (
            <div>
              <label className="mb-1 block text-xs font-medium text-[#64748b]">
                Search city or local area
              </label>
              <input
                value={photonQ}
                onChange={(e) => setPhotonQ(e.target.value)}
                placeholder="e.g. Lucknow, Alambagh, Charbagh..."
                className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
              />
              {photonLoading && <p className="mt-1 text-xs text-[#94a3b8]">Searching...</p>}
              {photonResults.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-[#e2e8f0]">
                  {photonResults.map((p) => (
                    <button
                      key={p.id || `${p.name}-${p.parentCity}-${p.country}`}
                      type="button"
                      onClick={() => pickPhoton(p)}
                      className="flex w-full items-center gap-2 border-b border-[#f1f5f9] px-3 py-2 text-left text-sm hover:bg-[#f8fafc]"
                    >
                      <MapPin size={14} className="shrink-0 text-[#4a6d00]" />
                      <span>
                        <span className="font-medium text-[#1e293b]">{p.name}</span>
                        {p.parentCity ? (
                          <span className="text-[#64748b]"> · {p.parentCity}</span>
                        ) : null}
                        {p.country ? (
                          <span className="text-[#94a3b8]">, {p.country}</span>
                        ) : null}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-[#64748b]">City Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#64748b]">Country</label>
            <input
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
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
