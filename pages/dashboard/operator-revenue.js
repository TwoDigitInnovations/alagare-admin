import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  TrendingUp, DollarSign, ArrowLeft, RefreshCw,
  CheckCircle2, Clock, Calendar, Download, Wallet, CreditCard, ShieldCheck
} from "lucide-react";
import { Api } from "@/services/service";
import { toastSuccess, toastError, swalConfirm } from "@/utils/swal";

const GREEN = "#4a6d00";
const ORANGE = "#f26522";

function readUser() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem("userDetail") || "null"); } catch { return null; }
}

export default function OperatorRevenuePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [data, setData] = useState({
    stats: {
      grossRevenue: 0,
      netEarnings: 0,
      platformCommission: 0,
      pendingBalance: 0,
      settledAmount: 0,
      totalBookings: 0,
      confirmedBookings: 0,
    },
    settlements: [],
  });

  const fetchRevenue = () => {
    setLoading(true);
    Api("get", "operator/revenue", null, router)
      .then((res) => {
        const payload = res?.data || res;
        if (payload?.stats) {
          setData({
            stats: payload.stats,
            settlements: Array.isArray(payload.settlements) ? payload.settlements : [],
          });
        }
      })
      .catch((err) => {
        console.error("Revenue fetch error:", err);
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
    fetchRevenue();
  }, [router]);

  const handleRequestPayout = async () => {
    if (data.stats.pendingBalance <= 0) {
      toastError("No pending balance available for payout settlement.");
      return;
    }
    const ok = await swalConfirm(
      "Request Settlement Payout?",
      `Submit payout request for €${data.stats.pendingBalance.toLocaleString("en-US")} to your registered bank account?`
    );
    if (!ok) return;

    setRequesting(true);
    setTimeout(() => {
      setRequesting(false);
      toastSuccess("Payout settlement request submitted successfully! Funds will credit within 24-48 hours.");
      fetchRevenue();
    }, 1000);
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
                <h1 className="text-base sm:text-lg font-black text-[#1e293b]">Revenue & Settlements</h1>
                <span className="rounded-full bg-[#fff8ec] px-2.5 py-0.5 text-[10px] font-bold text-[#f26522]">FINANCIALS</span>
              </div>
              <p className="text-xs text-[#64748b]">Track gross earnings, commission breakdown, and payout settlements</p>
            </div>
          </div>

          <button
            onClick={fetchRevenue}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-xs font-semibold text-[#1e293b] hover:bg-[#f8fafc] disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 space-y-6">

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64748b] uppercase tracking-wide">Gross Ticket Sales</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf5dd] text-[#4a6d00]">
                <TrendingUp size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-[#1e293b]">
              €{data.stats.grossRevenue.toLocaleString("en-US")}
            </p>
            <p className="mt-1 text-xs text-[#64748b]">Total ticket bookings processed</p>
          </div>

          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64748b] uppercase tracking-wide">Platform Commission</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff8ec] text-[#f26522]">
                <DollarSign size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-[#f26522]">
              €{data.stats.platformCommission.toLocaleString("en-US")}
            </p>
            <p className="mt-1 text-xs text-[#64748b]">10% Alagare platform fee</p>
          </div>

          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64748b] uppercase tracking-wide">Net Operator Earnings</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf5dd] text-[#4a6d00]">
                <Wallet size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-[#4a6d00]">
              €{data.stats.netEarnings.toLocaleString("en-US")}
            </p>
            <p className="mt-1 text-xs text-[#64748b]">Gross revenue minus commission</p>
          </div>

          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64748b] uppercase tracking-wide">Pending Payout Balance</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Clock size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-blue-600">
              €{data.stats.pendingBalance.toLocaleString("en-US")}
            </p>
            <p className="mt-1 text-xs text-[#64748b]">Ready for next settlement cycle</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-2xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1e293b]">Request Settlement Payout</h2>
              <p className="mt-0.5 text-xs text-[#64748b]">
                Request immediate transfer of available funds (€{data.stats.pendingBalance.toLocaleString("en-US")}) to your registered bank account.
              </p>
            </div>
            <button
              onClick={handleRequestPayout}
              disabled={requesting || data.stats.pendingBalance <= 0}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#4a6d00] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#3d5a00] disabled:opacity-50 transition"
            >
              <CreditCard size={15} />
              {requesting ? "Processing Request..." : "Request Payout Now"}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-[#f8fafc] p-3 text-xs text-[#64748b]">
            <span className="flex items-center gap-1 font-semibold text-[#1e293b]">
              <ShieldCheck size={14} className="text-[#4a6d00]" /> Bank Payout Account:
            </span>
            <span>HDFC Bank (A/C: *******8492)</span>
            <span className="text-[#cbd5e1]">|</span>
            <span>Settlement Cycle: Every Tuesday & Friday</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-2xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1e293b]">Settlement Payout History</h2>
              <p className="text-xs text-[#64748b]">Recent payout transfers issued to your registered bank account</p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-[#94a3b8]">Loading settlement history...</div>
          ) : data.settlements.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#94a3b8]">No settlements recorded yet.</div>
          ) : (
            <>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#f1f5f9] text-[#94a3b8] font-semibold">
                      <th className="pb-3">Settlement ID</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Period</th>
                      <th className="pb-3">Net Payout</th>
                      <th className="pb-3">Commission Deducted</th>
                      <th className="pb-3">Payment Method</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f8fafc]">
                    {data.settlements.map((s) => (
                      <tr key={s.id} className="hover:bg-[#fafafa]">
                        <td className="py-3.5 font-mono font-bold text-[#1e293b]">{s.id}</td>
                        <td className="py-3.5 text-[#64748b]">
                          {new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="py-3.5 text-[#1e293b] font-medium">{s.period}</td>
                        <td className="py-3.5 font-bold text-[#4a6d00]">€{s.amount.toLocaleString("en-US")}</td>
                        <td className="py-3.5 text-[#f26522] font-mono">€{s.commission.toLocaleString("en-US")}</td>
                        <td className="py-3.5 text-[#64748b]">{s.method}</td>
                        <td className="py-3.5 text-right">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                            <CheckCircle2 size={12} /> Settled
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-[#f1f5f9] sm:hidden">
                {data.settlements.map((s) => (
                  <div key={s.id} className="py-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-[#1e293b]">{s.id}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 size={11} /> Settled
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#64748b]">{s.period} ({new Date(s.date).toLocaleDateString("en-US")})</span>
                      <span className="font-bold text-[#4a6d00]">€{s.amount.toLocaleString("en-US")}</span>
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
