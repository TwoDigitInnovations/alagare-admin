import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  TrendingUp, DollarSign, ArrowLeft, RefreshCw,
  CheckCircle2, Clock, Calendar, Download, Wallet, CreditCard, ShieldCheck,
  X, AlertTriangle, AlertCircle, ShieldAlert
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
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankDetails, setBankDetails] = useState("HDFC Bank (A/C: *******8492)");
  const [payoutNotes, setPayoutNotes] = useState("");

  const [data, setData] = useState({
    stats: {
      grossRevenue: 0,
      netEarnings: 0,
      platformCommission: 0,
      pendingBalance: 0,
      totalBookings: 0,
      confirmedBookings: 0,
    },
    settlements: [],
  });

  const fetchRevenue = () => {
    setLoading(true);
    const u = readUser();
    const endpoint = u?.role === "admin" ? "admin/settlements" : "operator/revenue";
    
    Api("get", "operator/revenue", null, router)
      .then((res) => {
        const payload = res?.data || res;
        if (payload?.stats) {
          setData({
            stats: payload.stats,
            settlements: Array.isArray(payload.settlements) ? payload.settlements : [],
          });
        }
        if (payload?.bankAccount) {
          setBankDetails(payload.bankAccount);
        }
      })
      .catch((err) => {
        console.error("Revenue fetch error:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const u = readUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    setUser(u);
    fetchRevenue();
  }, [router]);

  const openPayoutModal = () => {
    if (data.stats.pendingBalance <= 0) {
      toastError("No pending balance available for payout settlement.");
      return;
    }
    setWithdrawAmount(String(data.stats.pendingBalance));
    setRequestModalOpen(true);
  };

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(withdrawAmount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      toastError("Please enter a valid withdrawal amount.");
      return;
    }
    if (numAmount > data.stats.pendingBalance) {
      toastError(`Withdrawal amount cannot exceed available balance (€${data.stats.pendingBalance}).`);
      return;
    }

    setSubmittingPayout(true);
    try {
      const res = await Api("post", "operator/payout-request", {
        amount: numAmount,
        bankDetails,
        notes: payoutNotes,
      }, router);

      if (res?.status === true || res?.settlement || res?.message) {
        toastSuccess("Payout settlement request submitted successfully!");
        setRequestModalOpen(false);
        setWithdrawAmount("");
        setPayoutNotes("");
        fetchRevenue();
      } else {
        toastError(res?.message || "Failed to submit payout request");
      }
    } catch (err) {
      toastError(err?.message || "Error submitting payout request");
    } finally {
      setSubmittingPayout(false);
    }
  };

  const updateSettlementStatus = async (settlementId, newStatus) => {
    const actionLabel = newStatus === "verified" ? "Verify" : newStatus === "settled" ? "Mark as Settled" : "Suspend";
    const ok = await swalConfirm(`${actionLabel} Settlement?`, `Are you sure you want to change settlement status to '${newStatus}'?`);
    if (!ok) return;

    try {
      const res = await Api("put", `admin/settlements/${settlementId}/status`, { status: newStatus }, router);
      if (res?.status === true || res?.settlement || res?.message) {
        toastSuccess(`Settlement status updated to ${newStatus}`);
        fetchRevenue();
      } else {
        toastError(res?.message || "Failed to update status");
      }
    } catch (err) {
      toastError(err?.message || "Error updating status");
    }
  };

  if (!user) return null;

  const numWithdraw = Number(withdrawAmount) || 0;
  const estCommission = Math.round(numWithdraw * 0.1);
  const estNetPayout = Math.max(0, numWithdraw - estCommission);

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
              onClick={openPayoutModal}
              disabled={data.stats.pendingBalance <= 0}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#4a6d00] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#3d5a00] disabled:opacity-50 transition"
            >
              <CreditCard size={15} />
              Request Payout Now
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-[#f8fafc] p-3 text-xs text-[#64748b]">
            <span className="flex items-center gap-1 font-semibold text-[#1e293b]">
              <ShieldCheck size={14} className="text-[#4a6d00]" /> Bank Payout Account:
            </span>
            <span>{bankDetails}</span>
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
            <div className="py-12 text-center text-xs text-[#94a3b8]">No settlements recorded yet. Click "Request Payout Now" to submit a withdrawal request.</div>
          ) : (
            <>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#f1f5f9] text-[#94a3b8] font-semibold">
                      <th className="pb-3">Settlement ID</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Requested</th>
                      <th className="pb-3">Net Payout</th>
                      <th className="pb-3">Commission (10%)</th>
                      <th className="pb-3">Bank Details</th>
                      <th className="pb-3">Status</th>
                      {user?.role === "admin" && <th className="pb-3 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f8fafc]">
                    {data.settlements.map((s) => {
                      const isPending = s.status === "pending";
                      const isVerified = s.status === "verified";
                      const isSettled = s.status === "settled";
                      const isSuspended = s.status === "suspended";

                      return (
                        <tr key={s._id || s.id} className="hover:bg-[#fafafa]">
                          <td className="py-3.5 font-mono font-bold text-[#1e293b]">{s.id}</td>
                          <td className="py-3.5 text-[#64748b]">
                            {new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                          <td className="py-3.5 text-[#1e293b] font-medium">€{(s.requestedAmount || s.amount).toLocaleString("en-US")}</td>
                          <td className="py-3.5 font-bold text-[#4a6d00]">€{s.amount.toLocaleString("en-US")}</td>
                          <td className="py-3.5 text-[#f26522] font-mono">€{(s.commission || 0).toLocaleString("en-US")}</td>
                          <td className="py-3.5 text-[#64748b]">{s.bankDetails || "NEFT Transfer"}</td>
                          <td className="py-3.5">
                            {isPending && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                                <Clock size={12} /> Pending Verification
                              </span>
                            )}
                            {isVerified && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                                <ShieldCheck size={12} /> Verified
                              </span>
                            )}
                            {isSettled && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                <CheckCircle2 size={12} /> Settled
                              </span>
                            )}
                            {isSuspended && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                                <AlertTriangle size={12} /> Suspended
                              </span>
                            )}
                          </td>
                          {user?.role === "admin" && (
                            <td className="py-3.5 text-right space-x-1.5">
                              {isPending && (
                                <button
                                  onClick={() => updateSettlementStatus(s._id, "verified")}
                                  className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
                                >
                                  Verify
                                </button>
                              )}
                              {(isPending || isVerified) && (
                                <button
                                  onClick={() => updateSettlementStatus(s._id, "settled")}
                                  className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                                >
                                  Settle
                                </button>
                              )}
                              {!isSuspended && (
                                <button
                                  onClick={() => updateSettlementStatus(s._id, "suspended")}
                                  className="rounded-lg bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                                >
                                  Suspend
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-[#f1f5f9] sm:hidden">
                {data.settlements.map((s) => (
                  <div key={s._id || s.id} className="py-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-[#1e293b]">{s.id}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        {s.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#64748b]">{new Date(s.date).toLocaleDateString("en-US")}</span>
                      <span className="font-bold text-[#4a6d00]">€{s.amount.toLocaleString("en-US")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </main>

      {requestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf5dd] text-[#4a6d00]">
                  <Wallet size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1e293b]">Request Settlement Payout</h3>
                  <p className="text-xs text-[#64748b]">Submit withdrawal request to bank account</p>
                </div>
              </div>
              <button
                onClick={() => setRequestModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#1e293b]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handlePayoutSubmit} className="space-y-4">
              
              <div className="rounded-xl bg-[#f8fafc] p-3 border border-[#e2e8f0] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[#64748b]">Available Balance</span>
                  <p className="text-lg font-black text-blue-600">€{data.stats.pendingBalance.toLocaleString("en-US")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(String(data.stats.pendingBalance))}
                  className="rounded-lg bg-[#eaf5dd] px-2.5 py-1 text-xs font-bold text-[#4a6d00] hover:bg-[#d8ebd0]"
                >
                  Withdraw Max
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1e293b] mb-1">
                  Withdrawal Amount (€) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={data.stats.pendingBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount (e.g. 200)"
                  required
                  className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1e293b] outline-none focus:border-[#4a6d00] focus:ring-2 focus:ring-[#4a6d00]/20"
                />
              </div>

              {numWithdraw > 0 && (
                <div className="rounded-xl border border-[#e2e8f0] bg-[#fafafa] p-3 text-xs space-y-1.5 text-[#64748b]">
                  <div className="flex justify-between">
                    <span>Requested Amount:</span>
                    <span className="font-semibold text-[#1e293b]">€{numWithdraw.toLocaleString("en-US")}</span>
                  </div>
                  <div className="flex justify-between text-[#f26522]">
                    <span>Platform Commission (10%):</span>
                    <span className="font-semibold">- €{estCommission.toLocaleString("en-US")}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[#e2e8f0] font-bold text-[#4a6d00] text-sm">
                    <span>Net Transfer Amount:</span>
                    <span>€{estNetPayout.toLocaleString("en-US")}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#1e293b] mb-1">
                  Bank Account <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankDetails}
                  onChange={(e) => setBankDetails(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-sm font-medium text-[#1e293b] outline-none focus:border-[#4a6d00] focus:ring-2 focus:ring-[#4a6d00]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1e293b] mb-1">Remarks / Notes (Optional)</label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="e.g. Regular weekly settlement request"
                  className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-sm text-[#1e293b] outline-none focus:border-[#4a6d00] focus:ring-2 focus:ring-[#4a6d00]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRequestModalOpen(false)}
                  className="rounded-xl border border-[#e2e8f0] px-4 py-2.5 text-xs font-bold text-[#64748b] hover:bg-[#f8fafc]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayout || numWithdraw <= 0}
                  className="rounded-xl bg-[#4a6d00] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#3d5a00] disabled:opacity-50"
                >
                  {submittingPayout ? "Submitting..." : "Submit Payout Request"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
