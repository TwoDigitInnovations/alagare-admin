import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import { INITIAL_USERS } from "@/data/mockData";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";

const emptyForm = { name: "", email: "", phone: "", member: "Standard", status: "active" };

export default function UsersPage() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditId(null); setForm(emptyForm); setModal(true); };
  const openEdit = (u) => { setEditId(u.id); setForm({ name: u.name, email: u.email, phone: u.phone, member: u.member, status: u.status }); setModal(true); };

  const save = (e) => {
    e.preventDefault();
    if (editId) {
      setUsers((prev) => prev.map((u) => u.id === editId ? { ...u, ...form } : u));
    } else {
      setUsers((prev) => [...prev, { id: `U-${Date.now().toString().slice(-3)}`, ...form, trips: 0, points: 0, joined: new Date().toISOString().split("T")[0] }]);
    }
    setModal(false);
  };

  const remove = (id) => setUsers((prev) => prev.filter((u) => u.id !== id));

  return (
    <AdminLayout title="Users">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="w-full rounded-xl border border-[#e2e8f0] bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#4a6d00]" />
        </div>
        <button onClick={openAdd} className="flex items-center justify-center gap-2 rounded-xl bg-[#4a6d00] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3d5a00]">
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((u) => (
          <div key={u.id} className="rounded-2xl border border-[#e2e8f0] bg-white p-4">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4a6d00] text-sm font-bold text-white">
                  {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="font-bold text-[#1e293b]">{u.name}</p>
                  <p className="text-xs text-[#94a3b8]">{u.email}</p>
                </div>
              </div>
              <Badge variant={u.member.toLowerCase()}>{u.member}</Badge>
            </div>
            <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-[#f8fafc] p-2"><p className="font-bold text-[#4a6d00]">{u.trips}</p><p className="text-[#94a3b8]">Trips</p></div>
              <div className="rounded-lg bg-[#f8fafc] p-2"><p className="font-bold text-[#f26522]">{u.points}</p><p className="text-[#94a3b8]">Points</p></div>
              <div className="rounded-lg bg-[#f8fafc] p-2"><Badge variant={u.status}>{u.status}</Badge></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(u)} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-[#e2e8f0] py-2 text-xs font-medium hover:bg-[#f8fafc]"><Pencil size={13} /> Edit</button>
              <button onClick={() => remove(u.id)} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-red-200 py-2 text-xs font-medium text-red-500 hover:bg-red-50"><Trash2 size={13} /> Delete</button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center py-16 text-[#94a3b8]">
          <Users size={40} className="mb-3 opacity-40" />
          <p>No users found</p>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? "Edit User" : "Add User"}>
        <form onSubmit={save} className="space-y-4">
          {[{ l: "Full Name", n: "name" }, { l: "Email", n: "email", t: "email" }, { l: "Phone", n: "phone" }].map(({ l, n, t }) => (
            <div key={n}>
              <label className="mb-1 block text-xs font-medium text-[#64748b]">{l}</label>
              <input type={t || "text"} value={form[n]} onChange={(e) => setForm({ ...form, [n]: e.target.value })} required className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#64748b]">Membership</label>
              <select value={form.member} onChange={(e) => setForm({ ...form, member: e.target.value })} className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]">
                {["Standard", "Silver", "Gold", "Platinum"].map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#64748b]">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="flex-1 rounded-xl border border-[#e2e8f0] py-2.5 text-sm font-medium">Cancel</button>
            <button type="submit" className="flex-1 rounded-xl bg-[#4a6d00] py-2.5 text-sm font-semibold text-white">{editId ? "Save" : "Create"}</button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
