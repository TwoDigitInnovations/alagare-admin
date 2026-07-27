import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import { Api } from "@/services/service";
import { toastSuccess, toastError, swalConfirm } from "@/utils/swal";
import {
  Search, Building2, Mail, Phone, MapPin,
  ChevronDown, ChevronUp, CheckCircle, XCircle, Clock, Eye, X, FileText,
} from "lucide-react";

const STATUS_OPTIONS = ["pending", "under_review", "approved", "rejected"];
const STATUS_LABEL = { pending: "Pending", under_review: "Under Review", approved: "Approved", rejected: "Rejected" };
const STATUS_COLOR = {
  pending: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  under_review: "bg-blue-50 text-blue-700 border border-blue-200",
  approved: "bg-green-50 text-green-700 border border-green-200",
  rejected: "bg-red-50 text-red-700 border border-red-200",
};
const DOC_LABELS = {
  registration: "Company Registration",
  permit: "Route Permit",
  vehicle: "Vehicle Registration",
  insurance: "Insurance Certificate",
  bank: "Bank Details",
  id: "ID Proof",
};

const isImage = (url) => /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url);

function DocModal({ doc, onClose }) {
  if (!doc) return null;
  const img = isImage(doc.url);
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-[#4a6d00]" />
            <span className="text-sm font-bold text-[#1e293b]">{doc.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <a href={doc.url} target="_blank" rel="noreferrer"
              className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-semibold text-[#4a6d00] hover:bg-[#eaf5dd] transition-colors">
              Open in new tab ↗
            </a>
            <button onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-zinc-50 flex items-center justify-center min-h-[400px]">
          {img ? (
            <img src={doc.url} alt={doc.label}
              className="max-w-full max-h-[70vh] object-contain rounded-lg m-4 shadow-sm" />
          ) : (
            <iframe src={doc.url} title={doc.label}
              className="w-full h-[70vh] border-0" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function OperatorApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [docModal, setDocModal] = useState(null);

  const load = () => {
    setLoading(true);
    Api("get", "operator/applications", null, router)
      .then((res) => setApplications(res?.data?.applications || []))
      .catch(() => toastError("Failed to load applications"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = applications.filter((a) => {
    const matchSearch =
      a.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      a.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const updateStatus = async (id, status) => {
    const ok = await swalConfirm(`Set status to "${STATUS_LABEL[status]}"?`, "This will update the application status.");
    if (!ok) return;
    setUpdatingId(id);
    try {
      await Api("put", `operator/applications/${id}/status`, { status }, router);
      toastSuccess(`Status updated to ${STATUS_LABEL[status]}`);
      load();
    } catch {
      toastError("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = applications.filter(a => a.status === s).length;
    return acc;
  }, {});

  return (
    <>
      <AdminLayout title="Operator Applications">
      <div className="space-y-5">

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STATUS_OPTIONS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
              className={`rounded-xl border p-4 text-left transition-all hover:shadow-sm ${statusFilter === s ? "border-[#4a6d00] bg-[#eaf5dd]" : "border-[#e2e8f0] bg-white"}`}>
              <p className="text-2xl font-black text-[#4a6d00]">{counts[s] || 0}</p>
              <p className="text-xs font-medium text-[#64748b] mt-0.5">{STATUS_LABEL[s]}</p>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by company, name or email..."
              className="w-full rounded-xl border border-[#e2e8f0] bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#4a6d00]" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#4a6d00]">
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-[#94a3b8]">Loading applications...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-[#94a3b8]">
            <Building2 size={40} className="mb-3 opacity-30" />
            <p className="text-sm">No applications found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((a) => (
              <div key={a._id} className="rounded-2xl border border-[#e2e8f0] bg-white overflow-hidden">

                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#eaf5dd]">
                      <Building2 size={20} className="text-[#4a6d00]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[#1e293b] truncate">{a.companyName}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-[#64748b]">
                          <Mail size={11} /> {a.email}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-[#64748b]">
                          <Phone size={11} /> {a.phone}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-[#64748b]">
                          <MapPin size={11} /> {a.city}{a.state ? `, ${a.state}` : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-2 ml-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[a.status]}`}>
                      {STATUS_LABEL[a.status]}
                    </span>
                    <button onClick={() => setExpandedId(expandedId === a._id ? null : a._id)}
                      className="rounded-lg border border-[#e2e8f0] p-2 hover:bg-[#f8fafc]">
                      {expandedId === a._id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                </div>

                {expandedId === a._id && (
                  <div className="border-t border-[#e2e8f0] bg-[#f8fafc] p-5 space-y-5">

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {[
                        ["Registration No.", a.registrationNo],
                        ["GST", a.gst || "N/A"],
                        ["Year Founded", a.yearFounded || "N/A"],
                        ["Owner / Contact", a.ownerName],
                        ["Total Buses", a.totalBuses],
                        ["Routes Covered", a.routesCovered || "N/A"],
                        ["Bus Types", (a.busTypes || []).join(", ") || "N/A"],
                        ["Address", a.address || "N/A"],
                        ["Applied On", new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <p className="text-xs text-[#94a3b8] font-medium">{k}</p>
                          <p className="text-sm font-semibold text-[#1e293b] mt-0.5">{v}</p>
                        </div>
                      ))}
                    </div>

                    {a.docs && Object.keys(a.docs).some(k => a.docs[k]) && (
                      <div>
                        <p className="text-xs font-bold text-[#64748b] uppercase tracking-wide mb-2">Documents</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(a.docs).map(([k, v]) =>
                            v ? (
                              <button key={k}
                                onClick={() => setDocModal({ url: v, label: DOC_LABELS[k] || k })}
                                className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-medium text-[#4a6d00] hover:border-[#4a6d00] hover:bg-[#eaf5dd] transition-colors">
                                <Eye size={12} /> {DOC_LABELS[k] || k}
                              </button>
                            ) : (
                              <span key={k} className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-medium text-[#94a3b8]">
                                {DOC_LABELS[k] || k} — Not uploaded
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-bold text-[#64748b] uppercase tracking-wide mb-2">Update Status</p>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.filter(s => s !== a.status).map(s => (
                          <button key={s} onClick={() => updateStatus(a._id, s)}
                            disabled={updatingId === a._id}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 ${
                              s === "approved" ? "bg-green-600 text-white hover:bg-green-700" :
                              s === "rejected" ? "bg-red-500 text-white hover:bg-red-600" :
                              s === "under_review" ? "bg-blue-500 text-white hover:bg-blue-600" :
                              "bg-yellow-500 text-white hover:bg-yellow-600"
                            }`}>
                            {s === "approved" ? <CheckCircle size={12} /> : s === "rejected" ? <XCircle size={12} /> : <Clock size={12} />}
                            {updatingId === a._id ? "..." : `Mark as ${STATUS_LABEL[s]}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
    <DocModal doc={docModal} onClose={() => setDocModal(null)} />
    </>
  );
}
