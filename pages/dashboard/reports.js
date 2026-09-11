import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import { Api } from "@/services/service";
import { toastSuccess, toastError } from "@/utils/swal";
import {
  Search,
  Eye,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Ticket,
} from "lucide-react";

const STATUS_OPTIONS = ["all", "open", "in_progress", "resolved", "closed"];

const QUICK_REPLIES = [
  {
    label: "Issue Resolved",
    text: "Your issue has been investigated and resolved. If you need any further assistance, please let us know.",
  },
  {
    label: "Refund Processed",
    text: "Your refund has been approved and processed. It will reflect in your original payment method within 3-5 business days.",
  },
  {
    label: "Operator Verified",
    text: "We have contacted the bus operator and verified your travel/boarding details. Your journey is confirmed.",
  },
  {
    label: "Seat / Boarding Updated",
    text: "Your seat/boarding request has been updated. Please check your ticket details in the app.",
  },
];

export default function ReportsPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("open");
  const [adminReply, setAdminReply] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
    setSelectedStatus(item.status || "open");
    setAdminReply(item.adminReply || "");
    setAdminNote(item.adminNote || "");
  };

  const saveInquiry = async (statusOverride = null) => {
    if (!view) return;
    const targetStatus = statusOverride || selectedStatus;
    setSubmitting(true);
    try {
      await Api(
        "put",
        `admin/inquiries/${view.id}`,
        {
          status: targetStatus,
          adminReply: adminReply.trim(),
          adminNote: adminNote.trim(),
        },
        router
      );
      toastSuccess(
        targetStatus === "resolved"
          ? "Report resolved & response sent to user"
          : "Report updated successfully"
      );
      setView(null);
      load();
    } catch {
      toastError("Failed to update inquiry");
    } finally {
      setSubmitting(false);
    }
  };

  // Stats calculation
  const totalCount = items.length;
  const openCount = items.filter((i) => i.status === "open").length;
  const inProgressCount = items.filter((i) => i.status === "in_progress").length;
  const resolvedCount = items.filter((i) => i.status === "resolved").length;

  return (
    <AdminLayout title="Reports & Support Desk">
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#64748b]">Total Inquiries</p>
              <p className="mt-1 text-2xl font-bold text-[#1e293b]">{totalCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f8fafc] text-[#1e293b]">
              <MessageSquare size={18} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#64748b]">Open / Pending</p>
              <p className="mt-1 text-2xl font-bold text-[#f26522]">{openCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff7ed] text-[#f26522]">
              <AlertCircle size={18} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#64748b]">In Progress</p>
              <p className="mt-1 text-2xl font-bold text-[#0284c7]">{inProgressCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0f9ff] text-[#0284c7]">
              <Clock size={18} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#64748b]">Resolved</p>
              <p className="mt-1 text-2xl font-bold text-[#4a6d00]">{resolvedCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf5dd] text-[#4a6d00]">
              <CheckCircle2 size={18} />
            </div>
          </div>
        </div>
      </div>

      <p className="mb-4 text-sm text-[#64748b]">
        Customer issues submitted from the app. You can reply to users directly and resolve tickets.
      </p>

      {loading ? (
        <p className="text-sm text-[#64748b]">Loading reports...</p>
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
                  {["Customer", "Category", "Subject", "Booking", "Status", "User Reply", "Date", ""].map((h) => (
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
                    <td className="max-w-[200px] truncate px-4 py-3 font-medium text-[#1e293b]">
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
                    <td className="px-4 py-3">
                      {item.adminReply ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf5dd] px-2.5 py-0.5 text-xs font-medium text-[#4a6d00]">
                          <CheckCircle2 size={12} /> Replied
                        </span>
                      ) : (
                        <span className="text-xs text-[#94a3b8]">No reply</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#94a3b8]">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openView(item)}
                        className="flex items-center gap-1 rounded-lg bg-[#f0f9ff] px-3 py-1.5 text-xs font-semibold text-[#0284c7] hover:bg-[#e0f2fe]"
                      >
                        <Eye size={13} /> View & Reply
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 && (
              <div className="flex flex-col items-center py-16 text-[#94a3b8]">
                <MessageSquare size={40} className="mb-3 opacity-40" />
                <p>No inquiries found</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Inquiry Detail & Reply Modal */}
      <Modal open={!!view} onClose={() => setView(null)} title="Inquiry & Customer Response">
        {view && (
          <div className="space-y-4 text-sm">
            {/* Customer Details Box */}
            <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-[#334155]">
                  <User size={15} className="text-[#94a3b8]" />
                  <span className="font-semibold">{view.fullname}</span>
                </div>
                <div className="flex items-center gap-2 text-[#64748b]">
                  <Mail size={15} className="text-[#94a3b8]" />
                  <span>{view.email}</span>
                </div>
                {view.phone ? (
                  <div className="flex items-center gap-2 text-[#64748b]">
                    <Phone size={15} className="text-[#94a3b8]" />
                    <span>{view.phone}</span>
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <Ticket size={15} className="text-[#94a3b8]" />
                  <span className="font-mono text-xs text-[#4a6d00]">
                    {view.bookingId ? `PNR: ${view.bookingId}` : "No Booking ID"}
                  </span>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between border-t border-[#e2e8f0] pt-2 text-xs">
                <span className="text-[#64748b]">Category: <strong>{view.categoryLabel}</strong></span>
                <span className="text-[#94a3b8]">
                  Submitted: {view.createdAt ? new Date(view.createdAt).toLocaleString() : "—"}
                </span>
              </div>
            </div>

            {/* User Subject & Message */}
            <div>
              <p className="text-xs font-semibold text-[#64748b]">CUSTOMER ISSUE / SUBJECT</p>
              <p className="mt-0.5 font-bold text-[#1e293b]">{view.subject}</p>
              <div className="mt-2 rounded-xl border border-[#e2e8f0] bg-white p-3 text-[#334155]">
                <p className="whitespace-pre-wrap leading-relaxed">{view.message}</p>
              </div>
            </div>

            {/* Admin Response to Customer (Visible in App) */}
            <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#166534]">
                  <ShieldCheck size={16} />
                  <span>REPLY TO USER (VISIBLE IN APP)</span>
                </div>
                {view.repliedAt ? (
                  <span className="text-xs text-[#15803d]">
                    Last replied: {new Date(view.repliedAt).toLocaleDateString()}
                  </span>
                ) : null}
              </div>

              {/* Quick Template Chips */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {QUICK_REPLIES.map((qr) => (
                  <button
                    key={qr.label}
                    type="button"
                    onClick={() => setAdminReply(qr.text)}
                    className="rounded-lg border border-[#86efac] bg-white px-2 py-1 text-xs font-medium text-[#166534] hover:bg-[#dcfce7]"
                  >
                    + {qr.label}
                  </button>
                ))}
              </div>

              <textarea
                value={adminReply}
                onChange={(e) => setAdminReply(e.target.value)}
                placeholder="Type your official resolution response to the customer here. This will be shown in their mobile app under My Reports."
                rows={3}
                className="mt-2.5 w-full rounded-xl border border-[#86efac] bg-white p-2.5 text-sm text-[#1e293b] outline-none focus:border-[#4a6d00] focus:ring-1 focus:ring-[#4a6d00]"
              />
            </div>

            {/* Internal Admin Note (Private) */}
            <div>
              <p className="mb-1 text-xs font-semibold text-[#64748b]">INTERNAL ADMIN NOTE (PRIVATE)</p>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={2}
                placeholder="Staff notes for internal reference only..."
                className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm outline-none focus:border-[#4a6d00]"
              />
            </div>

            {/* Status Selection */}
            <div>
              <p className="mb-1.5 text-xs font-semibold text-[#64748b]">UPDATE STATUS</p>
              <div className="flex flex-wrap gap-2">
                {["open", "in_progress", "resolved", "closed"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedStatus(s)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-semibold capitalize transition ${
                      selectedStatus === s
                        ? s === "resolved"
                          ? "bg-[#4a6d00] text-white"
                          : s === "in_progress"
                            ? "bg-[#0284c7] text-white"
                            : s === "closed"
                              ? "bg-[#64748b] text-white"
                              : "bg-[#f26522] text-white"
                        : "border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
                    }`}
                  >
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={submitting}
                onClick={() => saveInquiry()}
                className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-2.5 text-xs font-semibold text-[#334155] hover:bg-[#f8fafc]"
              >
                Save Changes
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => saveInquiry("resolved")}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[#4a6d00] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#3d5900]"
              >
                <CheckCircle2 size={15} />
                Send Reply & Mark Resolved
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
