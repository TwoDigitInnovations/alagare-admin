import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import Badge from "@/components/Badge";
import { Api } from "@/services/service";
import {
  Euro,
  Ticket,
  Bus,
  Users,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Building2,
} from "lucide-react";

const formatMoney = (n) => {
  const val = Number(n) || 0;
  if (val >= 1000) {
    const k = val / 1000;
    return `€${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return `€${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    todayBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    activeRoutes: 0,
    totalRoutes: 0,
    totalUsers: 0,
    totalOperators: 0,
    activeOperators: 0,
  });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    Api("get", "admin/dashboard", null, router)
      .then((res) => {
        if (res?.data?.stats) setStats(res.data.stats);
        setRecent(res?.data?.recentBookings || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const STATS = [
    {
      label: "Total Revenue",
      value: formatMoney(stats.totalRevenue),
      icon: Euro,
      color: "bg-[#eaf5dd] text-[#4a6d00]",
      change: `${stats.confirmedBookings} confirmed`,
    },
    {
      label: "Total Bookings",
      value: stats.totalBookings,
      icon: Ticket,
      color: "bg-[#fff7ed] text-[#f26522]",
      change: `${stats.todayBookings} today`,
    },
    {
      label: "Active Routes",
      value: stats.activeRoutes,
      icon: Bus,
      color: "bg-[#f0f9ff] text-[#0369a1]",
      change: `${stats.totalRoutes} total`,
    },
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-[#f5f3ff] text-[#7c3aed]",
      change: `${stats.activeOperators} operators`,
    },
  ];

  return (
    <AdminLayout title="Dashboard">
      {loading ? (
        <p className="text-sm text-[#64748b]">Loading dashboard...</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-2xl border border-[#e2e8f0] bg-white p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.color}`}>
                    <s.icon size={18} />
                  </div>
                  <span className="flex items-center gap-0.5 text-xs font-semibold text-[#4a6d00]">
                    <TrendingUp size={12} /> {s.change}
                  </span>
                </div>
                <p className="text-xl font-bold text-[#1e293b] sm:text-2xl">{s.value}</p>
                <p className="mt-0.5 text-xs text-[#64748b]">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-[#e2e8f0] bg-white">
              <div className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-4">
                <h2 className="font-bold text-[#1e293b]">Recent Bookings</h2>
                <a href="/dashboard/bookings" className="flex items-center gap-1 text-xs font-semibold text-[#4a6d00]">
                  View all <ArrowUpRight size={14} />
                </a>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#f1f5f9] text-left text-xs text-[#94a3b8]">
                      <th className="px-5 py-3 font-medium">Ref</th>
                      <th className="px-3 py-3 font-medium">Passenger</th>
                      <th className="hidden px-3 py-3 font-medium sm:table-cell">Route</th>
                      <th className="px-3 py-3 font-medium">Amount</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center text-sm text-[#94a3b8]">
                          No bookings yet
                        </td>
                      </tr>
                    ) : (
                      recent.map((b) => (
                        <tr key={b.id} className="border-b border-[#f8fafc] hover:bg-[#fafafa]">
                          <td className="px-5 py-3 font-mono text-xs text-[#4a6d00]">{b.ref}</td>
                          <td className="px-3 py-3">
                            <p className="font-medium text-[#1e293b]">{b.passenger}</p>
                            <p className="text-xs text-[#94a3b8]">{b.email}</p>
                          </td>
                          <td className="hidden px-3 py-3 text-[#64748b] sm:table-cell">{b.route}</td>
                          <td className="px-3 py-3 font-semibold">€{Number(b.amount || 0).toFixed(2)}</td>
                          <td className="px-5 py-3">
                            <Badge variant={b.status}>{b.status}</Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                <h2 className="mb-4 font-bold text-[#1e293b]">Quick Stats</h2>
                {[
                  { label: "Today's Bookings", val: stats.todayBookings, icon: Ticket },
                  { label: "Pending Bookings", val: stats.pendingBookings, icon: Clock },
                  { label: "Active Routes", val: stats.activeRoutes, icon: Bus },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="mb-3 flex items-center justify-between rounded-xl bg-[#f8fafc] px-4 py-3 last:mb-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon size={16} className="text-[#4a6d00]" />
                      <span className="text-sm text-[#64748b]">{item.label}</span>
                    </div>
                    <span className="text-lg font-bold text-[#1e293b]">{item.val}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-[#e2e8f0] bg-[#1a2e05] p-5 text-white">
                <p className="text-sm font-bold">Alagare Platform</p>
                <p className="mt-1 text-xs text-white/60">
                  Live stats from your bookings, routes, operators and users.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white/10 p-3 text-center">
                    <p className="flex items-center justify-center gap-1 text-lg font-bold text-[#f26522]">
                      <Building2 size={14} /> {stats.totalOperators}
                    </p>
                    <p className="text-[10px] text-white/50">Operators</p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-3 text-center">
                    <p className="text-lg font-bold text-[#f26522]">{formatMoney(stats.totalRevenue)}</p>
                    <p className="text-[10px] text-white/50">Revenue</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
