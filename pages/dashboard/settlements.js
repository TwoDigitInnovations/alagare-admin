import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import Modal from "@/components/Modal";
import { Api } from "@/services/service";
import { toastSuccess, toastError, swalConfirm } from "@/utils/swal";
import {
  Wallet, ShieldCheck, Clock, CheckCircle2, AlertTriangle, RefreshCw, Search, DollarSign, Filter, Eye, Building, CreditCard
} from "lucide-react";

export default function AdminSettlementsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSettlement, setSelectedSettlement] = useState(null);

  const fetchSettlements = () => {
    setLoading(true);
    Api("get", "admin/settlements", null, router)
      .then((res) => {
        const list = res?.data?.settlements || res?.settlements || [];
        setSettlements(list);
      })
      .catch((err) => {
        console.error("Fetch settlements error:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettlements();
  }, [router]);

  const updateStatus = async (id, newStatus) => {
    const actionLabel = newStatus === "verified" ? "Verify" : newStatus === "settled" ? "Mark Settled" : "Suspend";
    const ok = await swalConfirm(`${actionLabel} Payout Settlement?`, `Confirm status update to '${newStatus}' for this payout request?`);
    if (!ok) return;

    try {
      const res = await Api("put", `admin/settlements/${id}/status`, { status: newStatus }, router);
      if (res?.status === true || res?.settlement || res?.message) {
        toastSuccess(`Settlement marked as ${newStatus}!`);
        setSelectedSettlement(null);
        fetchSettlements();
      } else {
        toastError(res?.message || "Failed to update status");
      }
    } catch (err) {
      toastError(err?.message || "Error updating settlement status");
    }
  };

  const filtered = settlements.filter((s) => {
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || (s.settlementId && s.settlementId.toLowerCase().includes(q)) || (s.operator && s.operator.toLowerCase().includes(q)) || (s.bankDetails && s.bankDetails.toLowerCase().includes(q));
    return matchStatus && matchQuery;
  });

  const totalRequested = settlements.reduce((acc, s) => acc + (s.requestedAmount || s.amount || 0), 0);
  const pendingCount = settlements.filter((s) => s.status === "pending").length;
  const settledTotal = settlements.filter((s) => s.status === "settled").reduce((acc, s) => acc + (s.netPayout ?? s.requestedAmount ?? s.amount ?? 0), 0);
  const settledCount = settlements.filter((s) => s.status === "settled").length;
  const suspendedCount = settlements.filter((s) => s.status === "suspended").length;

  return (
    <AdminLayout title="Payout Settlements">
      <div className="space-y-6" style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)" }}>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-black text-[#1e293b]">Operator Payout Settlements</h1>
            <p className="text-xs text-[#64748b]">Review, verify, approve, and suspend operator withdrawal requests</p>
          </div>
          <button
            onClick={fetchSettlements}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2 text-xs font-semibold text-[#1e293b] hover:bg-[#f8fafc] disabled:opacity-50 transition shadow-2xs"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh List
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64748b] uppercase tracking-wide">Total Payouts Requested</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Wallet size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-[#1e293b]">€{totalRequested.toLocaleString("en-US")}</p>
            <p className="mt-1 text-xs text-[#64748b]">{settlements.length} total requests</p>
          </div>

          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64748b] uppercase tracking-wide">Pending Verification</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Clock size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-amber-600">{pendingCount}</p>
            <p className="mt-1 text-xs text-[#64748b]">Awaiting admin action</p>
          </div>

          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64748b] uppercase tracking-wide">Total Settled</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-emerald-600">€{settledTotal.toLocaleString("en-US")}</p>
            <p className="mt-1 text-xs text-[#64748b]">{settledCount} completed disbursement{settledCount === 1 ? '' : 's'}</p>
          </div>

          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64748b] uppercase tracking-wide">Suspended Requests</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-rose-600">{suspendedCount}</p>
            <p className="mt-1 text-xs text-[#64748b]">On hold / compliance audit</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-2xs space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Settlement ID, Operator, or Bank..."
                className="w-full rounded-xl border border-[#e2e8f0] bg-white py-2 pl-8 pr-4 text-xs outline-none focus:border-[#4a6d00] focus:ring-2 focus:ring-[#4a6d00]/20"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <Filter size={13} className="text-[#64748b] mr-1" />
              {["all", "pending", "verified", "settled", "suspended"].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition ${
                    filterStatus === st
                      ? "bg-[#4a6d00] text-white shadow-2xs"
                      : "bg-[#f8fafc] text-[#64748b] hover:bg-[#f1f5f9]"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-[#94a3b8]">Loading operator settlements...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#94a3b8]">No settlement requests found.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#f1f5f9]">
              <table className="min-w-full divide-y divide-[#f1f5f9] text-xs">
                <thead>
                  <tr className="bg-[#f8fafc] text-[#64748b] font-bold">
                    <th className="px-4 py-3.5 text-left whitespace-nowrap">Settlement ID</th>
                    <th className="px-4 py-3.5 text-left whitespace-nowrap">Operator</th>
                    <th className="px-4 py-3.5 text-left whitespace-nowrap">Date</th>
                    <th className="px-4 py-3.5 text-right whitespace-nowrap">Requested</th>
                    <th className="px-4 py-3.5 text-right whitespace-nowrap">Commission</th>
                    <th className="px-4 py-3.5 text-right whitespace-nowrap">Net Payout</th>
                    <th className="px-4 py-3.5 text-left whitespace-nowrap">Bank Details</th>
                    <th className="px-4 py-3.5 text-center whitespace-nowrap">Status</th>
                    <th className="px-4 py-3.5 text-right whitespace-nowrap">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f8fafc] bg-white">
                  {filtered.map((s) => {
                    const isPending = s.status === "pending";
                    const isVerified = s.status === "verified";
                    const isSettled = s.status === "settled";
                    const isSuspended = s.status === "suspended";

                    return (
                      <tr key={s._id || s.settlementId} className="hover:bg-[#fafafa] transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-[#1e293b] whitespace-nowrap">
                          {s.settlementId}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-[#1e293b] whitespace-nowrap">
                          {s.operator}
                        </td>
                        <td className="px-4 py-3.5 text-[#64748b] whitespace-nowrap">
                          {new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-[#1e293b] text-right whitespace-nowrap">
                          €{(s.requestedAmount || 0).toLocaleString("en-US")}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[#f26522] text-right whitespace-nowrap">
                          €{(s.commissionDeducted || 0).toLocaleString("en-US")}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[#4a6d00] text-right whitespace-nowrap">
                          €{(s.netPayout || 0).toLocaleString("en-US")}
                        </td>
                        <td className="px-4 py-3.5 text-[#64748b] whitespace-nowrap">
                          <button
                            onClick={() => setSelectedSettlement(s)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#f8fafc] px-2.5 py-1 text-[11px] font-medium text-[#1e293b] hover:bg-[#f1f5f9] border border-[#e2e8f0] transition max-w-[180px] truncate"
                          >
                            <Building size={12} className="text-[#4a6d00] shrink-0" />
                            <span className="truncate">
                              {s.bankDetails ? s.bankDetails.split('(')[0].trim() : "Bank Transfer"}
                            </span>
                          </button>
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          {isPending && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                              <Clock size={12} /> Pending Verification
                            </span>
                          )}
                          {isVerified && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                              <ShieldCheck size={12} /> Verified
                            </span>
                          )}
                          {isSettled && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                              <CheckCircle2 size={12} /> Settled
                            </span>
                          )}
                          {isSuspended && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-700">
                              <AlertTriangle size={12} /> Suspended
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedSettlement(s)}
                              title="View Full Details"
                              className="rounded-lg bg-[#f1f5f9] p-1.5 text-[#64748b] hover:bg-[#e2e8f0] hover:text-[#1e293b] transition"
                            >
                              <Eye size={14} />
                            </button>
                            {isPending && (
                              <button
                                onClick={() => updateStatus(s._id, "verified")}
                                className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition"
                              >
                                Verify
                              </button>
                            )}
                            {(isPending || isVerified) && (
                              <button
                                onClick={() => updateStatus(s._id, "settled")}
                                className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition"
                              >
                                Settle
                              </button>
                            )}
                            {!isSuspended && (
                              <button
                                onClick={() => updateStatus(s._id, "suspended")}
                                className="rounded-lg bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition"
                              >
                                Suspend
                              </button>
                            )}
                            {isSuspended && (
                              <button
                                onClick={() => updateStatus(s._id, "verified")}
                                className="rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 hover:bg-amber-100 transition"
                              >
                                Reactivate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Settlement Details Inspection Modal */}
        <Modal
          open={!!selectedSettlement}
          onClose={() => setSelectedSettlement(null)}
          title={`Settlement Details — ${selectedSettlement?.settlementId || ""}`}
          wide
        >
          {selectedSettlement && (
            <div className="space-y-4 text-left">
              <div className="flex items-center justify-between rounded-xl bg-[#f8fafc] p-4 border border-[#e2e8f0]">
                <div>
                  <p className="text-xs font-medium text-[#64748b]">Operator Name</p>
                  <p className="text-base font-bold text-[#1e293b]">{selectedSettlement.operator}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-[#64748b]">Current Status</p>
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold capitalize mt-0.5 bg-white border border-[#e2e8f0]">
                    {selectedSettlement.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-[#e2e8f0] p-3.5 bg-white">
                  <span className="text-[11px] font-medium text-[#64748b]">Requested Amount</span>
                  <p className="text-base font-black text-[#1e293b] mt-1">
                    €{(selectedSettlement.requestedAmount || selectedSettlement.amount || 0).toLocaleString("en-US")}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e2e8f0] p-3.5 bg-white">
                  <span className="text-[11px] font-medium text-[#64748b]">Platform Commission</span>
                  <p className="text-base font-black text-[#f26522] mt-1">
                    €{(selectedSettlement.commissionDeducted || 0).toLocaleString("en-US")}
                  </p>
                </div>
                <div className="rounded-xl border border-[#d7e4c2] p-3.5 bg-[#f4f7ee]">
                  <span className="text-[11px] font-medium text-[#4a6d00]">Net Operator Payout</span>
                  <p className="text-base font-black text-[#4a6d00] mt-1">
                    €{(selectedSettlement.netPayout || (selectedSettlement.requestedAmount || 0) - (selectedSettlement.commissionDeducted || 0)).toLocaleString("en-US")}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[#e2e8f0] p-4 bg-white space-y-3">
                <h3 className="text-xs font-bold text-[#1e293b] uppercase tracking-wide flex items-center gap-1.5">
                  <Building size={14} className="text-[#4a6d00]" /> Full Registered Bank & Disbursement Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-[#f8fafc] p-3 border border-[#f1f5f9]">
                    <span className="text-[#64748b] block font-medium">Bank & Account Information</span>
                    <p className="font-semibold text-[#1e293b] mt-1 text-sm">{selectedSettlement.bankDetails || "NEFT / Wire Transfer"}</p>
                  </div>
                  <div className="rounded-lg bg-[#f8fafc] p-3 border border-[#f1f5f9]">
                    <span className="text-[#64748b] block font-medium">Requested On</span>
                    <p className="font-semibold text-[#1e293b] mt-1 text-sm">
                      {new Date(selectedSettlement.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e2e8f0]">
                {selectedSettlement.status === "pending" && (
                  <button
                    onClick={() => updateStatus(selectedSettlement._id, "verified")}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
                  >
                    Verify Settlement
                  </button>
                )}
                {(selectedSettlement.status === "pending" || selectedSettlement.status === "verified") && (
                  <button
                    onClick={() => updateStatus(selectedSettlement._id, "settled")}
                    className="rounded-xl bg-[#4a6d00] px-4 py-2 text-xs font-bold text-white hover:bg-[#3d5900] transition"
                  >
                    Mark as Settled
                  </button>
                )}
                {selectedSettlement.status !== "suspended" && (
                  <button
                    onClick={() => updateStatus(selectedSettlement._id, "suspended")}
                    className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition"
                  >
                    Suspend Payout
                  </button>
                )}
                {selectedSettlement.status === "suspended" && (
                  <button
                    onClick={() => updateStatus(selectedSettlement._id, "verified")}
                    className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition"
                  >
                    Reactivate Settlement
                  </button>
                )}
              </div>
            </div>
          )}
        </Modal>

      </div>
    </AdminLayout>
  );
}
