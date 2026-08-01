import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import { Api } from "@/services/service";
import { toastSuccess, toastError, swalConfirm } from "@/utils/swal";
import {
  Search, Pencil, Trash2, Users, RefreshCw, ChevronLeft, ChevronRight, Filter, Mail, Phone, Calendar
} from "lucide-react";

const emptyForm = { name: "", email: "", phone: "", member: "Standard", status: "active" };

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchUsers = () => {
    setLoading(true);
    Api("get", "admin/users", null, router)
      .then((res) => {
        const list = res?.data?.users || res?.users || [];
        setUsers(list);
      })
      .catch((err) => {
        console.error("Fetch users error:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [router]);

  const openEdit = (u) => {
    setEditId(u._id || u.id);
    setForm({
      name: u.name || "",
      email: u.email || "",
      phone: u.phone || "",
      member: u.member || "Standard",
      status: u.status || "active",
    });
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!editId) return;
    try {
      const res = await Api("put", `admin/users/${editId}`, form, router);
      if (res?.status === true || res?.user || res?.message) {
        toastSuccess("User updated successfully!");
        fetchUsers();
        setModal(false);
      } else {
        toastError(res?.message || "Failed to update user");
      }
    } catch (err) {
      toastError(err?.message || "Error saving user");
    }
  };

  const remove = async (id) => {
    const ok = await swalConfirm("Remove User?", "Are you sure you want to remove this user?");
    if (!ok) return;

    try {
      const res = await Api("delete", `admin/users/${id}`, null, router);
      if (res?.status === true || res?.message) {
        toastSuccess("User removed successfully!");
        fetchUsers();
      } else {
        toastError(res?.message || "Failed to remove user");
      }
    } catch (err) {
      toastError(err?.message || "Error removing user");
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase().trim();
    const matchQuery =
      !q ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.toLowerCase().includes(q));

    const matchStatus = filterStatus === "all" || u.status === filterStatus;
    return matchQuery && matchStatus;
  });

  const totalUsers = filtered.length;
  const totalPages = Math.ceil(totalUsers / pageSize) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedUsers = filtered.slice(startIndex, startIndex + pageSize);

  return (
    <AdminLayout title="Users">
      <div className="space-y-6" style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)" }}>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-black text-[#1e293b]">User Management</h1>
            <p className="text-xs text-[#64748b]">View, update membership tiers, and manage user accounts</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#1e293b] hover:bg-[#f8fafc] disabled:opacity-50 transition shadow-2xs"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh List
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name, email, or phone..."
                className="w-full rounded-xl border border-[#e2e8f0] bg-white py-2 pl-8 pr-4 text-xs outline-none focus:border-[#4a6d00] focus:ring-2 focus:ring-[#4a6d00]/20"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <Filter size={13} className="text-[#64748b] mr-1 flex-shrink-0" />
              {["all", "active", "inactive"].map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setFilterStatus(st);
                    setCurrentPage(1);
                  }}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition ${
                    filterStatus === st
                      ? "bg-[#4a6d00] text-white shadow-2xs"
                      : "bg-[#f8fafc] text-[#64748b] hover:bg-[#f1f5f9]"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-[#94a3b8]">Loading registered users...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-[#94a3b8]">
              <Users size={40} className="mb-3 opacity-40" />
              <p className="text-xs">No users found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-[#f1f5f9]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#f1f5f9] bg-[#f8fafc] text-[#64748b] font-semibold">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Contact Details</th>
                      <th className="py-3 px-4">Membership Level</th>
                      <th className="py-3 px-4">Trips / Points</th>
                      <th className="py-3 px-4">Account Status</th>
                      <th className="py-3 px-4">Joined Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f8fafc]">
                    {paginatedUsers.map((u) => {
                      const userId = u._id || u.id;
                      const nameLetters = (u.name || "U")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();

                      return (
                        <tr key={userId} className="hover:bg-[#fafafa] transition">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#4a6d00] text-xs font-bold text-white shadow-2xs">
                                {nameLetters}
                              </div>
                              <div>
                                <p className="font-bold text-[#1e293b]">{u.name}</p>
                                <p className="text-[11px] text-[#94a3b8] font-mono">ID: {String(userId).slice(-6)}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 space-y-1">
                            <div className="flex items-center gap-1.5 text-[#64748b]">
                              <Mail size={12} className="text-[#94a3b8]" />
                              <span>{u.email}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[#64748b]">
                              <Phone size={12} className="text-[#94a3b8]" />
                              <span>{u.phone || "N/A"}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <Badge variant={(u.member || "Standard").toLowerCase()}>
                              {u.member || "Standard"}
                            </Badge>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="rounded-lg bg-[#f8fafc] px-2 py-1 font-bold text-[#4a6d00]">
                                {u.trips || 0} Trips
                              </span>
                              <span className="rounded-lg bg-[#f8fafc] px-2 py-1 font-bold text-[#f26522]">
                                {u.points || 0} Points
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <Badge variant={u.status || "active"}>
                              {u.status || "active"}
                            </Badge>
                          </td>

                          <td className="py-3.5 px-4 text-[#64748b]">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} className="text-[#94a3b8]" />
                              <span>{u.joined || "N/A"}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEdit(u)}
                                className="flex items-center gap-1 rounded-lg border border-[#e2e8f0] px-2.5 py-1.5 text-xs font-semibold text-[#1e293b] hover:bg-[#f8fafc] transition"
                              >
                                <Pencil size={12} /> Edit Tier & Status
                              </button>
                              <button
                                onClick={() => remove(userId)}
                                className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 text-xs text-[#64748b]">
                <div className="flex items-center gap-2">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded-lg border border-[#e2e8f0] bg-white px-2 py-1 text-xs outline-none focus:border-[#4a6d00]"
                  >
                    {[5, 10, 25, 50].map((sz) => (
                      <option key={sz} value={sz}>
                        {sz} per page
                      </option>
                    ))}
                  </select>
                  <span>
                    Showing {startIndex + 1} to {Math.min(startIndex + pageSize, totalUsers)} of {totalUsers} users
                  </span>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white disabled:opacity-40 hover:bg-[#f8fafc] transition"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  <span className="px-2 font-semibold text-[#1e293b]">
                    Page {safePage} of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white disabled:opacity-40 hover:bg-[#f8fafc] transition"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <Modal open={modal} onClose={() => setModal(false)} title="Edit User Membership & Status">
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#64748b]">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#64748b]">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#64748b]">Phone Number</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#64748b]">Membership Tier</label>
                <select
                  value={form.member}
                  onChange={(e) => setForm({ ...form, member: e.target.value })}
                  className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                >
                  {["Standard", "Silver", "Gold", "Platinum"].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#64748b]">Account Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive (Blocked)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setModal(false)}
                className="flex-1 rounded-xl border border-[#e2e8f0] py-2.5 text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-[#4a6d00] py-2.5 text-sm font-semibold text-white hover:bg-[#3d5a00] transition"
              >
                Update User
              </button>
            </div>
          </form>
        </Modal>

      </div>
    </AdminLayout>
  );
}
