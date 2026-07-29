import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import { Api } from "@/services/service";
import { toastSuccess, toastError, swalConfirm } from "@/utils/swal";
import {
  Wallet, ShieldCheck, Clock, CheckCircle2, AlertTriangle, RefreshCw, Search, DollarSign, Filter
} from "lucide-react";

export default function AdminSettlementsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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
  const settledTotal = settlements.filter((s) => s.status === "settled").reduce((acc, s) => acc + (s.amount || 0), 0);
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
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf5dd] text-[#4a6d00]">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-[#4a6d00]">€{settledTotal.toLocaleString("en-US")}</p>
            <p className="mt-1 text-xs text-[#64748b]">Completed disbursements</p>
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#f1f5f9] text-[#94a3b8] font-semibold">
                    <th className="pb-3">Settlement ID</th>
                    <th className="pb-3">Operator</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Requested</th>
                    <th className="pb-3">Commission</th>
                    <th className="pb-3">Net Payout</th>
                    <th className="pb-3">Bank Details</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f8fafc]">
                  {filtered.map((s) => {
                    const isPending = s.status === "pending";
                    const isVerified = s.status === "verified";
                    const isSettled = s.status === "settled";
                    const isSuspended = s.status === "suspended";

                    return (
                      <tr key={s._id || s.settlementId} className="hover:bg-[#fafafa]">
                        <td className="py-3.5 font-mono font-bold text-[#1e293b]">{s.settlementId}</td>
                        <td className="py-3.5 font-semibold text-[#1e293b]">{s.operator}</td>
                        <td className="py-3.5 text-[#64748b]">
                          {new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="py-3.5 font-medium text-[#1e293b]">€{(s.requestedAmount || 0).toLocaleString("en-US")}</td>
                        <td className="py-3.5 font-mono text-[#f26522]">€{(s.commissionDeducted || 0).toLocaleString("en-US")}</td>
                        <td className="py-3.5 font-bold text-[#4a6d00]">€{(s.netPayout || 0).toLocaleString("en-US")}</td>
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
                        <td className="py-3.5 text-right space-x-1.5">
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
