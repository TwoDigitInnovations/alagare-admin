import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Api } from "@/services/service";
import { toastSuccess, toastError, swalConfirm } from "@/utils/swal";
import {
  Ticket, ArrowLeft, Search, Eye, X, CheckCircle, Clock, XCircle,
  RefreshCw
} from "lucide-react";

const GREEN = "#4a6d00";

const formatSeatKey = (key) => {
  if (!key) return "";
  const [r, c] = key.split('-');
  if (c === 'middle') return `${Number(r) + 1}M`;
  return `${Number(r) + 1}${String.fromCharCode(65 + Number(c))}`;
};

const isPastDeparture = (dateStr, timeStr) => {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr);
    if (timeStr) {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        let [_, h, m, ampm] = match;
        h = parseInt(h, 10);
        if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
        if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
        d.setHours(h, parseInt(m, 10), 0, 0);
      }
    }
    return new Date() > d;
  } catch { return false; }
};

function readUser() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem("userDetail") || "null"); } catch { return null; }
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0]">
          <h3 className="font-bold text-[#1e293b]">{title}</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-[#94a3b8] hover:bg-[#f1f5f9]">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto max-h-[75vh]">{children}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    confirmed: "bg-green-50 text-green-700 border-green-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };
  const icons = {
    confirmed: <CheckCircle size={12} />,
    pending: <Clock size={12} />,
    cancelled: <XCircle size={12} />,
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize ${styles[status] || "bg-zinc-50 text-zinc-600 border-zinc-200"}`}>
      {icons[status]}
      {status}
    </span>
  );
}

export default function OperatorBookings() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const u = readUser();
    if (!u || u.role !== "operator") {
      router.replace("/login");
      return;
    }
    setUser(u);
    loadBookings();
  }, [router]);

  const loadBookings = () => {
    setLoading(true);
    Api("get", "operator/bookings", null, router)
      .then(res => setBookings(res?.data?.bookings || []))
      .catch(() => toastError("Failed to load bookings"))
      .finally(() => setLoading(false));
  };

  const filteredBookings = bookings.filter(b => {
    const matchSearch =
      b.passenger?.toLowerCase().includes(search.toLowerCase()) ||
      b.ref?.toLowerCase().includes(search.toLowerCase()) ||
      b.email?.toLowerCase().includes(search.toLowerCase()) ||
      b.route?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || b.status === filter;
    return matchSearch && matchFilter;
  });

  const updateStatus = async (id, status) => {
    if (status === "cancelled") {
      const ok = await swalConfirm("Cancel this booking?", "This action will update the booking status to cancelled.");
      if (!ok) return;
    }
    setActionLoading(true);
    try {
      await Api("put", `operator/bookings/${id}/status`, { status }, router);
      toastSuccess(`Booking marked as ${status}`);
      setView(null);
      loadBookings();
    } catch (err) {
      toastError(err?.message || "Failed to update booking status");
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) return null;

  const totalBookings = bookings.length;
  const confirmedCount = bookings.filter(b => b.status === "confirmed").length;
  const pendingCount = bookings.filter(b => b.status === "pending").length;
  const totalRevenue = bookings
    .filter(b => b.status === "confirmed" || b.status === "pending")
    .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e2e8f0] bg-white px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/operator")}
            className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3 py-2 text-xs font-medium text-[#64748b] hover:bg-[#f4f6f8]">
            <ArrowLeft size={14} /> Back
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eaf5dd]">
            <Ticket size={16} style={{ color: GREEN }} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1e293b]">Booking Management</p>
            <p className="text-xs text-[#64748b]">View & manage passenger bookings</p>
          </div>
        </div>
        <button onClick={loadBookings} title="Refresh"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e2e8f0] text-[#64748b] hover:bg-[#f4f6f8]">
          <RefreshCw size={15} className={loading ? "animate-spin text-[#4a6d00]" : ""} />
        </button>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4">
            <p className="text-xs font-semibold text-[#64748b]">Total Bookings</p>
            <p className="mt-1 text-2xl font-black text-[#1e293b]">{totalBookings}</p>
          </div>
          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4">
            <p className="text-xs font-semibold text-[#64748b]">Confirmed</p>
            <p className="mt-1 text-2xl font-black text-green-600">{confirmedCount}</p>
          </div>
          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4">
            <p className="text-xs font-semibold text-[#64748b]">Pending</p>
            <p className="mt-1 text-2xl font-black text-amber-600">{pendingCount}</p>
          </div>
          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4">
            <p className="text-xs font-semibold text-[#64748b]">Estimated Revenue</p>
            <p className="mt-1 text-2xl font-black text-[#f26522]">€{totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by passenger, ref, email or route..."
              className="w-full rounded-xl border border-[#e2e8f0] bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#4a6d00] focus:ring-2 focus:ring-[#4a6d00]/20" />
          </div>

          <div className="flex gap-1.5 overflow-x-auto rounded-xl border border-[#e2e8f0] bg-white p-1">
            {["all", "confirmed", "pending", "cancelled"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-all ${filter === f ? "bg-[#4a6d00] text-white shadow-sm" : "text-[#64748b] hover:text-[#1e293b]"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-20 text-[#94a3b8]">
            <RefreshCw size={28} className="animate-spin mb-2 text-[#4a6d00]" />
            <p className="text-sm">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#e2e8f0] bg-white py-16 text-[#94a3b8]">
            <Ticket size={40} className="mb-3 opacity-30 text-[#4a6d00]" />
            <p className="text-base font-semibold text-[#1e293b]">No bookings found</p>
            <p className="text-xs text-[#64748b] mt-1">There are no passenger bookings matching your search or filter.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 lg:hidden">
              {filteredBookings.map(b => (
                <div key={b.id} className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <p className="font-mono text-xs font-bold text-[#4a6d00]">{b.ref}</p>
                      <p className="font-bold text-[#1e293b]">{b.passenger}</p>
                      <p className="text-xs text-[#64748b]">{b.email}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="my-2.5 rounded-xl bg-[#f8fafc] p-2.5 text-xs text-[#374151]">
                    <p className="font-semibold text-[#1e293b]">{b.route}</p>
                    <div className="mt-1 flex items-center justify-between text-[#64748b]">
                      <span>Date: {b.date || "N/A"}</span>
                      <span>Seats: {b.seats}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-base font-black text-[#f26522]">€{b.amount}</span>
                    <button onClick={() => setView(b)}
                      className="flex items-center gap-1 rounded-lg bg-[#eaf5dd] px-3 py-1.5 text-xs font-bold text-[#4a6d00] hover:bg-[#d8ecbe]">
                      <Eye size={13} /> Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-sm lg:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-xs font-bold uppercase text-[#64748b]">
                    <th className="px-5 py-3.5">Booking Ref</th>
                    <th className="px-5 py-3.5">Passenger</th>
                    <th className="px-5 py-3.5">Route</th>
                    <th className="px-5 py-3.5">Travel Date</th>
                    <th className="px-5 py-3.5">Seats</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {filteredBookings.map(b => (
                    <tr key={b.id} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="px-5 py-4 font-mono text-xs font-bold text-[#4a6d00]">{b.ref}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#1e293b]">{b.passenger}</p>
                        <p className="text-xs text-[#64748b]">{b.email}</p>
                      </td>
                      <td className="px-5 py-4 font-medium text-[#374151]">{b.route}</td>
                      <td className="px-5 py-4 text-[#64748b]">{b.date || "N/A"}</td>
                      <td className="px-5 py-4 font-semibold text-[#1e293b]">{b.seats}</td>
                      <td className="px-5 py-4 font-black text-[#f26522]">€{b.amount}</td>
                      <td className="px-5 py-4"><StatusBadge status={b.status} /></td>
                      <td className="px-5 py-4 text-right">
                        <button onClick={() => setView(b)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-bold text-[#4a6d00] hover:bg-[#eaf5dd] transition-colors">
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      <Modal open={!!view} onClose={() => setView(null)} title="Booking Information">
        {view && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-[#eaf5dd] p-4">
              <div>
                <p className="text-xs font-semibold text-[#4a6d00]">Reference Code</p>
                <p className="font-mono text-lg font-black text-[#1e293b]">{view.ref}</p>
              </div>
              <StatusBadge status={view.status} />
            </div>

            <div className="space-y-2">
              {[
                ["Passenger Name", view.passenger],
                ["Email Address", view.email],
                ["Route", view.route],
                ["Operator", view.operator || user.fullname],
                ["Travel Date", view.date || "N/A"],
                ["Total Seats", view.seats],
                ["Seat Numbers", view.seatKeys && view.seatKeys.length > 0 ? view.seatKeys.map(formatSeatKey).join(", ") : "Auto Assigned"],
                ["Total Fare", `€${view.amount}`],
                ["Booking Date", view.createdAt ? new Date(view.createdAt).toLocaleDateString() : "N/A"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-4 py-2.5">
                  <span className="text-xs font-semibold text-[#64748b]">{k}</span>
                  <span className="text-sm font-bold text-[#1e293b]">{v}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              {view.status !== "cancelled" && !isPastDeparture(view.date, view.departureTime) && (
                <button onClick={() => updateStatus(view.id, "cancelled")} disabled={actionLoading}
                  className="flex-1 rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50">
                  Cancel Booking
                </button>
              )}
              {view.status !== "confirmed" && (
                <button onClick={() => updateStatus(view.id, "confirmed")} disabled={actionLoading}
                  className="flex-1 rounded-xl py-2.5 text-xs font-bold text-white disabled:opacity-50"
                  style={{ backgroundColor: GREEN }}>
                  Confirm Booking
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
