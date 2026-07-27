import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Bus,
  Ticket,
  Users,
  Building2,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronLeft,
  Home,
  Key,
  MapPin,
  Layers,
  FileText,
  MessageSquare,
  UserCircle,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/home", label: "App Home", icon: Home },
  { href: "/dashboard/content", label: "Content", icon: FileText },
  { href: "/dashboard/routes", label: "Bus Routes", icon: Bus },
  { href: "/dashboard/bookings", label: "Bookings", icon: Ticket },
  { href: "/dashboard/reports", label: "Reports", icon: MessageSquare },
  { href: "/dashboard/cities", label: "Cities", icon: MapPin },
  { href: "/dashboard/bus-types", label: "Bus Types", icon: Layers },
  { href: "/dashboard/users", label: "Users", icon: Users },
  { href: "/dashboard/operators", label: "Operators", icon: Building2 },
  { href: "/dashboard/operator-applications", label: "Applications", icon: FileText },
  // { href: "/dashboard/partners", label: "API Users", icon: Key },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
];

function readStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("userDetail") || "null");
  } catch {
    return null;
  }
}

export default function AdminLayout({ children, title }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("adminAuth")) {
      router.replace("/login");
    }
    setAdminUser(readStoredUser());
    const refresh = () => setAdminUser(readStoredUser());
    window.addEventListener("alagare-user-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("alagare-user-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [router]);

  const logout = () => {
    localStorage.removeItem("adminAuth");
    localStorage.removeItem("token");
    localStorage.removeItem("userDetail");
    router.push("/login");
  };

  const displayName = adminUser?.fullname || "Admin";
  const displayRole = adminUser?.role === "admin" ? "Super Admin" : adminUser?.role || "Admin";
  const avatarLetter = (displayName || "A").charAt(0).toUpperCase();
  const avatarUrl = adminUser?.image || "";

  const closeMobile = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-[#f4f6f8]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#1a2e05] text-white transition-all duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          ${collapsed ? "lg:w-[72px]" : "lg:w-[260px]"}
          w-[260px]`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          {!collapsed && (
            <div className="flex items-center gap-2.5 animate-fade-in">
              <Image src="/buslogo.png" alt="Alagare" width={36} height={36} />
              <div>
                <p className="text-sm font-bold leading-tight">Alagare</p>
                <p className="text-[10px] text-white/50">Admin Panel</p>
              </div>
            </div>
          )}
          {collapsed && (
            <Image src="/buslogo.png" alt="Alagare" width={32} height={32} className="mx-auto" />
          )}
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 hover:bg-white/10 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = router.pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={closeMobile}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200
                  ${active ? "bg-[#4a6d00] text-white shadow-md" : "text-white/70 hover:bg-[#2d4a0a] hover:text-white"}`}
                title={collapsed ? label : undefined}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className={`flex flex-1 flex-col transition-all duration-300 ${collapsed ? "lg:ml-[72px]" : "lg:ml-[260px]"}`}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e2e8f0] bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-[#e2e8f0] p-2 hover:bg-[#f4f6f8] lg:hidden"
            >
              <Menu size={18} className="text-[#4a6d00]" />
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden rounded-lg border border-[#e2e8f0] p-2 hover:bg-[#f4f6f8] lg:block"
            >
              <ChevronLeft
                size={18}
                className={`text-[#4a6d00] transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
              />
            </button>
            <h1 className="text-base font-bold text-[#1e293b] sm:text-lg">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative rounded-lg border border-[#e2e8f0] p-2 hover:bg-[#f4f6f8]">
              <Bell size={18} className="text-[#4a6d00]" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#f26522]" />
            </button>
            <Link
              href="/dashboard/profile"
              className="hidden items-center gap-2 rounded-xl px-1 py-0.5 hover:bg-[#f4f6f8] sm:flex"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4a6d00] text-xs font-bold text-white">
                  {avatarLetter}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-[#1e293b]">{displayName}</p>
                <p className="text-[10px] text-[#64748b]">{displayRole}</p>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
