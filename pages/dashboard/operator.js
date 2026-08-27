import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  Bus, Ticket, BarChart3, DollarSign,
  LogOut, Bell, ChevronRight, TrendingUp, Users,
} from "lucide-react";

const GREEN = "#4a6d00";
const ORANGE = "#f26522";

function readUser() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem("userDetail") || "null"); } catch { return null; }
}

export default function OperatorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const u = readUser();
    if (!u || u.role !== "operator") {
      router.replace("/login");
      return;
    }
    setUser(u);
  }, [router]);

  const logout = () => {
    localStorage.removeItem("adminAuth");
    localStorage.removeItem("token");
    localStorage.removeItem("userDetail");
    router.push("/login");
  };

  if (!user) return null;

  const firstName = user.fullname?.split(" ")[0] || "Operator";
  const initials = (user.fullname || "O").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const MODULES = [
    { icon: Ticket, label: "Booking Management", sub: "View & manage bookings", href: "/dashboard/operator-bookings", color: "#eaf5dd", iconColor: GREEN, soon: false },
    { icon: Bus, label: "Fleet & Schedule", sub: "Buses, routes & stations", href: "/dashboard/operator-fleet", color: "#eaf5dd", iconColor: GREEN, soon: false },
    { icon: DollarSign, label: "Pricing Management", sub: "Fares, discounts & campaigns", href: "/dashboard/operator-pricing", color: "#fff8ec", iconColor: ORANGE, soon: false },
    { icon: TrendingUp, label: "Revenue & Commission", sub: "Earnings & settlements", href: "/dashboard/operator-revenue", color: "#fff8ec", iconColor: ORANGE, soon: false },
    { icon: BarChart3, label: "Reports & Analytics", sub: "Business performance", href: "/dashboard/operator-reports", color: "#eaf5dd", iconColor: GREEN, soon: false },
  ];

  return (
    <div className="min-h-screen bg-[#f4f6f8]">

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e2e8f0] bg-white px-4 sm:px-8">
        <div onClick={() => router.push("/dashboard/operator-profile")} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white" style={{ backgroundColor: GREEN }}>
            {initials}
          </div>
          <div>
            <p className="text-sm font-bold text-[#1e293b]">{user.fullname}</p>
            <p className="text-xs text-[#64748b]">Bus Operator Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-lg border border-[#e2e8f0] p-2 hover:bg-[#f4f6f8]">
              <Bell size={16} style={{ color: GREEN }} />
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-[#e2e8f0] bg-white shadow-lg overflow-hidden z-50">
                <div className="border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1e293b]">Notifications</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-[#64748b] hover:text-[#1e293b] text-xs">Close</button>
                </div>
                <div className="p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f4f6f8] mb-3">
                    <Bell size={20} className="text-[#94a3b8]" />
                  </div>
                  <p className="text-sm font-semibold text-[#1e293b]">All caught up!</p>
                  <p className="mt-1 text-xs text-[#64748b]">No notifications found right now.</p>
                </div>
              </div>
            )}
          </div>
          <button onClick={logout}
            className="flex items-center gap-1.5 rounded-xl border border-[#e2e8f0] px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8">

        <div className="mb-8">
          <h1 className="text-2xl font-black text-[#1e293b]">Welcome back, {firstName}! 👋</h1>
          <p className="mt-1 text-sm text-[#64748b]">Manage your buses, bookings and revenue from here.</p>
        </div>

        <div className="mb-8 rounded-2xl p-6 text-white" style={{ background: `linear-gradient(135deg, #1e3a0f 0%, ${GREEN} 100%)` }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wide">Account Status</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-lg font-black">Verified & Active</span>
              </div>
              <p className="mt-1 text-sm text-white/70">{user.email}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl font-black text-white">
              {initials}
            </div>
          </div>
        </div>

        <h2 className="mb-4 text-base font-bold text-[#1e293b]">Your Modules</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label}
                onClick={() => !m.soon && m.href !== "#" && router.push(m.href)}
                className={`relative rounded-2xl border border-[#e2e8f0] bg-white p-5 transition-all ${m.soon ? "opacity-70" : "hover:shadow-md hover:-translate-y-0.5 cursor-pointer"}`}>
                {m.soon && (
                  <span className="absolute right-3 top-3 rounded-full bg-[#fff8ec] px-2 py-0.5 text-[10px] font-bold text-[#e08a00]">
                    Coming Soon
                  </span>
                )}
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: m.color }}>
                  <Icon size={20} style={{ color: m.iconColor }} strokeWidth={2} />
                </div>
                <p className="font-bold text-[#1e293b]">{m.label}</p>
                <p className="mt-1 text-xs text-[#64748b]">{m.sub}</p>
                {!m.soon && (
                  <div className="mt-3 flex items-center gap-1 text-xs font-semibold" style={{ color: GREEN }}>
                    Open <ChevronRight size={13} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-[#e2e8f0] bg-white p-5">
          <p className="text-xs font-bold text-[#64748b] uppercase tracking-wide mb-3">Quick Info</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[["Platform", "TransiHub"], ["Support", "operators@alagare.com"], ["Role", "Verified Operator"], ["Portal Version", "v1.0"]].map(([k, v]) => (
              <div key={k}>
                <p className="text-xs text-[#94a3b8]">{k}</p>
                <p className="text-sm font-semibold text-[#1e293b] mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
