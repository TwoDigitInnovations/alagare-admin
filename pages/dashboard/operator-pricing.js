import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Api } from "@/services/service";
import { toastSuccess, toastError, swalConfirm } from "@/utils/swal";
import {
  DollarSign, ArrowLeft, Tag, Bus, Plus, Pencil, Trash2, Search, X, CheckCircle, Clock
} from "lucide-react";

const GREEN = "#4a6d00";
const ORANGE = "#f26522";

function readUser() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem("userDetail") || "null"); } catch { return null; }
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0]">
          <h3 className="font-bold text-[#1e293b]">{title}</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-[#94a3b8] hover:bg-[#f1f5f9]">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto max-h-[75vh]">{children}</div>
      </div>
    </div>
  );
}

export default function OperatorPricing() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("fares");
  const [loading, setLoading] = useState(true);

  const [routes, setRoutes] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [search, setSearch] = useState("");

  const [fareModal, setFareModal] = useState(false);
  const [editRoute, setEditRoute] = useState(null);
  const [newPrice, setNewPrice] = useState("");
  const [fareLoading, setFareLoading] = useState(false);

  const [campaignModal, setCampaignModal] = useState(false);
  const [campForm, setCampForm] = useState({
    code: "",
    title: "",
    discountPercent: "15",
    maxDiscount: "10",
    routeId: "all",
    startDate: "",
    endDate: "",
    status: "active",
  });
  const [campLoading, setCampLoading] = useState(false);

  useEffect(() => {
    const u = readUser();
    if (!u || u.role !== "operator") {
      router.replace("/login");
      return;
    }
    setUser(u);
    loadAll();
  }, [router]);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      Api("get", "operator/pricing/routes", null, router),
      Api("get", "operator/pricing/campaigns", null, router),
    ])
      .then(([r, c]) => {
        setRoutes(r?.data?.routes || []);
        setCampaigns(c?.data?.campaigns || []);
      })
      .catch(() => toastError("Failed to load pricing data"))
      .finally(() => setLoading(false));
  };

  const openFareEdit = (route) => {
    setEditRoute(route);
    setNewPrice(String(route.price || ""));
    setFareModal(true);
  };

  const saveFare = async (e) => {
    e.preventDefault();
    if (!editRoute) return;
    setFareLoading(true);
    try {
      await Api("put", `operator/pricing/routes/${editRoute._id}`, { price: Number(newPrice) }, router);
      toastSuccess("Route fare updated successfully");
      setFareModal(false);
      loadAll();
    } catch (err) {
      toastError(err?.message || "Failed to update fare");
    } finally {
      setFareLoading(false);
    }
  };

  const saveCampaign = async (e) => {
    e.preventDefault();
    setCampLoading(true);
    try {
      await Api("post", "operator/pricing/campaigns", campForm, router);
      toastSuccess("Campaign / Promo code created!");
      setCampaignModal(false);
      setCampForm({
        code: "",
        title: "",
        discountPercent: "15",
        maxDiscount: "10",
        routeId: "all",
        startDate: "",
        endDate: "",
        status: "active",
      });
      loadAll();
    } catch (err) {
      toastError(err?.message || "Failed to create campaign");
    } finally {
      setCampLoading(false);
    }
  };

  const toggleCampaignStatus = async (camp) => {
    const nextStatus = camp.status === "active" ? "inactive" : "active";
    try {
      await Api("put", `operator/pricing/campaigns/${camp._id}`, { status: nextStatus }, router);
      toastSuccess(`Campaign status changed to ${nextStatus}`);
      loadAll();
    } catch {
      toastError("Failed to update campaign");
    }
  };

  const deleteCampaign = async (id) => {
    const ok = await swalConfirm("Delete this campaign?", "This promo code will be removed.");
    if (!ok) return;
    try {
      await Api("delete", `operator/pricing/campaigns/${id}`, null, router);
      toastSuccess("Campaign deleted");
      loadAll();
    } catch {
      toastError("Failed to delete campaign");
    }
  };

  if (!user) return null;

  const filteredRoutes = routes.filter(r =>
    r.from?.toLowerCase().includes(search.toLowerCase()) ||
    r.to?.toLowerCase().includes(search.toLowerCase()) ||
    r.busType?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCampaigns = campaigns.filter(c =>
    c.code?.toLowerCase().includes(search.toLowerCase()) ||
    c.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e2e8f0] bg-white px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/operator")}
            className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3 py-2 text-xs font-medium text-[#64748b] hover:bg-[#f4f6f8]">
            <ArrowLeft size={14} /> Back
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fff8ec]">
            <DollarSign size={16} style={{ color: ORANGE }} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1e293b]">Pricing Management</p>
            <p className="text-xs text-[#64748b]">Fares, discounts & promotional campaigns</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
        <div className="mb-6 flex gap-1.5 rounded-xl border border-[#e2e8f0] bg-white p-1 w-fit">
          {[["fares", "Route Fares", Bus], ["campaigns", "Discounts & Campaigns", Tag]].map(([id, label, Icon]) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${activeTab === id ? "bg-[#f26522] text-white shadow-sm" : "text-[#64748b] hover:text-[#1e293b]"}`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {activeTab === "fares" && (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 sm:max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search routes..."
                  className="w-full rounded-xl border border-[#e2e8f0] bg-white py-2 pl-9 pr-4 text-xs outline-none focus:border-[#f26522]" />
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs text-[#94a3b8]">Loading route fares...</div>
            ) : filteredRoutes.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-[#94a3b8]">
                <Bus size={36} className="mb-2 opacity-30" />
                <p className="text-xs font-semibold">No routes found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRoutes.map(r => (
                  <div key={r._id} className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold text-[#64748b]">{r.busType}</span>
                        <h3 className="font-bold text-[#1e293b] text-base">{r.from} → {r.to}</h3>
                      </div>
                      <button onClick={() => openFareEdit(r)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] hover:bg-[#fff8ec]">
                        <Pencil size={14} style={{ color: ORANGE }} />
                      </button>
                    </div>

                    <div className="mt-4 flex items-baseline justify-between border-t border-[#f1f5f9] pt-3">
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-[#94a3b8]">Standard Seat Fare</p>
                        <p className="text-2xl font-black text-[#f26522]">€{r.price}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-[#64748b]">Total Seats: {r.seats}</p>
                        <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${r.status === "active" ? "bg-green-50 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                          {r.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "campaigns" && (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 sm:max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search promo codes..."
                  className="w-full rounded-xl border border-[#e2e8f0] bg-white py-2 pl-9 pr-4 text-xs outline-none focus:border-[#f26522]" />
              </div>
              <button onClick={() => setCampaignModal(true)}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: ORANGE }}>
                <Plus size={15} /> Add Promo Campaign
              </button>
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs text-[#94a3b8]">Loading campaigns...</div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-[#94a3b8]">
                <Tag size={36} className="mb-2 opacity-30 text-[#f26522]" />
                <p className="text-xs font-semibold">No promotional campaigns yet.</p>
                <p className="text-[11px] text-[#94a3b8] mt-1">Create discount codes for your bus routes.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCampaigns.map(c => (
                  <div key={c._id} className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <span className="inline-block rounded-lg bg-[#fff8ec] px-2.5 py-1 font-mono text-xs font-black text-[#f26522] border border-[#fde68a]">
                          {c.code}
                        </span>
                        <h3 className="mt-1.5 font-bold text-[#1e293b] text-sm">{c.title}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => toggleCampaignStatus(c)}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${c.status === "active" ? "bg-green-50 text-green-700 border-green-200" : "bg-zinc-100 text-zinc-500 border-zinc-200"}`}>
                          {c.status}
                        </button>
                        <button onClick={() => deleteCampaign(c._id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-100 hover:bg-red-50">
                          <Trash2 size={12} className="text-red-400" />
                        </button>
                      </div>
                    </div>

                    <div className="my-3 rounded-xl bg-[#f8fafc] p-3 text-xs">
                      <div className="flex justify-between text-[#64748b] mb-1">
                        <span>Discount:</span>
                        <span className="font-bold text-green-600">{c.discountPercent}% OFF</span>
                      </div>
                      <div className="flex justify-between text-[#64748b] mb-1">
                        <span>Max Savings:</span>
                        <span className="font-bold text-[#1e293b]">€{c.maxDiscount || "No limit"}</span>
                      </div>
                      <div className="flex justify-between text-[#64748b]">
                        <span>Applicable Route:</span>
                        <span className="font-semibold text-[#1e293b]">{c.routeId === "all" ? "All Routes" : c.routeId}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Modal open={fareModal} onClose={() => setFareModal(false)} title="Update Route Fare">
        {editRoute && (
          <form onSubmit={saveFare} className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-[#64748b]">Route</p>
              <p className="text-base font-bold text-[#1e293b]">{editRoute.from} → {editRoute.to}</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#374151]">New Base Price per Seat (€)</label>
              <input type="number" step="0.5" min="0" value={newPrice} onChange={e => setNewPrice(e.target.value)} required
                className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#f26522] focus:ring-2 focus:ring-[#f26522]/20" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setFareModal(false)}
                className="flex-1 rounded-xl border border-[#e2e8f0] py-2.5 text-xs font-bold text-[#64748b]">Cancel</button>
              <button type="submit" disabled={fareLoading}
                className="flex-1 rounded-xl py-2.5 text-xs font-bold text-white disabled:opacity-60"
                style={{ backgroundColor: ORANGE }}>
                {fareLoading ? "Updating..." : "Save Fare"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={campaignModal} onClose={() => setCampaignModal(false)} title="Add Promo Campaign">
        <form onSubmit={saveCampaign} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#374151]">Promo Code (e.g. SUMMER20)</label>
            <input value={campForm.code} onChange={e => setCampForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} required
              placeholder="SUMMER20"
              className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm uppercase font-mono font-bold outline-none focus:border-[#f26522]" />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#374151]">Campaign Title</label>
            <input value={campForm.title} onChange={e => setCampForm(p => ({ ...p, title: e.target.value }))} required
              placeholder="e.g. Summer Vacation Discount 20%"
              className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#f26522]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#374151]">Discount (%)</label>
              <input type="number" min="1" max="100" value={campForm.discountPercent} onChange={e => setCampForm(p => ({ ...p, discountPercent: e.target.value }))} required
                className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#f26522]" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#374151]">Max Discount (€)</label>
              <input type="number" min="0" value={campForm.maxDiscount} onChange={e => setCampForm(p => ({ ...p, maxDiscount: e.target.value }))}
                className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#f26522]" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#374151]">Apply to Route</label>
            <select value={campForm.routeId} onChange={e => setCampForm(p => ({ ...p, routeId: e.target.value }))}
              className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#f26522]">
              <option value="all">All Routes</option>
              {routes.map(r => (
                <option key={r._id} value={r.routeId}>{r.from} → {r.to} ({r.busType})</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setCampaignModal(false)}
              className="flex-1 rounded-xl border border-[#e2e8f0] py-2.5 text-xs font-bold text-[#64748b]">Cancel</button>
            <button type="submit" disabled={campLoading}
              className="flex-1 rounded-xl py-2.5 text-xs font-bold text-white disabled:opacity-60"
              style={{ backgroundColor: ORANGE }}>
              {campLoading ? "Creating..." : "Create Campaign"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
