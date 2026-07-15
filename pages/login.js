import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AuthApi, ensureApiKey, setClientKeys } from "@/services/service";
import { Eye, EyeOff, Lock, Mail, Bus } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@alagare.com");
  const [password, setPassword] = useState("admin123");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    ensureApiKey().catch(() => {});
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await ensureApiKey();
      const res = await AuthApi("post", "auth/login", { email, password }, router);
      const user = res?.data?.user;
      const token = res?.data?.token;
      const apiKey = res?.data?.apiKey;
      const keys = res?.data?.keys;
      if (!user || user.role !== "admin") {
        setError("Admin access only");
        return;
      }
      if (apiKey) localStorage.setItem("apiKey", apiKey);
      if (keys) setClientKeys(keys);
      localStorage.setItem("token", token);
      localStorage.setItem("adminAuth", "true");
      localStorage.setItem("userDetail", JSON.stringify(user));
      router.push("/dashboard");
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left branding — hidden on mobile */}
      <div className="hidden w-1/2 flex-col justify-between bg-[#1a2e05] p-12 lg:flex">
        <div className="flex items-center gap-3">
          <Image src="/buslogo.png" alt="Alagare" width={48} height={48} />
          <div>
            <p className="text-2xl font-bold text-white">Alagare</p>
            <p className="text-sm text-white/50">Bus Booking Platform</p>
          </div>
        </div>
        <div>
          <h2 className="mb-4 text-4xl font-bold leading-tight text-white">
            Manage your bus<br />operations with ease
          </h2>
          <p className="max-w-sm text-white/60">
            Routes, bookings, users & operators — all in one powerful admin dashboard.
          </p>
          <div className="mt-8 flex gap-4">
            {[
              { label: "Active Routes", val: "18+" },
              { label: "Bookings", val: "156+" },
              { label: "Users", val: "342+" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xl font-bold text-[#f26522]">{s.val}</p>
                <p className="text-xs text-white/50">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-white/30">© 2026 Alagare. All rights reserved.</p>
      </div>

      {/* Right form */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-10 lg:w-1/2">
        <div className="mb-8 flex flex-col items-center lg:hidden">
          <Image src="/buslogo.png" alt="Alagare" width={56} height={56} />
          <p className="mt-2 text-xl font-bold text-[#1a2e05]">Alagare Admin</p>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#1e293b]">Welcome back</h1>
            <p className="mt-1 text-sm text-[#64748b]">Sign in to your admin account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#374151]">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@alagare.com"
                  className="w-full rounded-xl border border-[#e2e8f0] bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#4a6d00] focus:ring-2 focus:ring-[#4a6d00]/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#374151]">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#e2e8f0] bg-white py-3 pl-10 pr-11 text-sm outline-none transition focus:border-[#4a6d00] focus:ring-2 focus:ring-[#4a6d00]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4a6d00] py-3 text-sm font-semibold text-white transition hover:bg-[#3d5a00] disabled:opacity-60"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <Bus size={16} />
                  Sign In
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#94a3b8]">
            Demo: admin@alagare.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
}
