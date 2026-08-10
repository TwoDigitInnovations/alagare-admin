import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { Api } from "@/services/service";
import { searchBusPlaces } from "@/utils/placeSearch";
import { toastSuccess, toastError, swalConfirm } from "@/utils/swal";
import {
  Bus, ArrowLeft, Plus, Pencil, Trash2, Search,
  MapPin, Clock, DollarSign, Layers, X, ChevronRight,
  Wifi, Zap, Snowflake, Armchair, Coffee, Tv, BatteryCharging, Bed, Bath, Cookie, ShieldCheck, CheckCircle2,
  Sun, Navigation, Video, DoorOpen, HeartPulse, Flame, Sparkles, Briefcase,
} from "lucide-react";

const GREEN = "#4a6d00";
const ORANGE = "#f26522";

const MASTER_FACILITIES = [
  { id: "wifi", label: "Free Wi-Fi", Icon: Wifi },
  { id: "power", label: "Power Outlets", Icon: Zap },
  { id: "ac", label: "Air Conditioning", Icon: Snowflake },
  { id: "reclining", label: "Reclining Seats", Icon: Armchair },
  { id: "water", label: "Drinking Water", Icon: Coffee },
  { id: "tv", label: "TV & Entertainment", Icon: Tv },
  { id: "charging", label: "USB Charging", Icon: BatteryCharging },
  { id: "blanket", label: "Blanket & Pillow", Icon: Bed },
  { id: "toilet", label: "Washroom", Icon: Bath },
  { id: "snacks", label: "Snacks / Meal", Icon: Cookie },
  { id: "reading_light", label: "Reading Light", Icon: Sun },
  { id: "gps", label: "GPS Tracking", Icon: Navigation },
  { id: "cctv", label: "CCTV Security", Icon: Video },
  { id: "emergency_exit", label: "Emergency Exit", Icon: DoorOpen },
  { id: "first_aid", label: "First Aid Kit", Icon: HeartPulse },
  { id: "fire_extinguisher", label: "Fire Extinguisher", Icon: Flame },
  { id: "sanitized", label: "Deep Sanitized", Icon: Sparkles },
  { id: "luggage_storage", label: "Luggage Storage", Icon: Briefcase },
];

