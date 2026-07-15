import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import { Api } from "@/services/service";
import { toastSuccess, toastError } from "@/utils/swal";
import { Search, Eye, MessageSquare } from "lucide-react";

const STATUS_OPTIONS = ["all", "open", "in_progress", "resolved", "closed"];

export default function ReportsPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    const qs = new URLSearchParams();
    if (filter !== "all") qs.set("status", filter);
    if (search.trim()) qs.set("q", search.trim());
    const path = qs.toString() ? `admin/inquiries?${qs}` : "admin/inquiries";
    Api("get", path, null, router)
      .then((res) => setItems(res?.data?.inquiries || []))
      .catch(() => toastError("Failed to load inquiries"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [filter]);

  const openView = (item) => {
    setView(item);
    setAdminNote(item.adminNote || "");
  };

  const updateStatus = async (id, status) => {
    try {
      await Api("put", `admin/inquiries/${id}`, { status, adminNote }, router);
      toastSuccess("Inquiry updated");
      setView(null);
      load();
    } catch {
      toastError("Failed to update inquiry");
    }
  };

  return (
    <AdminLayout title="Reports">
      <p className="mb-4 text-sm text-[#64748b]">
        Customer inquiries submitted from the app Help & Support form.
      </p>

      {loading ? (
        <p className="text-sm text-[#64748b]">Loading...</p>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load()}
                placeholder="Search name, email, booking ID, subject..."
                className="w-full rounded-xl border border-[#e2e8f0] bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#4a6d00]"
              />
            </div>
            <button
              type="button"
              onClick={load}
              className="rounded-xl bg-[#4a6d00] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Search
            </button>
            <div className="flex gap-2 overflow-x-auto">
              {STATUS_OPTIONS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold capitalize transition ${
                    filter === f
                      ? "bg-[#4a6d00] text-white"
                      : "border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
                  }`}
                >
                  {f.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-left text-xs text-[#64748b]">
                  {["Customer", "Category", "Subject", "Booking", "Status", "Date", ""].map((h) => (
                    <th key={h || "a"} className="px-4 py-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-[#f8fafc] hover:bg-[#fafafa]">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#1e293b]">{item.fullname}</p>
                      <p className="text-xs text-[#94a3b8]">{item.email}</p>
                    </td>
                    <td className="px-4 py-3 text-[#64748b]">{item.categoryLabel}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-[#1e293b]">
                      {item.subject}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#4a6d00]">
                      {item.bookingId || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          item.status === "open"
                            ? "pending"
                            : item.status === "resolved"
                              ? "confirmed"
                              : item.status === "closed"
                                ? "cancelled"
                                : "default"
                        }
                      >
                        {String(item.status || "").replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#94a3b8]">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openView(item)}
                        className="flex items-center gap-1 text-xs font-semibold text-[#4a6d00]"
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 && (
              <div className="flex flex-col items-center py-16 text-[#94a3b8]">
                <MessageSquare size={40} className="mb-3 opacity-40" />
                <p>No inquiries yet</p>
              </div>
            )}
          </div>
        </>
      )}

      <Modal open={!!view} onClose={() => setView(null)} title="Inquiry details">
        {view && (
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-[#94a3b8]">Customer</p>
              <p className="font-semibold text-[#1e293b]">{view.fullname}</p>
              <p className="text-[#64748b]">
                {view.email}
                {view.phone ? ` · ${view.phone}` : ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#94a3b8]">Category</p>
              <p className="font-medium text-[#1e293b]">{view.categoryLabel}</p>
            </div>
            <div>
              <p className="text-xs text-[#94a3b8]">Booking ID</p>
              <p className="font-mono text-[#4a6d00]">{view.bookingId || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-[#94a3b8]">Subject</p>
              <p className="font-semibold text-[#1e293b]">{view.subject}</p>
            </div>
            <div>
              <p className="text-xs text-[#94a3b8]">Message</p>
              <p className="whitespace-pre-wrap rounded-xl bg-[#f8fafc] p-3 text-[#334155]">
                {view.message}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs text-[#94a3b8]">Admin note</p>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2 text-sm outline-none focus:border-[#4a6d00]"
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {["open", "in_progress", "resolved", "closed"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => updateStatus(view.id, s)}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold capitalize ${
                    view.status === s
                      ? "bg-[#4a6d00] text-white"
                      : "border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"
                  }`}
                >
                  Mark {s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
