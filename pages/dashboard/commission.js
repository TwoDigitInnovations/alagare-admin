import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import Badge from "@/components/Badge";
import { Api } from "@/services/service";
import { toastError } from "@/utils/swal";
import {
  Search,
  Coins,
  TrendingUp,
  Building2,
  Percent,
  Wallet,
  Calendar,
  Filter,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export default function CommissionPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOperator, setSelectedOperator] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const loadData = () => {
    Api("get", "admin/commission", null, router)
      .then((res) => {
        setData(res?.data || null);
      })
      .catch(() => toastError("Failed to load commission reports"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, selectedOperator, selectedStatus, perPage]);

  const summary = data?.summary || {
    totalGrossAmount: 0,
    totalCommissionEarned: 0,
    totalOperatorPayouts: 0,
    totalBookingsCount: 0,
    defaultCommissionRate: 5,
  };

  const operatorStats = data?.operatorStats || [];
  const bookings = data?.bookings || [];

  const filteredBookings = bookings.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch =
      (b.ref || "").toLowerCase().includes(q) ||
      (b.passenger || "").toLowerCase().includes(q) ||
      (b.operator || "").toLowerCase().includes(q) ||
      (b.route || "").toLowerCase().includes(q);

    const matchOperator =
      selectedOperator === "all" || b.operator === selectedOperator;

    const matchStatus =
      selectedStatus === "all" || b.status === selectedStatus;

    return matchSearch && matchOperator && matchStatus;
  });

  const totalItems = filteredBookings.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalItems);
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  const uniqueOperators = Array.from(
    new Set(bookings.map((b) => b.operator).filter(Boolean))
  );

  return (
    <AdminLayout title="Commission Earnings">
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm font-medium text-[#64748b]">Loading commission report...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-xl font-bold text-[#1e293b]">Commission Earnings & Operator Revenue</h1>
              <p className="text-xs text-[#64748b]">
                Platform commission is automatically added to the operator base bus fare and tracked dynamically.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-xs font-semibold text-[#1e293b] shadow-sm">
                <Percent size={14} className="text-[#4a6d00]" />
                <span>Default Platform Commission:</span>
                <span className="rounded-md bg-[#eaf5dd] px-2 py-0.5 text-xs font-bold text-[#4a6d00]">
                  {summary.defaultCommissionRate}%
                </span>
              </div>
              <button
                onClick={() => router.push("/dashboard/settings")}
                className="flex items-center gap-1 rounded-xl bg-[#4a6d00] px-3 py-2 text-xs font-semibold text-white hover:bg-[#3d5a00] transition shadow-sm"
              >
                Change % Rate
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">
                  Total Commission Earned
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf5dd] text-[#4a6d00]">
                  <Coins size={20} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-[#4a6d00]">
                €{Number(summary.totalCommissionEarned || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="mt-1 flex items-center text-xs text-[#64748b]">
                <TrendingUp size={12} className="mr-1 text-[#4a6d00]" />
                Platform net earnings from bookings
              </p>
            </div>

            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">
                  Gross Ticket Volume
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff7ed] text-[#f26522]">
                  <ArrowUpRight size={20} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-[#1e293b]">
                €{Number(summary.totalGrossAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="mt-1 text-xs text-[#64748b]">
                Total paid by passengers across all routes
              </p>
            </div>

            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">
                  Operator Net Share
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f5f9] text-[#0284c7]">
                  <Wallet size={20} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-[#0284c7]">
                €{Number(summary.totalOperatorPayouts || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="mt-1 text-xs text-[#64748b]">
                Base fare revenue payable to bus operators
              </p>
            </div>

            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">
                  Commission Bookings
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f8fafc] text-[#64748b]">
                  <Building2 size={20} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-[#1e293b]">
                {summary.totalBookingsCount}
              </p>
              <p className="mt-1 text-xs text-[#64748b]">
                Across {operatorStats.length} active bus operators
              </p>
            </div>
          </div>

          <div>
            {/* <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1e293b]">Operator Earnings Breakdown</h2>
              <span className="text-xs text-[#64748b]">{operatorStats.length} Operators</span>
            </div> */}

            {/* <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {operatorStats.map((op, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm transition hover:border-[#cbd5e1]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f8fafc] text-[#4a6d00] font-bold text-sm border border-[#e2e8f0]">
                        {op.operatorName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#1e293b]">{op.operatorName}</h3>
                        <p className="text-xs text-[#64748b]">{op.bookingsCount} bookings • {op.totalSeats} seats</p>
                      </div>
                    </div>
                    <span className="rounded-md bg-[#f8fafc] px-2 py-0.5 text-xs font-bold text-[#64748b]">
                      {op.commissionRate}% comm.
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-[#fafafa] p-3 text-center">
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-[#94a3b8]">Gross Total</p>
                      <p className="mt-0.5 text-xs font-bold text-[#1e293b]">€{Number(op.grossAmount || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-[#94a3b8]">Base Payout</p>
                      <p className="mt-0.5 text-xs font-bold text-[#0284c7]">€{Number(op.operatorPayout || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-[#94a3b8]">Admin Fee</p>
                      <p className="mt-0.5 text-xs font-bold text-[#4a6d00]">+€{Number(op.commissionEarned || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div> */}
          </div>

          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#1e293b]">Itemized Commission Breakdown</h2>
                <p className="text-xs text-[#64748b]">All ticket bookings with bus operator base fare and platform commission</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px]">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search ref, passenger, operator..."
                    className="w-full rounded-xl border border-[#e2e8f0] bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-[#4a6d00]"
                  />
                </div>

                <select
                  value={selectedOperator}
                  onChange={(e) => setSelectedOperator(e.target.value)}
                  className="rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-xs font-medium text-[#64748b] outline-none focus:border-[#4a6d00]"
                >
                  <option value="all">All Operators</option>
                  {uniqueOperators.map((op) => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-xs font-medium text-[#64748b] outline-none focus:border-[#4a6d00]"
                >
                  <option value="all">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 lg:hidden">
              {paginatedBookings.map((b) => (
                <div key={b.id} className="rounded-xl border border-[#e2e8f0] bg-[#fafafa] p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-xs font-semibold text-[#4a6d00]">{b.ref}</p>
                      <p className="font-bold text-sm text-[#1e293b]">{b.passenger}</p>
                      <p className="text-xs text-[#64748b]">{b.operator} • {b.route}</p>
                    </div>
                    <Badge variant={b.status}>{b.status}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-white p-2.5 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-[#94a3b8] block">Base Fare</span>
                      <span className="font-semibold text-[#0284c7]">€{Number(b.operatorBaseFare || 0).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#94a3b8] block">Commission ({b.commissionRate || 0}%)</span>
                      <span className="font-bold text-[#4a6d00]">+€{Number(b.commissionAmount || 0).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#94a3b8] block">Customer Total</span>
                      <span className="font-bold text-[#f26522]">€{Number(b.amount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-xl border border-[#e2e8f0] lg:block">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                    <th className="px-4 py-3 font-semibold">Booking Ref</th>
                    <th className="px-4 py-3 font-semibold">Date & Time</th>
                    <th className="px-4 py-3 font-semibold">Passenger</th>
                    <th className="px-4 py-3 font-semibold">Bus Operator</th>
                    <th className="px-4 py-3 font-semibold">Route</th>
                    <th className="px-4 py-3 font-semibold text-center">Seats</th>
                    <th className="px-4 py-3 font-semibold text-right">Base Fare</th>
                    <th className="px-4 py-3 font-semibold text-right">Commission</th>
                    <th className="px-4 py-3 font-semibold text-right">Total Price</th>
                    <th className="px-4 py-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {paginatedBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-[#f8fafc] transition">
                      <td className="px-4 py-3 font-mono font-medium text-[#4a6d00]">{b.ref}</td>
                      <td className="px-4 py-3 text-[#64748b]">{b.date} {b.departure ? `(${b.departure})` : ""}</td>
                      <td className="px-4 py-3 font-medium text-[#1e293b]">{b.passenger}</td>
                      <td className="px-4 py-3 font-semibold text-[#1e293b]">{b.operator}</td>
                      <td className="px-4 py-3 text-[#64748b]">{b.route}</td>
                      <td className="px-4 py-3 text-center font-medium">{b.seats}</td>
                      <td className="px-4 py-3 text-right font-medium text-[#0284c7]">€{Number(b.operatorBaseFare || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center rounded-full bg-[#eaf5dd] px-2 py-0.5 font-bold text-[#4a6d00]">
                          +€{Number(b.commissionAmount || 0).toFixed(2)} <span className="ml-1 text-[10px] text-[#4a6d00]/70">({b.commissionRate || 0}%)</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[#f26522]">€{Number(b.amount || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={b.status}>{b.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalItems > 0 && (
              <div className="flex flex-col items-center justify-between gap-3 border-t border-[#e2e8f0] pt-4 sm:flex-row">
                <div className="flex items-center gap-3 text-xs text-[#64748b]">
                  <span>
                    Showing <strong className="text-[#1e293b]">{startIndex + 1}</strong> to{" "}
                    <strong className="text-[#1e293b]">{endIndex}</strong> of{" "}
                    <strong className="text-[#1e293b]">{totalItems}</strong> bookings
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span>Rows:</span>
                    <select
                      value={perPage}
                      onChange={(e) => setPerPage(Number(e.target.value))}
                      className="rounded-lg border border-[#e2e8f0] bg-white px-2 py-1 text-xs font-semibold text-[#1e293b] outline-none focus:border-[#4a6d00]"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(1)}
                    disabled={currentPage <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc] disabled:opacity-40"
                    title="First page"
                  >
                    <ChevronsLeft size={14} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc] disabled:opacity-40"
                    title="Previous page"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1];
                        return (
                          <div key={p} className="flex items-center gap-1">
                            {prev && p - prev > 1 && (
                              <span className="px-1 text-xs text-[#94a3b8]">…</span>
                            )}
                            <button
                              onClick={() => setPage(p)}
                              className={`h-8 min-w-[32px] rounded-lg px-2 text-xs font-semibold transition ${
                                p === currentPage
                                  ? "bg-[#4a6d00] text-white"
                                  : "border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
                              }`}
                            >
                              {p}
                            </button>
                          </div>
                        );
                      })}
                  </div>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc] disabled:opacity-40"
                    title="Next page"
                  >
                    <ChevronRight size={14} />
                  </button>
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={currentPage >= totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc] disabled:opacity-40"
                    title="Last page"
                  >
                    <ChevronsRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {filteredBookings.length === 0 && (
              <div className="flex flex-col items-center py-12 text-[#94a3b8]">
                <Coins size={36} className="mb-2 opacity-40" />
                <p className="text-sm">No commission records found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
