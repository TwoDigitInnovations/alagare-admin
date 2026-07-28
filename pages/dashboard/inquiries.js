import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import Badge from "@/components/Badge";
import { Api } from "@/services/service";
import { toastSuccess, toastError, swalConfirm } from "@/utils/swal";
import {
  PhoneCall,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Phone,
  Mail,
  Globe,
  User,
  Filter,
} from "lucide-react";

export default function InquiriesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, contacted: 0, resolved: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchInquiries = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (statusFilter !== "all") query.append("status", statusFilter);
    if (search.trim()) query.append("q", search.trim());

    console.log("Fetching callbacks:", `admin/callbacks?${query.toString()}`);
    Api("get", `admin/callbacks?${query.toString()}`, null, router)
      .then((res) => {
        console.log("Callbacks response:", res);
        const list = res?.items || res?.data?.items || [];
        const st = res?.stats || res?.data?.stats || { total: 0, pending: 0, contacted: 0, resolved: 0 };
        setItems(list);
        setStats(st);
      })
      .catch((err) => {
        console.error("Callbacks error:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInquiries();
  }, [statusFilter, search]);

  const handleUpdateStatus = (id, status) => {
    setUpdatingId(id);
    Api("put", `admin/callbacks/${id}/status`, { status }, router)
      .then((res) => {
        console.log("Update status response:", res);
        toastSuccess(`Status updated to ${status}`);
        fetchInquiries();
      })
      .catch((err) => {
        console.error("Update status error:", err);
        toastError(err?.message || "Failed to update status");
      })
      .finally(() => setUpdatingId(null));
  };

  const handleDelete = async (id) => {
    const ok = await swalConfirm("Delete this callback request?", "This action cannot be undone.");
    if (!ok) return;
    setUpdatingId(id);
    Api("delete", `admin/callbacks/${id}`, null, router)
      .then((res) => {
        console.log("Delete response:", res);
        toastSuccess("Callback request deleted");
        fetchInquiries();
      })
      .catch((err) => {
        console.error("Delete error:", err);
        toastError(err?.message || "Failed to delete request");
      })
      .finally(() => setUpdatingId(null));
  };

  const STAT_CARDS = [
    { label: "Total Requests", val: stats.total, color: "bg-[#f8fafc] text-[#1e293b]", icon: PhoneCall },
    { label: "Pending Callbacks", val: stats.pending, color: "bg-[#fff7ed] text-[#f26522]", icon: Clock },
    { label: "Contacted", val: stats.contacted, color: "bg-[#f0f9ff] text-[#0369a1]", icon: Phone },
    { label: "Resolved", val: stats.resolved, color: "bg-[#eaf5dd] text-[#4a6d00]", icon: CheckCircle2 },
  ];

  return (
    <AdminLayout title="Callback Requests">
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <div key={card.label} className="rounded-2xl border border-[#e2e8f0] bg-white p-4 sm:p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748b]">{card.label}</span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${card.color}`}>
                <card.icon size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#1e293b]">{card.val}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-2xl border border-[#e2e8f0] bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, phone or country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-2.5 pl-10 pr-4 text-sm text-[#1e293b] outline-none transition focus:border-[#4a6d00] focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-1">
            {["all", "pending", "contacted", "resolved"].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  statusFilter === tab
                    ? "bg-[#1a2e05] text-white shadow-sm"
                    : "text-[#64748b] hover:text-[#1e293b]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#e2e8f0] bg-white">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#64748b]">Loading requests...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#64748b]">
            <PhoneCall size={36} className="mx-auto mb-3 text-[#cbd5e1]" />
            <p className="font-semibold text-[#1e293b]">No callback requests found</p>
            <p className="mt-1 text-xs text-[#94a3b8]">Inquiries submitted from the operator landing page will appear here.</p>
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f1f5f9] text-left text-xs font-medium text-[#94a3b8]">
                    <th className="px-5 py-3.5">Applicant Name</th>
                    <th className="px-3 py-3.5">Phone Number</th>
                    <th className="px-3 py-3.5">Email Address</th>
                    <th className="px-3 py-3.5">Country</th>
                    <th className="px-3 py-3.5">Submitted Date</th>
                    <th className="px-3 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item._id} className="border-b border-[#f8fafc] hover:bg-[#fafafa]">
                      <td className="px-5 py-4 font-semibold text-[#1e293b]">{item.name}</td>
                      <td className="px-3 py-4 font-mono text-xs text-[#1e293b]">{item.phone}</td>
                      <td className="px-3 py-4 text-[#64748b]">{item.email}</td>
                      <td className="px-3 py-4 text-[#1e293b]">{item.country || "—"}</td>
                      <td className="px-3 py-4 text-xs text-[#94a3b8]">
                        {new Date(item.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-3 py-4">
                        <Badge variant={item.status}>{item.status}</Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.status === "pending" && (
                            <button
                              disabled={updatingId === item._id}
                              onClick={() => handleUpdateStatus(item._id, "contacted")}
                              className="rounded-lg bg-[#f0f9ff] px-2.5 py-1.5 text-xs font-semibold text-[#0369a1] hover:bg-[#e0f2fe]"
                            >
                              Mark Contacted
                            </button>
                          )}
                          {item.status !== "resolved" && (
                            <button
                              disabled={updatingId === item._id}
                              onClick={() => handleUpdateStatus(item._id, "resolved")}
                              className="rounded-lg bg-[#eaf5dd] px-2.5 py-1.5 text-xs font-semibold text-[#4a6d00] hover:bg-[#d8ebd0]"
                            >
                              Resolve
                            </button>
                          )}
                          <button
                            disabled={updatingId === item._id}
                            onClick={() => handleDelete(item._id)}
                            className="rounded-lg p-1.5 text-[#ef4444] hover:bg-[#fef2f2]"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-[#f1f5f9] lg:hidden">
              {items.map((item) => (
                <div key={item._id} className="p-4 sm:p-5">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-[#1e293b]">{item.name}</h4>
                      <p className="text-xs text-[#94a3b8]">
                        {new Date(item.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge variant={item.status}>{item.status}</Badge>
                  </div>

                  <div className="my-3 space-y-1 text-xs text-[#64748b]">
                    <p className="flex items-center gap-1.5">
                      <Phone size={13} className="text-[#4a6d00]" />
                      <span className="font-mono text-[#1e293b]">{item.phone}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Mail size={13} className="text-[#4a6d00]" />
                      <span>{item.email}</span>
                    </p>
                    {item.country && (
                      <p className="flex items-center gap-1.5">
                        <Globe size={13} className="text-[#4a6d00]" />
                        <span>{item.country}</span>
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2 border-t border-[#f8fafc] pt-3">
                    {item.status === "pending" && (
                      <button
                        disabled={updatingId === item._id}
                        onClick={() => handleUpdateStatus(item._id, "contacted")}
                        className="rounded-lg bg-[#f0f9ff] px-3 py-1.5 text-xs font-semibold text-[#0369a1]"
                      >
                        Contacted
                      </button>
                    )}
                    {item.status !== "resolved" && (
                      <button
                        disabled={updatingId === item._id}
                        onClick={() => handleUpdateStatus(item._id, "resolved")}
                        className="rounded-lg bg-[#eaf5dd] px-3 py-1.5 text-xs font-semibold text-[#4a6d00]"
                      >
                        Resolve
                      </button>
                    )}
                    <button
                      disabled={updatingId === item._id}
                      onClick={() => handleDelete(item._id)}
                      className="rounded-lg p-1.5 text-[#ef4444]"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
