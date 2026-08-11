import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AuthApi, Api, ensureApiKey, setClientKeys } from "@/services/service";
import { Eye, EyeOff, Lock, Mail, Bus, Phone } from "lucide-react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

const GREEN = "#4a6d00";


export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState("admin");

  const [email, setEmail] = useState("admin@alagare.com");
  const [password, setPassword] = useState("admin123");
  const [showPass, setShowPass] = useState(false);

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { ensureApiKey().catch(() => {}); }, []);

  useEffect(() => {
    if (otpTimer <= 0) return;
    const t = setInterval(() => setOtpTimer(v => { if (v <= 1) { clearInterval(t); return 0; } return v - 1; }), 1000);
    return () => clearInterval(t);
  }, [otpTimer]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await ensureApiKey();
      const res = await AuthApi("post", "auth/login", { email, password }, router);
      const user = res?.data?.user;
      const token = res?.data?.token;
      if (!user || user.role !== "admin") { setError("Admin access only"); return; }
      if (res?.data?.apiKey) localStorage.setItem("apiKey", res.data.apiKey);
      if (res?.data?.keys) setClientKeys(res.data.keys);
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

  const handleSendOtp = async () => {
    if (!phone || !isValidPhoneNumber(phone)) { 
      setError("Please enter a valid phone number"); 
      return; 
    }
    setError(""); setLoading(true);
    try {
      await ensureApiKey();
      await Api("post", "operator/send-otp", { phone: phone.trim(), isLogin: true }, router);
      setOtpSent(true);
      setOtpTimer(30);
    } catch (err) {
      setError(err?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOperatorLogin = async (e) => {
    e.preventDefault();
    if (!otp.trim()) { setError("Enter the OTP"); return; }
    setError(""); setLoading(true);
    try {
      await ensureApiKey();
      const res = await Api("post", "operator/login", { phone: phone.trim(), otp: otp.trim() }, router);
      const user = res?.data?.user;
      const token = res?.data?.token;
      if (!user) { setError("Login failed"); return; }
      if (res?.data?.apiKey) localStorage.setItem("apiKey", res.data.apiKey);
      if (res?.data?.keys) setClientKeys(res.data.keys);
      localStorage.setItem("token", token);
      localStorage.setItem("adminAuth", "true");
      localStorage.setItem("userDetail", JSON.stringify(user));
      router.push("/dashboard/operator");
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
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
            Routes, bookings, users & operators — all in one powerful dashboard.
          </p>
          <div className="mt-8 flex gap-4">
            {[["Active Routes", "18+"], ["Bookings", "156+"], ["Users", "342+"]].map(([l, v]) => (
              <div key={l} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xl font-bold text-[#f26522]">{v}</p>
                <p className="text-xs text-white/50">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-white/30">© 2026 Alagare. All rights reserved.</p>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-4 py-10 lg:w-1/2">
        <div className="mb-8 flex flex-col items-center lg:hidden">
          <Image src="/buslogo.png" alt="Alagare" width={56} height={56} />
          <p className="mt-2 text-xl font-bold text-[#1a2e05]">Alagare</p>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-6 flex rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-1">
            <button onClick={() => { setTab("admin"); setError(""); setOtpSent(false); }}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${tab === "admin" ? "bg-white shadow-sm text-[#1e293b]" : "text-[#64748b] hover:text-[#1e293b]"}`}>
              Admin Login
            </button>
            <button onClick={() => { setTab("operator"); setError(""); setOtpSent(false); }}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${tab === "operator" ? "bg-white shadow-sm text-[#1e293b]" : "text-[#64748b] hover:text-[#1e293b]"}`}>
              Operator Login
            </button>
          </div>

          {tab === "admin" ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#1e293b]">Welcome back</h1>
                <p className="mt-1 text-sm text-[#64748b]">Sign in to your admin account</p>
              </div>
              <form onSubmit={handleAdminLogin} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#374151]">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@alagare.com"
                      className="w-full rounded-xl border border-[#e2e8f0] bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#4a6d00] focus:ring-2 focus:ring-[#4a6d00]/20" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#374151]">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                    <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                      className="w-full rounded-xl border border-[#e2e8f0] bg-white py-3 pl-10 pr-11 text-sm outline-none focus:border-[#4a6d00] focus:ring-2 focus:ring-[#4a6d00]/20" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: GREEN }}>
                  {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><Bus size={16} /> Sign In</>}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#1e293b]">Operator Login</h1>
                <p className="mt-1 text-sm text-[#64748b]">Sign in with your registered phone number</p>
              </div>
              <form onSubmit={handleOperatorLogin} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#374151]">Phone Number</label>
                  <div className="flex gap-2">
                    <div className={`relative flex-1 phone-input-wrapper rounded-xl border ${error && error.includes("phone") ? 'border-red-500' : 'border-[#e2e8f0]'} bg-white px-4 py-2.5 transition focus-within:border-[#4a6d00] focus-within:ring-2 focus-within:ring-[#4a6d00]/20`}>
                      <PhoneInput
                        international
                        defaultCountry="US"
                        placeholder="Phone Number"
                        value={phone}
                        onChange={val => { setPhone(val || ""); setOtpSent(false); setOtp(""); setError(""); }}
                        style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: "14px" }}
                      />
                    </div>
                    {!otpSent && (
                      <button type="button" onClick={handleSendOtp} disabled={loading}
                        className="rounded-xl px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                        style={{ backgroundColor: GREEN }}>
                        {loading ? "..." : "Send OTP"}
                      </button>
                    )}
                  </div>
                </div>

                {otpSent && (
                  <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
                    <p className="mb-3 text-sm text-[#64748b]">Enter the 4-digit OTP sent to <strong>{phone}</strong></p>
                    <div className="flex items-center gap-3">
                      <input type="text" maxLength={4} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="0000"
                        className="w-24 rounded-xl border border-[#e2e8f0] bg-white px-4 py-3 text-center text-lg font-bold tracking-widest outline-none focus:border-[#4a6d00] focus:ring-2 focus:ring-[#4a6d00]/20" />
                      <button type="button" onClick={handleSendOtp} disabled={otpTimer > 0 || loading}
                        className="ml-auto text-xs font-medium disabled:text-[#94a3b8]"
                        style={{ color: otpTimer > 0 ? undefined : GREEN }}>
                        {otpTimer > 0 ? `Resend in ${otpTimer}s` : "Resend OTP"}
                      </button>
                    </div>
                  </div>
                )}

                {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

                {otpSent && (
                  <button type="submit" disabled={loading || otp.length < 4}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: GREEN }}>
                    {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><Phone size={16} /> Login with OTP</>}
                  </button>
                )}
              </form>
              <p className="mt-4 text-center text-xs text-[#94a3b8]">
                Use the phone number you registered with. OTP: 7777 (demo)
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
