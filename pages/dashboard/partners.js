import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import { AuthApi } from "@/services/service";
import { toastSuccess, toastError, swalConfirm } from "@/utils/swal";
import { Plus, Search, Key, RefreshCw, Trash2, Copy } from "lucide-react";

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  expiry_date: "",
};

export default function ApiUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [createdKey, setCreatedKey] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    AuthApi("get", "api-users", null, router)
      .then((res) => setUsers(res?.data?.data || res?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = (Array.isArray(users) ? users : []).filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.last_name?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setForm(emptyForm);
    setCreatedKey(null);
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const res = await AuthApi("post", "api-users", form, router);
      const data = res?.data?.data || res?.data;
      setCreatedKey(data?.api_key || null);
      toastSuccess("API user created");
      load();
    } catch (err) {
      toastError(err?.message || "Failed to create API user");
    }
  };

  const regenerate = async (id) => {
    const ok = await swalConfirm("Regenerate API key?", "Old key will stop working.");
    if (!ok) return;
    try {
      const res = await AuthApi("post", `api-users/${id}/regenerate`, null, router);
      const data = res?.data?.data || res?.data;
      setCreatedKey(data?.api_key || null);
      setModal(true);
      toastSuccess("Key regenerated");
      load();
    } catch (err) {
      toastError(err?.message || "Failed");
    }
  };

  const remove = async (id) => {
    const ok = await swalConfirm("Delete this API user?");
    if (!ok) return;
    try {
      await AuthApi("delete", `api-users/${id}`, null, router);
      toastSuccess("API user deleted");
      load();
    } catch {
      toastError("Failed to delete");
    }
  };

  return (
    <AdminLayout title="API Users">
     

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
                placeholder="Search API users..."
                className="w-full rounded-xl border border-[#e2e8f0] bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#4a6d00]"
              />
            </div>
            <button
              onClick={openAdd}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#4a6d00] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3d5a00]"
            >
              <Plus size={16} /> Create API User
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-left text-xs text-[#64748b]">
                  {["Name", "Email", "API Key", "Expiry", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u._id} className="border-b border-[#f8fafc] hover:bg-[#fafafa]">
                    <td className="px-4 py-3 font-semibold text-[#1e293b]">
                      {u.first_name} {u.last_name}
                    </td>
                    <td className="px-4 py-3 text-[#64748b]">{u.email}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#4a6d00]">
                      {u.api_key ? `${String(u.api_key).slice(0, 20)}…` : "—"}
                    </td>
                    <td className="px-4 py-3 text-[#64748b]">
                      {u.expiry_date ? new Date(u.expiry_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.is_active ? "active" : "inactive"}>
                        {u.is_active ? "active" : "inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => regenerate(u._id)}
                          className="rounded-lg p-1.5 hover:bg-[#eaf5dd]"
                          title="Regenerate"
                        >
                          <RefreshCw size={15} className="text-[#4a6d00]" />
                        </button>
                        <button
                          onClick={() => remove(u._id)}
                          className="rounded-lg p-1.5 hover:bg-red-50"
                          title="Delete"
                        >
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
                <Key size={40} className="mb-3 opacity-40" />
                <p>No API users yet</p>
              </div>
            )}
          </div>
        </>
      )}

      <Modal
        open={modal}
        onClose={() => {
          setModal(false);
          setCreatedKey(null);
        }}
        title={createdKey ? "API Key" : "Create API User"}
      >
        {createdKey ? (
          <div className="space-y-4">
            <p className="text-sm text-[#64748b]">Copy this key — third party must send it on every request.</p>
            <div className="flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
              <code className="flex-1 break-all text-xs">{createdKey}</code>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(createdKey)}
                className="rounded-lg bg-[#4a6d00] p-2 text-white"
              >
                <Copy size={14} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setModal(false);
                setCreatedKey(null);
              }}
              className="w-full rounded-xl bg-[#4a6d00] py-2.5 text-sm font-semibold text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={save} className="space-y-4">
            {[
              { l: "First Name", n: "first_name" },
              { l: "Last Name", n: "last_name" },
              { l: "Email", n: "email", t: "email" },
              { l: "Expiry Date", n: "expiry_date", t: "date" },
            ].map(({ l, n, t }) => (
              <div key={n}>
                <label className="mb-1 block text-xs font-medium text-[#64748b]">{l}</label>
                <input
                  required
                  type={t || "text"}
                  value={form[n]}
                  onChange={(e) => setForm({ ...form, [n]: e.target.value })}
                  className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(false)} className="flex-1 rounded-xl border border-[#e2e8f0] py-2.5 text-sm">
                Cancel
              </button>
              <button type="submit" className="flex-1 rounded-xl bg-[#4a6d00] py-2.5 text-sm font-semibold text-white">
                Create
              </button>
            </div>
          </form>
        )}
      </Modal>
    </AdminLayout>
  );
}
