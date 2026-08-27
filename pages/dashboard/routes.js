import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import { Api } from "@/services/service";
import { toastSuccess, toastError, swalConfirm } from "@/utils/swal";
import { Search, Bus, RefreshCw, Eye, ShieldCheck, AlertTriangle, MapPin } from "lucide-react";
import LiveMap from "@/components/LiveMap";

const formatScheduleLabel = (val) => {
  if (!val) return "—";
  if (/^\d{2}:\d{2}$/.test(val)) return val;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return val;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export default function RoutesPage() {
  const router = useRouter();
  const [routes, setRoutes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [mapModal, setMapModal] = useState(false);

  const loadRoutes = () => {
    setLoading(true);
    Api("get", "admin/routes", null, router)
      .then((res) => setRoutes(res?.data?.routes || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const filtered = routes.filter(
    (r) =>
      r.from?.toLowerCase().includes(search.toLowerCase()) ||
      r.to?.toLowerCase().includes(search.toLowerCase()) ||
      r.operator?.toLowerCase().includes(search.toLowerCase()) ||
      r.busType?.toLowerCase().includes(search.toLowerCase())
  );

  const updateRouteStatus = async (r, newStatus) => {
    const actionLabel = newStatus === "active" ? "Verify & Activate" : "Suspend";
    const ok = await swalConfirm(`${actionLabel} Route?`, `Confirm status change to '${newStatus}' for ${r.from} → ${r.to}?`);
    if (!ok) return;

    try {
      await Api("put", `admin/routes/${r.id || r.routeId}`, { ...r, status: newStatus }, router);
      toastSuccess(`Route marked as ${newStatus}`);
      if (selectedRoute && (selectedRoute.id === r.id || selectedRoute.routeId === r.routeId)) {
        setSelectedRoute({ ...r, status: newStatus });
      }
      loadRoutes();
    } catch (err) {
      toastError(err?.message || `Failed to update status`);
    }
  };

  const startSimulation = async (r) => {
    const routeCode = r.routeId || r.id;
    const ok = await swalConfirm(`Start Live Tracking?`, `This will start a simulated bus for ${r.from} → ${r.to}`);
    if (!ok) return;

    try {
      await Api("post", "admin/buses/tracking/simulate", { routeId: routeCode, durationSeconds: 300 }, router);
      toastSuccess(`Simulation started successfully! Map will update live.`);
    } catch (err) {
      toastError(err?.message || `Failed to start simulation`);
    }
  };

  const openDetails = (r) => {
    setSelectedRoute(r);
    setDetailsModal(true);
  };

  const stopSimulation = (route) => {
    const routeCode = route.routeId || route.id;
    swalConfirm("Stop Simulation?", "Are you sure you want to stop the simulation for this route?").then((result) => {
      if (result.isConfirmed) {
        Api("post", "admin/buses/tracking/stop-simulate", { routeId: routeCode }, router)
          .then(() => {
            toastSuccess("Simulation stopped successfully!");
          })
          .catch((err) => {
            toastError("Failed to stop simulation.");
            console.error(err);
          });
      }
    });
  };

  return (
    <AdminLayout title="System Bus Routes">
      <div className="space-y-6" style={{ fontFamily: "var(--font-poppins, Poppins, sans-serif)" }}>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-black text-[#1e293b]">System Bus Routes</h1>
            <p className="text-xs text-[#64748b]">Inspect route details, verify compliance, and suspend or activate operator routes</p>
          </div>

          <button
            onClick={loadRoutes}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#1e293b] hover:bg-[#f8fafc] disabled:opacity-50 transition shadow-2xs self-start sm:self-auto"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Routes
          </button>
        </div>

        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4 sm:p-6 shadow-2xs space-y-4">
          <div className="relative max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by operator, origin, or destination..."
              className="w-full rounded-xl border border-[#e2e8f0] bg-white py-2 pl-8 pr-4 text-xs outline-none focus:border-[#4a6d00] focus:ring-2 focus:ring-[#4a6d00]/20"
            />
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-[#94a3b8]">Loading system routes...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-[#94a3b8]">
              <Bus size={40} className="mb-3 opacity-40" />
              <p className="text-xs">No active bus routes found</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 lg:hidden">
                {filtered.map((r) => (
                  <div key={r.id || r.routeId} className="rounded-2xl border border-[#e2e8f0] bg-white p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-[#1e293b]">
                          {r.from} → {r.to}
                        </p>
                        <p className="text-xs text-[#64748b]">
                          {r.operator} · {r.busType}
                        </p>
                      </div>
                      <Badge variant={r.status}>{r.status}</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-lg bg-[#f8fafc] p-2">
                        <p className="font-semibold">{formatScheduleLabel(r.departure)}</p>
                        <p className="text-[#94a3b8]">Dep</p>
                      </div>
                      <div className="rounded-lg bg-[#f8fafc] p-2">
                        <p className="font-semibold">{r.duration}</p>
                        <p className="text-[#94a3b8]">Duration</p>
                      </div>
                      <div className="rounded-lg bg-[#f8fafc] p-2">
                        <p className="font-semibold text-[#f26522]">€{r.price}</p>
                        <p className="text-[#94a3b8]">Price</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => openDetails(r)}
                        className="flex items-center gap-1 rounded-lg border border-[#e2e8f0] px-3.5 py-1.5 text-xs font-semibold text-[#1e293b] hover:bg-[#f8fafc] transition"
                      >
                        <Eye size={13} /> View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto rounded-xl border border-[#f1f5f9] lg:block">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#f1f5f9] bg-[#f8fafc] text-[#64748b] font-semibold">
                      <th className="py-3 px-4">Route Path</th>
                      <th className="py-3 px-4">Operator</th>
                      <th className="py-3 px-4">Schedule & Duration</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Available Seats</th>
                      <th className="py-3 px-4">Bus Type</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f8fafc]">
                    {filtered.map((r) => (
                      <tr key={r.id || r.routeId} className="hover:bg-[#fafafa] transition">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-[#1e293b]">
                            {r.from} → {r.to}
                          </p>
                          <p className="text-[11px] text-[#94a3b8] font-mono">ID: {r.id || r.routeId}</p>
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-[#1e293b]">{r.operator}</td>

                        <td className="py-3.5 px-4">
                          <p className="font-medium text-[#1e293b]">
                            {formatScheduleLabel(r.departure)} – {formatScheduleLabel(r.arrival)}
                          </p>
                          <p className="text-[11px] text-[#94a3b8]">{r.duration}</p>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-[#f26522]">€{r.price}</td>

                        <td className="py-3.5 px-4 text-[#64748b]">
                          <span className="rounded-lg bg-[#f8fafc] px-2 py-1 font-bold text-[#4a6d00]">
                            {r.seatsAvailable || 0} / {r.seats || 40}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-[#64748b]">{r.busType}</td>

                        <td className="py-3.5 px-4">
                          <Badge variant={r.status}>{r.status}</Badge>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => openDetails(r)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-semibold text-[#1e293b] hover:bg-[#f8fafc] transition"
                          >
                            <Eye size={13} /> View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <Modal open={detailsModal} onClose={() => setDetailsModal(false)} title="Route Inspection & Moderation" wide>
          {selectedRoute && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-[#1e293b]">
                      {selectedRoute.from} → {selectedRoute.to}
                    </h2>
                    <Badge variant={selectedRoute.status}>{selectedRoute.status}</Badge>
                  </div>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    Operator: <span className="font-bold text-[#1e293b]">{selectedRoute.operator}</span> · Bus Type: <span className="font-bold text-[#1e293b]">{selectedRoute.busType}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0">
                  <div className="flex gap-2">
                    <button
                      onClick={() => startSimulation(selectedRoute)}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
                    >
                      <Bus size={14} /> Simulate Trip
                    </button>
                    <button
                      onClick={() => stopSimulation(selectedRoute)}
                      className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition"
                    >
                      Stop Simulation
                    </button>
                  </div>
                  <button
                    onClick={() => setMapModal(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                  >
                    <MapPin size={14} /> Track Live Map
                  </button>
                  {selectedRoute.status === "active" ? (
                    <button
                      onClick={() => updateRouteStatus(selectedRoute, "inactive")}
                      className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition"
                    >
                      <AlertTriangle size={14} /> Suspend Route
                    </button>
                  ) : (
                    <button
                      onClick={() => updateRouteStatus(selectedRoute, "active")}
                      className="flex items-center gap-1.5 rounded-xl bg-[#4a6d00] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3d5a00] transition"
                    >
                      <ShieldCheck size={14} /> Verify & Activate Route
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl border border-[#e2e8f0] p-3 space-y-1">
                  <span className="text-[#94a3b8] font-bold uppercase tracking-wider text-[10px]">Departure</span>
                  <p className="font-bold text-[#1e293b] text-sm">{formatScheduleLabel(selectedRoute.departure)}</p>
                  <p className="text-[#64748b]">{selectedRoute.departureStation || "Main Station"}</p>
                  {selectedRoute.departureGate && <p className="text-[11px] text-[#4a6d00] font-medium">Gate: {selectedRoute.departureGate}</p>}
                </div>

                <div className="rounded-xl border border-[#e2e8f0] p-3 space-y-1">
                  <span className="text-[#94a3b8] font-bold uppercase tracking-wider text-[10px]">Duration & Pricing</span>
                  <p className="font-bold text-[#f26522] text-sm">€{selectedRoute.price} / seat</p>
                  <p className="text-[#64748b]">Total Trip Duration: {selectedRoute.duration || "N/A"}</p>
                  <p className="text-[11px] text-[#4a6d00] font-medium">Seats: {selectedRoute.seatsAvailable || 0}/{selectedRoute.seats || 40} available</p>
                </div>

                <div className="rounded-xl border border-[#e2e8f0] p-3 space-y-1">
                  <span className="text-[#94a3b8] font-bold uppercase tracking-wider text-[10px]">Arrival</span>
                  <p className="font-bold text-[#1e293b] text-sm">{formatScheduleLabel(selectedRoute.arrival)}</p>
                  <p className="text-[#64748b]">{selectedRoute.arrivalStation || "Main Terminal"}</p>
                  {selectedRoute.arrivalPlatform && <p className="text-[11px] text-[#4a6d00] font-medium">Platform: {selectedRoute.arrivalPlatform}</p>}
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-[#e2e8f0] p-4 space-y-2">
                  <span className="font-bold text-[#1e293b] text-xs">Policies & Passenger Inclusions</span>
                  <p className="text-[#64748b]"><strong className="text-[#1e293b]">Cancellation:</strong> {selectedRoute.cancellationPolicy || "Standard Policy"}</p>
                  <p className="text-[#64748b]"><strong className="text-[#1e293b]">Luggage:</strong> {selectedRoute.luggagePolicy || "Standard Luggage Policy"}</p>
                  {selectedRoute.benefitNote && <p className="text-[#64748b]"><strong className="text-[#1e293b]">Benefits:</strong> {selectedRoute.benefitNote}</p>}
                </div>

                {selectedRoute.facilities && selectedRoute.facilities.length > 0 && (
                  <div className="rounded-xl border border-[#e2e8f0] p-4">
                    <span className="font-bold text-[#1e293b] text-xs block mb-2">On-board Facilities</span>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(selectedRoute.facilities) ? selectedRoute.facilities : String(selectedRoute.facilities).split(",")).map((f) => (
                        <span key={f} className="rounded-lg bg-[#f8fafc] border border-[#e2e8f0] px-2.5 py-1 text-[11px] font-semibold text-[#1e293b] capitalize">
                          {f.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setDetailsModal(false)}
                  className="rounded-xl border border-[#e2e8f0] px-5 py-2 text-xs font-semibold text-[#64748b] hover:bg-[#f8fafc] transition"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          )}
        </Modal>

        <Modal open={mapModal} onClose={() => setMapModal(false)} title="Live Bus Tracking" wide>
          {selectedRoute && mapModal && (
            <div className="w-full relative">
              <LiveMap routeId={selectedRoute.id || selectedRoute.routeId} />
            </div>
          )}
        </Modal>

      </div>
    </AdminLayout>
  );
}
