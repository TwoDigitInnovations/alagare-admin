import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import { Api } from "@/services/service";
import { toastSuccess, toastError } from "@/utils/swal";
import { Search, Eye, Ticket } from "lucide-react";

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Api("get", "admin/bookings", null, router)
      .then((res) => setBookings(res?.data?.bookings || []))
      .catch(() => toastError("Failed to load bookings"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = bookings.filter((b) => {
    const matchSearch =
      b.passenger?.toLowerCase().includes(search.toLowerCase()) ||
      b.ref?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || b.status === filter;
    return matchSearch && matchFilter;
  });

  const updateStatus = async (id, status) => {
    try {
      await Api("put", `admin/bookings/${id}/status`, { status }, router);
      toastSuccess(`Booking ${status}`);
      setView(null);
      load();
    } catch {
      toastError("Failed to update booking");
    }
  };

  return (
    <AdminLayout title="Bookings">
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
                placeholder="Search by passenger or ref..."
                className="w-full rounded-xl border border-[#e2e8f0] bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#4a6d00]"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {["all", "confirmed", "cancelled"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold capitalize transition ${
                    filter === f
                      ? "bg-[#4a6d00] text-white"
                      : "border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 lg:hidden">
            {filtered.map((b) => (
              <div key={b.id} className="rounded-2xl border border-[#e2e8f0] bg-white p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="font-mono text-xs text-[#4a6d00]">{b.ref}</p>
                    <p className="font-bold text-[#1e293b]">{b.passenger}</p>
                  </div>
                  <Badge variant={b.status}>{b.status}</Badge>
                </div>
                <p className="mb-1 text-sm text-[#64748b]">{b.route}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#f26522]">€{b.amount}</span>
                  <button
                    onClick={() => setView(b)}
                    className="flex items-center gap-1 text-xs font-semibold text-[#4a6d00]"
                  >
                    <Eye size={13} /> View
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-left text-xs text-[#64748b]">
                  {["Ref", "Passenger", "Route", "Date", "Seats", "Amount", "Status", ""].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-b border-[#f8fafc] hover:bg-[#fafafa]">
                    <td className="px-4 py-3 font-mono text-xs text-[#4a6d00]">{b.ref}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{b.passenger}</p>
                      <p className="text-xs text-[#94a3b8]">{b.email}</p>
                    </td>
                    <td className="px-4 py-3 text-[#64748b]">{b.route}</td>
                    <td className="px-4 py-3">{b.date || "—"}</td>
                    <td className="px-4 py-3">{b.seats}</td>
                    <td className="px-4 py-3 font-bold text-[#f26522]">€{b.amount}</td>
                    <td className="px-4 py-3">
                      <Badge variant={b.status}>{b.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setView(b)}
                        className="rounded-lg p-1.5 hover:bg-[#eaf5dd]"
                      >
                        <Eye size={15} className="text-[#4a6d00]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-16 text-[#94a3b8]">
              <Ticket size={40} className="mb-3 opacity-40" />
              <p>No bookings found</p>
            </div>
          )}
        </>
      )}

      <Modal open={!!view} onClose={() => setView(null)} title="Booking Details">
        {view && (() => {
          const isPastBooking = view.date ? new Date(view.date) < new Date(new Date().setHours(0,0,0,0)) : false;
          return (
          <div className="space-y-3">
            {[
              ["Reference", view.ref],
              ["Passenger", view.passenger],
              ["Email", view.email],
              ["Route", view.route],
              ["Operator", view.operator],
              ["Date", view.date || "—"],
              ["Departure Time", view.departure || "—"],
              ["Arrival Time", view.arrival || "—"],
              ["Booked At", view.createdAt ? new Date(view.createdAt).toLocaleString() : "—"],
              ["Seats", view.seats],
              ["Amount", `€${view.amount}`],
              ["Status", view.status],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-4 py-3"
              >
                <span className="text-sm text-[#64748b]">{k}</span>
                <span className="text-sm font-semibold capitalize text-[#1e293b]">{v}</span>
              </div>
            ))}
            
            {!isPastBooking && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => updateStatus(view.id, "cancelled")}
                  className="flex-1 rounded-xl border border-[#e2e8f0] py-2.5 text-sm font-medium hover:bg-[#f8fafc]"
                >
                  Cancel Booking
                </button>
                <button
                  onClick={() => updateStatus(view.id, "confirmed")}
                  className="flex-1 rounded-xl bg-[#4a6d00] py-2.5 text-sm font-semibold text-white"
                >
                  Confirm
                </button>
              </div>
            )}
          </div>
          );
        })()}
      </Modal>
    </AdminLayout>
  );
}
