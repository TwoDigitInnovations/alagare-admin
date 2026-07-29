import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { Api } from "@/services/service";
import { searchBusPlaces } from "@/utils/placeSearch";
import { toastSuccess, toastError, swalConfirm } from "@/utils/swal";
import {
  Bus, ArrowLeft, Plus, Pencil, Trash2, Search,
  MapPin, Clock, DollarSign, Layers, X, ChevronRight,
} from "lucide-react";

const GREEN = "#4a6d00";
const ORANGE = "#f26522";

const calcDuration = (dep, arr) => {
  if (!dep || !arr) return "";
  try {
    const d = new Date(dep), a = new Date(arr);
    if (isNaN(d) || isNaN(a)) return "";
    let diff = (a - d) / 60000;
    if (diff < 0) diff += 24 * 60;
    const h = Math.floor(diff / 60), m = diff % 60;
    return `${h}h ${String(m).padStart(2, "0")}m`;
  } catch { return ""; }
};

function CitySearch({ label, required, value, onChange, router }) {
  const [query, setQuery] = useState(value || "");
  const [masterCities, setMasterCities] = useState([]);
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    Api("get", "operator/fleet/cities", null, router)
      .then((res) => {
        const list = res?.data?.cities || res?.cities || [];
        setMasterCities(list);
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInputChange = (text) => {
    setQuery(text);
    onChange(text);
    if (!text.trim()) {
      setResults(masterCities);
      setOpen(true);
      return;
    }
    const filtered = masterCities.filter(c => 
      c.name.toLowerCase().includes(text.toLowerCase()) || 
      (c.country && c.country.toLowerCase().includes(text.toLowerCase()))
    );
    setResults(filtered);
    setOpen(true);
  };

  const select = (cityObj) => {
    const name = cityObj.name;
    setQuery(name);
    onChange(name);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <label className="mb-1.5 block text-xs font-semibold text-[#374151]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
        <input value={query}
          onChange={e => handleInputChange(e.target.value)}
          onFocus={() => {
            const currentFiltered = query.trim() 
              ? masterCities.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
              : masterCities;
            setResults(currentFiltered);
            setOpen(true);
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
                  {r.country && <p className="text-xs text-[#94a3b8]">{r.country}</p>}
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
  departureStation: "", arrivalStation: "",
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
    className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00] focus:ring-2 focus:ring-[#4a6d00]/20" />
);

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
        <div className="p-5 overflow-y-auto max-h-[70vh]">{children}</div>
      </div>
    </div>
  );
}

export default function OperatorFleet() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("routes");

  const [routes, setRoutes] = useState([]);
  const [busTypes, setBusTypes] = useState([]);
  const [loading, setLoading] = useState(true);
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
    if (!u || u.role !== "operator") { router.replace("/login"); return; }
    setUser(u);
    loadAll();
  }, []);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      Api("get", "operator/fleet/routes", null, router),
      Api("get", "operator/fleet/bus-types", null, router),
    ]).then(([r, b]) => {
      setRoutes(r?.data?.routes || []);
      setBusTypes(b?.data?.busTypes || []);
    }).catch(() => toastError("Failed to load data"))
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
    setRouteForm({
      from: r.from, to: r.to, departure: r.departure, arrival: r.arrival,
      duration: r.duration, price: String(r.price), seats: String(r.seats),
      busType: r.busType, status: r.status, isExpress: r.isExpress,
      departureStation: r.departureStation || "", arrivalStation: r.arrivalStation || "",
    });
    setRouteModal(true);
  };

  const saveRoute = async (e) => {
    e.preventDefault();
    setRouteLoading(true);
    try {
      if (editRoute) {
        await Api("put", `operator/fleet/routes/${editRoute._id}`, routeForm, router);
        toastSuccess("Route updated");
      } else {
        await Api("post", "operator/fleet/routes", routeForm, router);
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
      toastSuccess("Bus type added");
      setBtModal(false);
      setBtForm(BUS_TYPE_EMPTY);
      loadAll();
    } catch (err) {
      toastError(err?.message || "Failed to add bus type");
    } finally {
      setBtLoading(false);
    }
  };

  const deleteBusType = async (id) => {
    const ok = await swalConfirm("Delete this bus type?");
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
                  className="w-full rounded-xl border border-[#e2e8f0] bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#4a6d00]" />
              </div>
              <button onClick={openAddRoute}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: GREEN }}>
                <Plus size={15} /> Add Route
              </button>
            </div>

            {loading ? (
              <div className="py-16 text-center text-sm text-[#94a3b8]">Loading routes...</div>
            ) : filteredRoutes.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-[#94a3b8]">
                <MapPin size={36} className="mb-3 opacity-30" />
                <p className="text-sm">No routes yet. Add your first route.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRoutes.map(r => (
                  <div key={r._id} className="rounded-2xl border border-[#e2e8f0] bg-white p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-1 items-center gap-4 min-w-0">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#eaf5dd]">
                          <Bus size={18} style={{ color: GREEN }} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#1e293b]">{r.from}</span>
                            <ChevronRight size={14} className="text-[#94a3b8]" />
                            <span className="font-bold text-[#1e293b]">{r.to}</span>
                            {r.isExpress && (
                              <span className="rounded-full bg-[#eaf5dd] px-2 py-0.5 text-[10px] font-bold text-[#4a6d00]">EXPRESS</span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-3 text-xs text-[#64748b]">
                            <span className="flex items-center gap-1"><Clock size={11} /> {r.departure} → {r.arrival}</span>
                            <span className="flex items-center gap-1"><DollarSign size={11} /> €{r.price}</span>
                            <span className="flex items-center gap-1"><Layers size={11} /> {r.busType}</span>
                            <span>{r.seatsAvailable}/{r.seats} seats</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${r.status === "active" ? "bg-green-50 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                          {r.status}
                        </span>
                        <button onClick={() => openEditRoute(r)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] hover:bg-[#f8fafc]">
                          <Pencil size={13} className="text-[#64748b]" />
                        </button>
                        <button onClick={() => deleteRoute(r._id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 hover:bg-red-50">
                          <Trash2 size={13} className="text-red-400" />
                        </button>
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
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: GREEN }}>
                <Plus size={15} /> Add Bus Type
              </button>
            </div>

            {loading ? (
              <div className="py-16 text-center text-sm text-[#94a3b8]">Loading...</div>
            ) : busTypes.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-[#94a3b8]">
                <Layers size={36} className="mb-3 opacity-30" />
                <p className="text-sm">No bus types yet. Add one to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {busTypes.map(bt => (
                  <div key={bt._id} className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
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

      <Modal open={routeModal} onClose={() => setRouteModal(false)} title={editRoute ? "Edit Route" : "Add New Route"}>
        <form onSubmit={saveRoute} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <CitySearch label="From" required value={routeForm.from} onChange={v => setRouteForm(p => ({ ...p, from: v }))} router={router} />
            <CitySearch label="To" required value={routeForm.to} onChange={v => setRouteForm(p => ({ ...p, to: v }))} router={router} />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div className="flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5">
              <Clock size={14} className="text-[#94a3b8]" />
              <span className="text-sm text-[#374151] font-medium">{routeForm.duration || "Set departure & arrival to calculate"}</span>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (€)" required><Input type="number" min="0" placeholder="25" value={routeForm.price} onChange={e => setRouteForm(p => ({ ...p, price: e.target.value }))} required /></Field>
            <Field label="Total Seats" required><Input type="number" min="1" placeholder="40" value={routeForm.seats} onChange={e => setRouteForm(p => ({ ...p, seats: e.target.value }))} required /></Field>
          </div>

          <Field label="Bus Type" required>
            <select value={routeForm.busType} onChange={e => setRouteForm(p => ({ ...p, busType: e.target.value }))} required
              className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]">
              <option value="">Select bus type</option>
              {busTypes.map(bt => <option key={bt._id} value={bt.name}>{bt.name}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Departure Station"><Input placeholder="Berlin Coach Station" value={routeForm.departureStation} onChange={e => setRouteForm(p => ({ ...p, departureStation: e.target.value }))} /></Field>
            <Field label="Arrival Station"><Input placeholder="Munich Terminal" value={routeForm.arrivalStation} onChange={e => setRouteForm(p => ({ ...p, arrivalStation: e.target.value }))} /></Field>
          </div>

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

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setRouteModal(false)}
              className="flex-1 rounded-xl border border-[#e2e8f0] py-2.5 text-sm font-medium text-[#64748b]">Cancel</button>
            <button type="submit" disabled={routeLoading}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: GREEN }}>
              {routeLoading ? "Saving..." : editRoute ? "Update Route" : "Create Route"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={btModal} onClose={() => setBtModal(false)} title="Add Bus Type">
        <form onSubmit={saveBusType} className="space-y-4">
          <Field label="Bus Type Name" required><Input placeholder="e.g. Volvo AC Sleeper" value={btForm.name} onChange={e => setBtForm(p => ({ ...p, name: e.target.value }))} required /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Rows"><Input type="number" min="1" value={btForm.rowCount} onChange={e => setBtForm(p => ({ ...p, rowCount: e.target.value }))} /></Field>
            <Field label="Seats/Side"><Input type="number" min="1" value={btForm.seatsPerSide} onChange={e => setBtForm(p => ({ ...p, seatsPerSide: e.target.value }))} /></Field>
            <Field label="Total Seats"><Input type="number" min="1" value={btForm.totalSeats} onChange={e => setBtForm(p => ({ ...p, totalSeats: e.target.value }))} /></Field>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setBtModal(false)}
              className="flex-1 rounded-xl border border-[#e2e8f0] py-2.5 text-sm font-medium text-[#64748b]">Cancel</button>
            <button type="submit" disabled={btLoading}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: GREEN }}>
              {btLoading ? "Adding..." : "Add Bus Type"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
