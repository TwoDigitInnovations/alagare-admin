import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  BarChart3, ArrowLeft, RefreshCw, Download,
  Bus, Users, Ticket, Percent, TrendingUp, CheckCircle2
} from "lucide-react";
import { Api } from "@/services/service";
import { toastSuccess } from "@/utils/swal";

const GREEN = "#4a6d00";
const ORANGE = "#f26522";

function readUser() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem("userDetail") || "null"); } catch { return null; }
}

export default function OperatorReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all");
  const [data, setData] = useState({
    summary: {
      totalBookings: 0,
      confirmedCount: 0,
      pendingCount: 0,
      cancelledCount: 0,
      grossRevenue: 0,
      avgTicketValue: 0,
      cancellationRate: 0,
    },
    routePerformance: [],
  });

  const fetchReports = () => {
    setLoading(true);
    Api("get", `operator/reports?time=${timeFilter}`, null, router)
      .then((res) => {
        const payload = res?.data || res;
        if (payload?.summary) {
          setData({
            summary: payload.summary,
            routePerformance: Array.isArray(payload.routePerformance) ? payload.routePerformance : [],
          });
        }
      })
      .catch((err) => {
        console.error("Reports fetch error:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const u = readUser();
    if (!u || u.role !== "operator") {
      router.replace("/login");
      return;
    }
    setUser(u);
    fetchReports();
  }, [router, timeFilter]);

  const handleExportCSV = () => {
    if (data.routePerformance.length === 0) {
      toastSuccess("No data available to export.");
      return;
    }
    const headers = ["Route Title", "Bus Type", "Ticket Price", "Bookings Count", "Occupancy Rate %", "Total Revenue (INR)"];
    const rows = data.routePerformance.map(r => [
      `"${r.title}"`,
      `"${r.busType}"`,
      r.price,
      r.bookingsCount,
      `${r.occupancyRate}%`,
      r.revenue,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Operator_Route_Performance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess("Route Performance Report CSV exported successfully!");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f4f6f8]" style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)" }}>
      <header className="sticky top-0 z-30 border-b border-[#e2e8f0] bg-white px-4 py-3.5 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/operator" className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e2e8f0] text-[#64748b] hover:border-[#4a6d00] hover:text-[#4a6d00] transition">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-[#1e293b]">Reports & Analytics</h1>
                <span className="rounded-full bg-[#eaf5dd] px-2.5 py-0.5 text-[10px] font-bold text-[#4a6d00]">PERFORMANCE</span>
              </div>
              <p className="text-xs text-[#64748b]">Real-time route occupancy, booking volume, and business intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl bg-[#4a6d00] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#3d5a00] transition"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 space-y-6">

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e2e8f0] bg-white p-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#64748b]">Time Range:</span>
            {["all", "today", "month", "year"].map((t) => (
              <button
                key={t}
                onClick={() => setTimeFilter(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  timeFilter === t
                    ? "bg-[#1e293b] text-white"
                    : "bg-[#f8fafc] text-[#64748b] hover:text-[#1e293b]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={fetchReports}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#4a6d00] hover:underline"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh Data
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64748b] uppercase tracking-wide">Total Bookings</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf5dd] text-[#4a6d00]">
                <Ticket size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-[#1e293b]">{data.summary.totalBookings}</p>
            <p className="mt-1 text-xs text-[#64748b]">
              <span className="font-bold text-emerald-600">{data.summary.confirmedCount} confirmed</span>
            </p>
          </div>

          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64748b] uppercase tracking-wide">Total Gross Revenue</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff8ec] text-[#f26522]">
                <TrendingUp size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-[#f26522]">
              €{data.summary.grossRevenue.toLocaleString("en-US")}
            </p>
            <p className="mt-1 text-xs text-[#64748b]">Total ticket sales processed</p>
          </div>

          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64748b] uppercase tracking-wide">Avg Ticket Value</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Users size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-blue-600">
              €{data.summary.avgTicketValue.toLocaleString("en-US")}
            </p>
            <p className="mt-1 text-xs text-[#64748b]">Average fare per seat booking</p>
          </div>

          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64748b] uppercase tracking-wide">Cancellation Rate</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500">
                <Percent size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-red-500">{data.summary.cancellationRate}%</p>
            <p className="mt-1 text-xs text-[#64748b]">{data.summary.cancelledCount} cancelled bookings</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-2xs">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1e293b]">Route Performance Breakdown</h2>
              <p className="text-xs text-[#64748b]">Occupancy rate, ticket sales, and total revenue per bus route</p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-[#94a3b8]">Loading route analytics...</div>
          ) : data.routePerformance.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#94a3b8]">No route performance records found. Add routes to track performance.</div>
          ) : (
            <>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#f1f5f9] text-[#94a3b8] font-semibold">
                      <th className="pb-3">Route Title</th>
                      <th className="pb-3">Bus Type</th>
                      <th className="pb-3">Fare Price</th>
                      <th className="pb-3">Bookings</th>
                      <th className="pb-3">Occupancy Rate</th>
                      <th className="pb-3 text-right">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f8fafc]">
                    {data.routePerformance.map((r) => (
                      <tr key={r.routeId} className="hover:bg-[#fafafa]">
                        <td className="py-4 font-bold text-[#1e293b]">
                          <div className="flex items-center gap-2">
                            <Bus size={15} className="text-[#4a6d00]" />
                            {r.title}
                          </div>
                        </td>
                        <td className="py-4 text-[#64748b]">{r.busType}</td>
                        <td className="py-4 font-mono text-[#1e293b]">€{r.price}</td>
                        <td className="py-4 font-semibold text-[#1e293b]">{r.bookingsCount}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-2 max-w-[140px]">
                            <div className="h-2 w-full rounded-full bg-[#e2e8f0] overflow-hidden">
                              <div className="h-full bg-[#4a6d00] rounded-full" style={{ width: `${r.occupancyRate}%` }} />
                            </div>
                            <span className="font-mono text-xs font-bold text-[#1e293b]">{r.occupancyRate}%</span>
                          </div>
                        </td>
                        <td className="py-4 text-right font-bold text-[#4a6d00]">
                          €{r.revenue.toLocaleString("en-US")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-[#f1f5f9] sm:hidden">
                {data.routePerformance.map((r) => (
                  <div key={r.routeId} className="py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bus size={15} className="text-[#4a6d00]" />
                        <span className="font-bold text-xs text-[#1e293b]">{r.title}</span>
                      </div>
                      <span className="font-bold text-xs text-[#4a6d00]">€{r.revenue.toLocaleString("en-US")}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#64748b]">
                      <span>{r.busType} (€{r.price}/seat)</span>
                      <span>{r.bookingsCount} bookings</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="h-2 w-full rounded-full bg-[#e2e8f0] overflow-hidden">
                        <div className="h-full bg-[#4a6d00] rounded-full" style={{ width: `${r.occupancyRate}%` }} />
                      </div>
                      <span className="font-mono text-xs font-bold text-[#1e293b]">{r.occupancyRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </main>
    </div>
  );
}