const calcDuration = (dep, arr) => {
  if (!dep || !arr) return "";
  try {
    const d = new Date(dep), a = new Date(arr);
    if (isNaN(d) || isNaN(a)) return "";
    let diff = (a - d) / 60000;
    if (diff < 0) diff += 1440;
    const h = Math.floor(diff / 60);
    const m = Math.round(diff % 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  } catch { return ""; }
};

function CitySearch({ label, required, value, onChange, router }) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => { setQuery(value || ""); }, [value]);

  const searchCities = useCallback(async (q) => {
    if (!q || q.length < 2) { setResults([]); setSearching(false); return; }
    setSearching(true);
    try {
      const res = await Api("get", `operator/cities?search=${encodeURIComponent(q)}`, null, router);
      setResults(res?.data?.cities || []);
    } catch {
      const local = await searchBusPlaces(q);
      setResults(local);
    } finally {
      setSearching(false);
    }
  }, [router]);

  const handleText = (e) => {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
    setOpen(true);
    searchCities(v);
  };

  const select = (r) => {
    setQuery(r.name);
    onChange(r.name);
    setOpen(false);
  };

  return (
    <div className="relative">
      <label className="mb-1.5 block text-xs font-semibold text-[#374151]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
        <input value={query} onChange={handleText} onFocus={() => { setOpen(true); if (query.length >= 2) searchCities(query); }}
          onBlur={() => {
            setTimeout(() => {
              setOpen(false);
              const match = results.find(r => r.name?.toLowerCase() === query.trim().toLowerCase());
              if (!match && results.length > 0 && query.trim()) {
                setQuery(results[0].name);
                onChange(results[0].name);
              }
            }, 250);
          }}
          placeholder={`Select ${label.toLowerCase()} city...`}
          className="w-full rounded-xl border border-[#e2e8f0] bg-white py-2.5 pl-8 pr-4 text-sm outline-none focus:border-[#4a6d00] focus:ring-2 focus:ring-[#4a6d00]/20" />
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-[#e2e8f0] bg-white shadow-lg">
          {results.length > 0 ? (
            results.map(r => (
              <button key={r.id || r._id || r.name} type="button" onMouseDown={() => select(r)}
                className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-[#f4f9f0] transition-colors">
                <MapPin size={13} className="mt-0.5 flex-shrink-0 text-[#4a6d00]" />
                <div>
                  <p className="text-sm font-medium text-[#1e293b]">{r.name}</p>
                  {r.label ? (
                    <p className="text-xs text-[#94a3b8]">
                      {r.label.split(', ').slice(1).join(', ') || r.country}
                    </p>
                  ) : r.country ? (
                    <p className="text-xs text-[#94a3b8]">{r.country}</p>
                  ) : null}
                </div>
              </button>
            ))
          ) : (
            <div className="px-3 py-3 text-xs text-[#94a3b8] text-center">
              No matching city in Admin Master Cities.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function readUser() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem("userDetail") || "null"); } catch { return null; }
}

const ROUTE_EMPTY = {
  from: "", to: "", departure: "", arrival: "", duration: "",
  price: "", seats: "", busType: "", status: "active", isExpress: true,
  departureStation: "", arrivalStation: "", ladiesSeats: "0-1, 2-0, 5-2, 5-3, 7-1",
  facilitiesList: ["wifi", "power", "ac", "reclining"],
  facilities: "wifi, power, ac, reclining",
  cancellationPolicy: "Full refund up to 24h before departure",
  cancellationPolicyDetail: "Full refund if cancelled 24 hours prior to departure. 50% refund between 12-24h. Non-refundable within 12 hours.",
  luggagePolicy: "1 Carry-on + 1 Checked bag Included",
  luggagePolicyDetail: "Includes 1 hand luggage (max 7kg) and 1 check-in bag (max 20kg). Excess baggage fee applies at gate.",
  benefitNote: "Standard Premier includes meal and lounge access.",
};

const BUS_TYPE_EMPTY = { name: "", rowCount: "10", seatsPerSide: "2", totalSeats: "40" };

const Field = ({ label, required, error, children }) => (
  <div>
    <label className="mb-1.5 block text-xs font-semibold text-[#374151]">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

const Input = ({ ...props }) => (
  <input {...props}
    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all ${props.disabled ? 'bg-[#f1f5f9] border-[#cbd5e1] text-[#94a3b8] cursor-not-allowed' : 'bg-white border-[#e2e8f0] focus:border-[#4a6d00] focus:ring-2 focus:ring-[#4a6d00]/20'}`} />
);

function SeatMapSelector({ rowCount, seatsPerSide, value = "", onChange }) {
  const selectedSeats = value.split(',').map(s => s.trim()).filter(Boolean);

  const toggleSeat = (id) => {
    let next;
    if (selectedSeats.includes(id)) {
      next = selectedSeats.filter(s => s !== id);
    } else {
      next = [...selectedSeats, id];
    }
    onChange(next.join(", "));
  };

  const rows = parseInt(rowCount, 10) || 10;
  const cols = parseInt(seatsPerSide, 10) || 2;

  const layout = [];
  for (let r = 0; r < rows; r++) {
    const isLastRow = r === rows - 1;
    const rowSeats = [];
    for (let c = 0; c < cols; c++) {
      rowSeats.push({ id: `${r}-${c}`, label: `${r + 1}${String.fromCharCode(65 + c)}` });
    }
    if (isLastRow) {
      rowSeats.push({ id: `${r}-middle`, label: `${r + 1}M` });
    } else {
      rowSeats.push(null); // Aisle
    }
    for (let c = 0; c < cols; c++) {
      rowSeats.push({ id: `${r}-${cols + c}`, label: `${r + 1}${String.fromCharCode(65 + cols + c)}` });
    }
    layout.push(rowSeats);
  }

  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 flex flex-col items-center overflow-x-auto w-full">
      <div className="mb-4 flex gap-4 text-xs font-semibold text-[#64748b]">
        <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-[#f1f5f9] border border-[#cbd5e1]"></div> Regular Seat</div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-[#fce7f3] border border-[#f472b6]"></div> Ladies Reserved</div>
      </div>
      <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-sm inline-block min-w-max">
        <div className="w-full flex justify-end mb-6 border-b-2 border-dashed border-[#e2e8f0] pb-2 text-xs font-bold text-[#94a3b8]">STEERING</div>
        <div className="flex flex-col gap-2">
          {layout.map((row, i) => (
            <div key={i} className="flex gap-2 justify-center">
              {row.map((seat, j) => {
                if (!seat) return <div key={j} className="w-8 h-8 md:w-10 md:h-10 shrink-0"></div>;
                const isSelected = selectedSeats.includes(seat.id);
                return (
                  <button
                    key={seat.id}
                    type="button"
                    onClick={() => toggleSeat(seat.id)}
                    className={`w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-md border flex items-center justify-center text-[10px] md:text-xs font-bold transition-all hover:opacity-80 ${
                      isSelected 
                        ? 'bg-[#fce7f3] border-[#f472b6] text-[#db2777] shadow-sm' 
                        : 'bg-[#f1f5f9] border-[#cbd5e1] text-[#64748b] hover:border-[#94a3b8]'
                    }`}
                  >
                    {seat.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Modal({ open, onClose, title, size = "max-w-2xl", children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`w-full ${size} bg-white rounded-2xl shadow-2xl overflow-hidden`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0]">
          <h3 className="font-bold text-[#1e293b]">{title}</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-[#94a3b8] hover:bg-[#f1f5f9]">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[85vh]">{children}</div>
      </div>
    </div>
  );
}

export default function OperatorFleet() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("routes");
  const [loading, setLoading] = useState(true);

  const [routes, setRoutes] = useState([]);
  const [busTypes, setBusTypes] = useState([]);
  const [search, setSearch] = useState("");

  const [routeModal, setRouteModal] = useState(false);
  const [editRoute, setEditRoute] = useState(null);
  const [routeForm, setRouteForm] = useState(ROUTE_EMPTY);
  const [routeLoading, setRouteLoading] = useState(false);

  const [btModal, setBtModal] = useState(false);
  const [btForm, setBtForm] = useState(BUS_TYPE_EMPTY);
  const [btLoading, setBtLoading] = useState(false);

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
      Api("get", "operator/fleet/routes", null, router),
      Api("get", "operator/fleet/bus-types", null, router),
    ])
      .then(([r, b]) => {
        setRoutes(r?.data?.routes || []);
        setBusTypes(b?.data?.busTypes || []);
      })
      .catch(() => toastError("Failed to load fleet data"))
      .finally(() => setLoading(false));
  };

  const filteredRoutes = routes.filter(r =>
    r.from?.toLowerCase().includes(search.toLowerCase()) ||
    r.to?.toLowerCase().includes(search.toLowerCase()) ||
    r.busType?.toLowerCase().includes(search.toLowerCase())
  );

  const openAddRoute = () => { setEditRoute(null); setRouteForm(ROUTE_EMPTY); setRouteModal(true); };
  const openEditRoute = (r) => {
    setEditRoute(r);
    let facList = ["wifi", "power", "ac", "reclining"];
    if (Array.isArray(r.facilities)) {
      facList = r.facilities;
    } else if (typeof r.facilities === 'string' && r.facilities.trim()) {
      facList = r.facilities.split(',').map((s) => s.trim()).filter(Boolean);
    }
    const bt = busTypes.find(b => b.name === r.busType);
    const correctSeats = bt ? String(bt.totalSeats) : String(r.seats);
    setRouteForm({
      from: r.from, to: r.to, departure: r.departure, arrival: r.arrival,
      duration: r.duration, price: String(r.price), seats: correctSeats,
      busType: r.busType, status: r.status, isExpress: r.isExpress,
      departureStation: r.departureStation || "", arrivalStation: r.arrivalStation || "",
      ladiesSeats: Array.isArray(r.ladiesSeats) ? r.ladiesSeats.join(', ') : (r.ladiesSeats || ""),
      facilitiesList: facList,
      facilities: facList.join(', '),
      cancellationPolicy: r.cancellationPolicy || "Full refund up to 24h before departure",
      cancellationPolicyDetail: r.cancellationPolicyDetail || "Full refund if cancelled 24 hours prior to departure. 50% refund between 12-24h. Non-refundable within 12 hours.",
      luggagePolicy: r.luggagePolicy || "1 Carry-on + 1 Checked bag Included",
      luggagePolicyDetail: r.luggagePolicyDetail || "Includes 1 hand luggage (max 7kg) and 1 check-in bag (max 20kg). Excess baggage fee applies at gate.",
      benefitNote: r.benefitNote || "Standard Premier includes meal and lounge access.",
    });
    setRouteModal(true);
  };

  const saveRoute = async (e) => {
    e.preventDefault();
    setRouteLoading(true);
    try {
      const payload = {
        ...routeForm,
        facilities: (routeForm.facilitiesList || []).join(', '),
      };
      if (editRoute) {
        await Api("put", `operator/fleet/routes/${editRoute._id}`, payload, router);
        toastSuccess("Route updated");
      } else {
        await Api("post", "operator/fleet/routes", payload, router);
        toastSuccess("Route created");
      }
      setRouteModal(false);
      loadAll();
    } catch (err) {
      toastError(err?.message || "Failed to save route");
    } finally {
      setRouteLoading(false);
    }
  };

  const deleteRoute = async (id) => {
    const ok = await swalConfirm("Delete this route?", "This cannot be undone.");
    if (!ok) return;
    try {
      await Api("delete", `operator/fleet/routes/${id}`, null, router);
      toastSuccess("Route deleted");
      loadAll();
    } catch { toastError("Failed to delete"); }
  };

  const saveBusType = async (e) => {
    e.preventDefault();
    setBtLoading(true);
    try {
      await Api("post", "operator/fleet/bus-types", btForm, router);
      toastSuccess("Bus type created");
      setBtModal(false);
      setBtForm(BUS_TYPE_EMPTY);
      loadAll();
    } catch (err) {
      toastError(err?.message || "Failed to create bus type");
    } finally {
      setBtLoading(false);
    }
  };

  const deleteBusType = async (id) => {
    const ok = await swalConfirm("Delete bus type?", "Routes using this bus type may be affected.");
    if (!ok) return;
    try {
      await Api("delete", `operator/fleet/bus-types/${id}`, null, router);
      toastSuccess("Bus type deleted");
      loadAll();
    } catch { toastError("Failed to delete"); }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e2e8f0] bg-white px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/operator")}
            className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3 py-2 text-xs font-medium text-[#64748b] hover:bg-[#f4f6f8]">
            <ArrowLeft size={14} /> Back
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eaf5dd]">
            <Bus size={16} style={{ color: GREEN }} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1e293b]">Fleet & Schedule</p>
            <p className="text-xs text-[#64748b]">Buses, routes & stations</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
        <div className="mb-6 flex gap-1 rounded-xl border border-[#e2e8f0] bg-white p-1 w-fit">
          {[["routes", "Routes", MapPin], ["bus-types", "Bus Types", Layers]].map(([id, label, Icon]) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${activeTab === id ? "bg-[#4a6d00] text-white shadow-sm" : "text-[#64748b] hover:text-[#1e293b]"}`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {activeTab === "routes" && (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 sm:max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search routes..."
                  className="w-full rounded-xl border border-[#e2e8f0] bg-white py-2 pl-9 pr-4 text-xs outline-none focus:border-[#4a6d00]" />
              </div>
              <button onClick={openAddRoute}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: GREEN }}>
                <Plus size={15} /> Add Route
              </button>
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs text-[#94a3b8]">Loading routes...</div>
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
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditRoute(r)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e2e8f0] hover:bg-[#f4f9f0]">
                          <Pencil size={12} style={{ color: GREEN }} />
                        </button>
                        <button onClick={() => deleteRoute(r._id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-100 hover:bg-red-50">
                          <Trash2 size={12} className="text-red-400" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-[#64748b]">
                      <div className="flex justify-between">
                        <span>Departure:</span>
                        <span className="font-semibold text-[#1e293b]">{r.departure}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Arrival:</span>
                        <span className="font-semibold text-[#1e293b]">{r.arrival}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span className="font-semibold text-[#1e293b]">{r.duration}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-baseline justify-between border-t border-[#f1f5f9] pt-3">
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-[#94a3b8]">Seat Fare</p>
                        <p className="text-xl font-black text-[#4a6d00]">€{r.price}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-[#64748b]">Available: {r.seatsAvailable}/{r.seats}</p>
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

        {activeTab === "bus-types" && (
          <>
            <div className="mb-4 flex justify-end">
              <button onClick={() => { setBtForm(BUS_TYPE_EMPTY); setBtModal(true); }}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: GREEN }}>
                <Plus size={15} /> Add Bus Type
              </button>
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs text-[#94a3b8]">Loading bus types...</div>
            ) : busTypes.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-[#94a3b8]">
                <Layers size={36} className="mb-2 opacity-30" />
                <p className="text-xs font-semibold">No custom bus types created yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {busTypes.map(bt => (
                  <div key={bt._id} className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf5dd]">
                          <Layers size={18} style={{ color: GREEN }} />
                        </div>
                        <p className="font-bold text-[#1e293b]">{bt.name}</p>
                      </div>
                      <button onClick={() => deleteBusType(bt._id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-100 hover:bg-red-50">
                        <Trash2 size={12} className="text-red-400" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[["Rows", bt.rowCount], ["Per Side", bt.seatsPerSide], ["Total", bt.totalSeats]].map(([l, v]) => (
                        <div key={l} className="rounded-lg bg-[#f8fafc] py-2">
                          <p className="text-lg font-black text-[#4a6d00]">{v}</p>
                          <p className="text-[10px] text-[#94a3b8]">{l}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Modal open={routeModal} onClose={() => setRouteModal(false)} title={editRoute ? "Edit Route & Facilities" : "Add New Route & Facilities"} size="max-w-3xl">
        <form onSubmit={saveRoute} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CitySearch label="From City" required value={routeForm.from} onChange={v => setRouteForm(p => ({ ...p, from: v }))} router={router} />
            <CitySearch label="To City" required value={routeForm.to} onChange={v => setRouteForm(p => ({ ...p, to: v }))} router={router} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Departure Date & Time" required>
              <input type="datetime-local" value={routeForm.departure}
                onChange={e => {
                  const dep = e.target.value;
                  const dur = calcDuration(dep, routeForm.arrival);
                  setRouteForm(p => ({ ...p, departure: dep, duration: dur }));
                }}
                required className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00] focus:ring-2 focus:ring-[#4a6d00]/20" />
            </Field>
            <Field label="Arrival Date & Time" required>
              <input type="datetime-local" value={routeForm.arrival}
                onChange={e => {
                  const arr = e.target.value;
                  const dur = calcDuration(routeForm.departure, arr);
                  setRouteForm(p => ({ ...p, arrival: arr, duration: dur }));
                }}
                required className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00] focus:ring-2 focus:ring-[#4a6d00]/20" />
            </Field>
          </div>

          <Field label="Duration (auto-calculated)">
            <div className="flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3.5 py-2.5">
              <Clock size={15} className="text-[#94a3b8]" />
              <span className="text-sm text-[#374151] font-medium">{routeForm.duration || "Set departure & arrival to calculate"}</span>
            </div>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Base Fare (€)" required><Input type="number" min="0" step="0.5" placeholder="25" value={routeForm.price} onChange={e => setRouteForm(p => ({ ...p, price: e.target.value }))} required /></Field>
            <Field label="Total Seats" required>
              <Input type="number" min="1" placeholder="40" value={routeForm.seats} readOnly disabled />
            </Field>
            <Field label="Bus Type" required>
              <select value={routeForm.busType} onChange={e => {
                  const type = e.target.value;
                  const bt = busTypes.find(b => b.name === type);
                  setRouteForm(p => ({ ...p, busType: type, seats: bt ? bt.totalSeats : p.seats, ladiesSeats: "" }));
                }} required
                className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]">
                <option value="">Select bus type</option>
                {busTypes.map(bt => <option key={bt._id} value={bt.name}>{bt.name}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Departure Station Name"><Input placeholder="e.g. Berlin Coach Terminal" value={routeForm.departureStation} onChange={e => setRouteForm(p => ({ ...p, departureStation: e.target.value }))} /></Field>
            <Field label="Arrival Station Name"><Input placeholder="e.g. Munich Central Terminal" value={routeForm.arrivalStation} onChange={e => setRouteForm(p => ({ ...p, arrivalStation: e.target.value }))} /></Field>
          </div>

          <Field label="Ladies Reserved Seats (Click to select/unselect)">
            {routeForm.busType ? (() => {
              const bt = busTypes.find(b => b.name === routeForm.busType) || { rowCount: 10, seatsPerSide: 2 };
              return (
                <SeatMapSelector 
                  rowCount={bt.rowCount} 
                  seatsPerSide={bt.seatsPerSide} 
                  value={routeForm.ladiesSeats || ""} 
                  onChange={v => setRouteForm(p => ({ ...p, ladiesSeats: v }))} 
                />
              );
            })() : (
              <div className="rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-6 text-center text-sm text-[#94a3b8]">
                Please select a Bus Type first to view the seat map.
              </div>
            )}
          </Field>

          {/* Interactive Bus Facilities Selector Grid */}
          <div className="space-y-2 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1e293b] uppercase tracking-wider">
                Bus Amenities & Facilities (Click icon cards to toggle)
              </label>
              <span className="text-[11px] font-semibold text-[#4a6d00]">
                {(routeForm.facilitiesList || []).length} Selected
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
              {MASTER_FACILITIES.map(({ id, label, Icon }) => {
                const selected = (routeForm.facilitiesList || []).includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      const list = routeForm.facilitiesList || [];
                      const next = selected ? list.filter(item => item !== id) : [...list, id];
                      setRouteForm(p => ({ ...p, facilitiesList: next, facilities: next.join(', ') }));
                    }}
                    className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-xs font-bold transition-all text-left ${
                      selected
                        ? "border-[#4a6d00] bg-[#eaf5dd] text-[#4a6d00] shadow-xs ring-2 ring-[#4a6d00]/20"
                        : "border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f1f5f9]"
                    }`}
                  >
                    <Icon size={16} className={selected ? "text-[#4a6d00]" : "text-[#94a3b8]"} />
                    <span className="truncate flex-1">{label}</span>
                    {selected && <CheckCircle2 size={14} className="text-[#4a6d00] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Policy & Benefit Card Group */}
          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1e293b]">
              <ShieldCheck size={16} className="text-[#4a6d00]" />
              <span>Bus Policies & Expandable Passenger Terms</span>
            </div>

            <div className="space-y-3">
              <Field label="Cancellation Policy (Header Title)">
                <Input
                  placeholder="Full refund up to 24h before departure"
                  value={routeForm.cancellationPolicy || ""}
                  onChange={e => setRouteForm(p => ({ ...p, cancellationPolicy: e.target.value }))}
                />
              </Field>

              <Field label="Cancellation Policy Details (Appears when passenger clicks expandable > arrow)">
                <textarea
                  rows={2}
                  placeholder="Full refund if cancelled 24 hours prior to departure. 50% refund between 12-24h. Non-refundable within 12 hours."
                  value={routeForm.cancellationPolicyDetail || ""}
                  onChange={e => setRouteForm(p => ({ ...p, cancellationPolicyDetail: e.target.value }))}
                  className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-xs outline-none focus:border-[#4a6d00]"
                />
              </Field>
            </div>

            <div className="space-y-3 pt-3 border-t border-[#f1f5f9]">
              <Field label="Luggage Policy (Header Title)">
                <Input
                  placeholder="1 Carry-on + 1 Checked bag Included"
                  value={routeForm.luggagePolicy || ""}
                  onChange={e => setRouteForm(p => ({ ...p, luggagePolicy: e.target.value }))}
                />
              </Field>

              <Field label="Luggage Policy Details (Appears when passenger clicks expandable > arrow)">
                <textarea
                  rows={2}
                  placeholder="Includes 1 hand luggage (max 7kg) and 1 check-in bag (max 20kg). Excess baggage fee applies at gate."
                  value={routeForm.luggagePolicyDetail || ""}
                  onChange={e => setRouteForm(p => ({ ...p, luggagePolicyDetail: e.target.value }))}
                  className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-xs outline-none focus:border-[#4a6d00]"
                />
              </Field>
            </div>

            <Field label="Special Trip Benefit Note">
              <Input
                placeholder="Standard Premier includes meal and lounge access."
                value={routeForm.benefitNote || ""}
                onChange={e => setRouteForm(p => ({ ...p, benefitNote: e.target.value }))}
              />
            </Field>
          </div>

          <div className="flex items-center justify-between border-t border-[#e2e8f0] pt-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-[#374151] cursor-pointer">
                <input type="checkbox" checked={routeForm.isExpress} onChange={e => setRouteForm(p => ({ ...p, isExpress: e.target.checked }))} className="accent-[#4a6d00]" />
                Express Route
              </label>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-[#374151]">Status</label>
                <select value={routeForm.status} onChange={e => setRouteForm(p => ({ ...p, status: e.target.value }))}
                  className="rounded-xl border border-[#e2e8f0] px-3 py-1.5 text-sm outline-none focus:border-[#4a6d00]">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setRouteModal(false)}
              className="flex-1 rounded-xl border border-[#e2e8f0] py-3 text-sm font-semibold text-[#64748b] hover:bg-[#f8fafc]">Cancel</button>
            <button type="submit" disabled={routeLoading}
              className="flex-1 rounded-xl py-3 text-sm font-bold text-white shadow-sm disabled:opacity-60"
              style={{ backgroundColor: GREEN }}>
              {routeLoading ? "Saving Route..." : editRoute ? "Update Route & Amenities" : "Create Route & Amenities"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={btModal} onClose={() => setBtModal(false)} title="Add Bus Type">
        <form onSubmit={saveBusType} className="space-y-4">
          <Field label="Bus Type Name" required><Input placeholder="e.g. Volvo AC Sleeper" value={btForm.name} onChange={e => setBtForm(p => ({ ...p, name: e.target.value }))} required /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Rows"><Input type="number" min="1" value={btForm.rowCount} onChange={e => setBtForm(p => ({ ...p, rowCount: e.target.value }))} /></Field>
            <Field label="Seats/Side (Max 3)"><Input type="number" min="1" max="3" value={btForm.seatsPerSide} onChange={e => {
              let val = e.target.value;
              if (parseInt(val) > 3) val = "3";
              setBtForm(p => ({ ...p, seatsPerSide: val }));
            }} required /></Field>
            <Field label="Total Seats"><Input type="number" min="1" value={btForm.totalSeats} onChange={e => setBtForm(p => ({ ...p, totalSeats: e.target.value }))} /></Field>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setBtModal(false)}
              className="flex-1 rounded-xl border border-[#e2e8f0] py-2.5 text-sm font-medium text-[#64748b]">Cancel</button>
            <button type="submit" disabled={btLoading}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: GREEN }}>
              {btLoading ? "Creating..." : "Save Bus Type"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
