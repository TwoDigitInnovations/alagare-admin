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
  const [bankDetails, setBankDetails] = useState("No bank account linked");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscSwift, setIfscSwift] = useState("");
  const [branchName, setBranchName] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("sycapay");
  const [payoutProvider, setPayoutProvider] = useState("Orange");
  const [recipientMobile, setRecipientMobile] = useState("");
  const [executeInstant, setExecuteInstant] = useState(true);

  const [data, setData] = useState({
    stats: {
      grossRevenue: 0,
      commissionRate: 5,
      platformCommission: 0,
      totalLifetimeNetEarnings: 0,
      withdrawnAmount: 0,
      totalSettled: 0,
      totalPendingPayouts: 0,
      netEarnings: 0,
      netOperatorEarnings: 0,
      availableBalance: 0,
      pendingBalance: 0,
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
            stats: {
              ...payload.stats,
              netEarnings: Math.round((Number(payload.stats.netEarnings ?? payload.stats.availableBalance ?? 0)) * 100) / 100,
              withdrawnAmount: Math.round((Number(payload.stats.withdrawnAmount ?? 0)) * 100) / 100,
            },
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

  const availableBalance = Math.round((Number(data.stats.netEarnings) || 0) * 100) / 100;

  const openPayoutModal = () => {
    if (availableBalance <= 0) {
      toastError("No available balance for payout settlement.");
      return;
    }
    const cleanAmount = (Math.round(availableBalance * 100) / 100).toFixed(2).replace(/\.00$/, '');
    setWithdrawAmount(cleanAmount);
    setRequestModalOpen(true);
  };

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(withdrawAmount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      toastError("Please enter a valid withdrawal amount.");
      return;
    }
    if (numAmount > availableBalance) {
      toastError(`Withdrawal amount cannot exceed available balance (€${availableBalance}).`);
      return;
    }

    const isSyca = payoutMethod === "sycapay";
    if (isSyca && !recipientMobile.trim()) {
      toastError("Please enter the recipient mobile phone number.");
      return;
    }

    if (!isSyca) {
      if (!accountHolderName.trim()) {
        toastError("Please enter beneficiary / account holder name.");
        return;
      }
      if (!bankName.trim()) {
        toastError("Please enter bank name.");
        return;
      }
      if (!accountNumber.trim()) {
        toastError("Please enter bank account number / IBAN.");
        return;
      }
      if (!ifscSwift.trim()) {
        toastError("Please enter IFSC / SWIFT / BIC code.");
        return;
      }
    }

    const formattedBankDetails = isSyca
      ? `${payoutProvider} (${recipientMobile.trim()})`
      : `${accountHolderName.trim()} | ${bankName.trim()} | A/C: ${accountNumber.trim()} | SWIFT/IFSC: ${ifscSwift.trim()}${branchName.trim() ? ` | Branch: ${branchName.trim()}` : ''}`;

    setSubmittingPayout(true);
    try {
      const res = await Api("post", "operator/payout-request", {
        amount: numAmount,
        bankDetails: formattedBankDetails,
        paymentMethod: isSyca ? 'SycaPay Mobile Money' : 'Direct Bank Transfer',
        recipientMobile: isSyca ? recipientMobile.trim() : '',
        payoutProvider: isSyca ? payoutProvider : '',
        executeCashout: isSyca && executeInstant,
        notes: payoutNotes,
      }, router);

      if (res?.status === true || res?.settlement || res?.message) {
        toastSuccess("Payout settlement request submitted successfully!");
        setRequestModalOpen(false);
        setWithdrawAmount("");
        setPayoutNotes("");
        setRecipientMobile("");
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

  const handleSycapayCashout = async (settlement) => {
    const ok = await swalConfirm(
      "Process SycaPay Payout?",
      `Transfer €${(settlement.amount || settlement.requestedAmount).toLocaleString("en-US")} to ${settlement.payoutProvider || 'Orange'} (${settlement.recipientMobile}) via SycaPay?`
    );
    if (!ok) return;

    try {
      const res = await Api("post", `admin/settlements/${settlement._id}/cashout`, {
        phone: settlement.recipientMobile,
        provider: settlement.payoutProvider,
      }, router);
      if (res?.status === true || res?.settlement) {
        toastSuccess("SycaPay payout transfer initiated successfully!");
        fetchRevenue();
      } else {
        toastError(res?.message || "Failed to initiate transfer");
      }
    } catch (err) {
      toastError(err?.message || "Error executing payout");
    }
  };

  if (!user) return null;

  const numWithdraw = Number(withdrawAmount) || 0;

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

        {/* 4 Financial Stat Cards */}
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
            <p className="mt-1 text-xs text-[#64748b]">{data.stats.commissionRate || 5}% Platform fee</p>
          </div>

          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64748b] uppercase tracking-wide">Net Operator Earnings</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf5dd] text-[#4a6d00]">
                <Wallet size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-[#4a6d00]">
              €{availableBalance.toLocaleString("en-US")}
            </p>
            <p className="mt-1 text-xs text-[#64748b]">Available balance for withdrawal</p>
          </div>

          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64748b] uppercase tracking-wide">Withdrawn / Payouts</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Clock size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-blue-600">
              €{data.stats.withdrawnAmount.toLocaleString("en-US")}
            </p>
            <p className="mt-1 text-xs text-[#64748b]">
              {data.stats.totalPendingPayouts > 0 ? `€${data.stats.totalPendingPayouts} pending approval` : "Total requested payouts"}
            </p>
          </div>
        </div>

        {/* Request Payout Action Box */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-2xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1e293b]">Request Settlement Payout</h2>
              <p className="mt-0.5 text-xs text-[#64748b]">
                Request immediate transfer of your available funds (€{availableBalance.toLocaleString("en-US")}) to your registered bank account.
              </p>
            </div>
            <button
              onClick={openPayoutModal}
              disabled={availableBalance <= 0}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#4a6d00] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#3d5a00] disabled:opacity-50 transition cursor-pointer"
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
            <span>Settlement Cycle: Direct Bank Transfer (NEFT)</span>
          </div>
        </div>

        {/* Settlement History Table */}
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
                      <th className="pb-3">Requested Amount</th>
                      <th className="pb-3">Net Payout</th>
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
                          <td className="py-3.5 font-bold text-[#4a6d00]">€{(s.amount || s.requestedAmount).toLocaleString("en-US")}</td>
                          <td className="py-3.5 text-[#64748b]">
                            <div>{s.bankDetails || "NEFT Transfer"}</div>
                            {s.sycapayTransactionId && (
                              <div className="text-[10px] font-mono text-[#4a6d00] font-semibold mt-0.5">
                                SycaPay Ref: {s.sycapayTransactionId}
                              </div>
                            )}
                          </td>
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
                              {s.recipientMobile && !isSettled && !s.sycapayTransactionId && (
                                <button
                                  onClick={() => handleSycapayCashout(s)}
                                  className="rounded-lg bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-[#f26522] hover:bg-orange-100"
                                >
                                  SycaPay Payout
                                </button>
                              )}
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
                      <span className="font-bold text-[#4a6d00]">€{(s.amount || s.requestedAmount).toLocaleString("en-US")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </main>

      {/* Payout Request Modal */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-2xl sm:max-w-3xl rounded-2xl bg-white p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150 my-auto">
            
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf5dd] text-[#4a6d00]">
                  <Wallet size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#1e293b]">Request Settlement Payout</h3>
                  <p className="text-xs text-[#64748b]">Withdraw operator balance via SycaPay Mobile Money or Bank Wire</p>
                </div>
              </div>
              <button
                onClick={() => setRequestModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#1e293b] transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePayoutSubmit} className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Left Column: Balance & Amount */}
                <div className="space-y-4">
                  <div className="rounded-xl bg-[#f8fafc] p-3.5 border border-[#e2e8f0] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-[#64748b]">Available Balance</span>
                      <p className="text-xl font-black text-[#4a6d00]">€{availableBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(String(availableBalance))}
                      className="rounded-lg bg-[#eaf5dd] px-2.5 py-1 text-xs font-bold text-[#4a6d00] hover:bg-[#d8ebd0] transition"
                    >
                      Withdraw Max
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1e293b] mb-1">
                      Withdrawal Amount (€) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#64748b]">€</span>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        max={availableBalance}
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="0.00"
                        required
                        className="w-full rounded-xl border border-[#e2e8f0] bg-white pl-8 pr-3.5 py-2.5 text-sm font-bold text-[#1e293b] outline-none focus:border-[#4a6d00] focus:ring-2 focus:ring-[#4a6d00]/20"
                      />
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      {[0.25, 0.5, 0.75, 1].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setWithdrawAmount(String(Math.round(availableBalance * pct * 100) / 100))}
                          className="flex-1 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] py-1 text-[11px] font-semibold text-[#64748b] hover:border-[#4a6d00] hover:text-[#4a6d00] transition"
                        >
                          {pct === 1 ? '100% (Max)' : `${pct * 100}%`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {numWithdraw > 0 && (
                    <div className="rounded-xl border border-[#e2e8f0] bg-[#fafafa] p-3.5 text-xs space-y-2 text-[#64748b]">
                      <div className="flex justify-between">
                        <span>Requested Withdrawal:</span>
                        <span className="font-semibold text-[#1e293b]">€{numWithdraw.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Remaining Balance:</span>
                        <span className="font-semibold text-blue-600">€{Math.max(0, availableBalance - numWithdraw).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-[#e2e8f0] font-bold text-[#4a6d00] text-sm">
                        <span>Net Payout Amount:</span>
                        <span>€{numWithdraw.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Payout Method & Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1e293b] mb-1.5">Payout Method</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPayoutMethod("sycapay")}
                        className={`rounded-xl border p-2.5 text-xs font-bold text-left transition ${
                          payoutMethod === "sycapay"
                            ? "border-[#4a6d00] bg-[#f2f7e8] text-[#4a6d00]"
                            : "border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
                        }`}
                      >
                        <div>SycaPay Mobile Money</div>
                        <div className="text-[10px] font-normal text-[#64748b] mt-0.5">Orange, MTN, Moov, Wave</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayoutMethod("bank")}
                        className={`rounded-xl border p-2.5 text-xs font-bold text-left transition ${
                          payoutMethod === "bank"
                            ? "border-[#4a6d00] bg-[#f2f7e8] text-[#4a6d00]"
                            : "border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
                        }`}
                      >
                        <div>Bank Transfer</div>
                        <div className="text-[10px] font-normal text-[#64748b] mt-0.5">Direct wire / NEFT</div>
                      </button>
                    </div>
                  </div>

                  {payoutMethod === "sycapay" ? (
                    <div className="space-y-3 rounded-xl border border-[#e2e8f0] bg-[#fafafa] p-3.5">
                      <div>
                        <label className="block text-xs font-bold text-[#1e293b] mb-1">Mobile Operator</label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {["Orange", "MTN", "Moov", "Wave"].map((prov) => (
                            <button
                              key={prov}
                              type="button"
                              onClick={() => setPayoutProvider(prov)}
                              className={`rounded-lg py-1.5 text-xs font-bold transition text-center ${
                                payoutProvider === prov
                                  ? "bg-[#4a6d00] text-white shadow-xs"
                                  : "bg-white border border-[#e2e8f0] text-[#1e293b] hover:bg-[#f1f5f9]"
                              }`}
                            >
                              {prov}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1e293b] mb-1">
                          Recipient Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={recipientMobile}
                          onChange={(e) => setRecipientMobile(e.target.value)}
                          placeholder="e.g. 0709000001 or +2250709000001"
                          required={payoutMethod === "sycapay"}
                          className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2 text-xs font-medium text-[#1e293b] outline-none focus:border-[#4a6d00]"
                        />
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer pt-0.5 text-xs font-medium text-[#1e293b]">
                        <input
                          type="checkbox"
                          checked={executeInstant}
                          onChange={(e) => setExecuteInstant(e.target.checked)}
                          className="rounded accent-[#4a6d00]"
                        />
                        <span>Instant SycaPay Cashout Transfer</span>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-xl border border-[#e2e8f0] bg-[#fafafa] p-3.5">
                      <div>
                        <label className="block text-xs font-bold text-[#1e293b] mb-1">
                          Account / Beneficiary Holder Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={accountHolderName}
                          onChange={(e) => setAccountHolderName(e.target.value)}
                          placeholder="e.g. John Doe / Transport LLC"
                          required={payoutMethod === "bank"}
                          className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2 text-xs font-medium text-[#1e293b] outline-none focus:border-[#4a6d00]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-[#1e293b] mb-1">
                            Bank Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="e.g. BNP Paribas / Ecobank"
                            required={payoutMethod === "bank"}
                            className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2 text-xs font-medium text-[#1e293b] outline-none focus:border-[#4a6d00]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#1e293b] mb-1">
                            IFSC / SWIFT / BIC <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={ifscSwift}
                            onChange={(e) => setIfscSwift(e.target.value)}
                            placeholder="e.g. ECOBCIBJ / HDFC0001"
                            required={payoutMethod === "bank"}
                            className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2 text-xs font-medium text-[#1e293b] outline-none focus:border-[#4a6d00]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-[#1e293b] mb-1">
                            Account Number / IBAN <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            placeholder="e.g. CI06 0100 1234 5678"
                            required={payoutMethod === "bank"}
                            className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2 text-xs font-medium text-[#1e293b] outline-none focus:border-[#4a6d00]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#1e293b] mb-1">Branch / City (Optional)</label>
                          <input
                            type="text"
                            value={branchName}
                            onChange={(e) => setBranchName(e.target.value)}
                            placeholder="e.g. Abidjan Plateau"
                            className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2 text-xs font-medium text-[#1e293b] outline-none focus:border-[#4a6d00]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#1e293b] mb-1">Settlement Notes (Optional)</label>
                    <textarea
                      value={payoutNotes}
                      onChange={(e) => setPayoutNotes(e.target.value)}
                      placeholder="Optional reference notes for finance team..."
                      rows={2}
                      className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2 text-xs font-medium text-[#1e293b] outline-none focus:border-[#4a6d00]"
                    />
                  </div>
                </div>

              </div>

              <div className="pt-3 border-t border-[#f1f5f9] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRequestModalOpen(false)}
                  className="rounded-xl border border-[#e2e8f0] px-4 py-2 text-xs font-semibold text-[#64748b] hover:bg-[#f8fafc] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayout || numWithdraw <= 0 || numWithdraw > availableBalance}
                  className="rounded-xl bg-[#4a6d00] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#3d5a00] disabled:opacity-50 transition"
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
