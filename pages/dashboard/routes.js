import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import { Api } from "@/services/service";
import { toastSuccess, toastError, swalConfirm } from "@/utils/swal";
import { Plus, Search, Pencil, Trash2, Bus } from "lucide-react";

const emptyForm = {
  operator: "", from: "", to: "", departure: "", arrival: "",
  duration: "", price: "", busType: "", status: "active",
  isPopular: true,
  isExpress: true,
  departureStation: "", arrivalStation: "",
  departureGate: "", arrivalPlatform: "",
  transferStation: "", transferTime: "", transferNote: "",
  cancellationPolicy: "Full refund up to 24h before departure",
  luggagePolicy: "1 Carry-on + 1 Checked bag Included",
  benefitNote: "Standard Premier includes meal and lounge access.",
  facilities: "wifi,power,ac,reclining",
};

const OPTIONAL_ROUTE_FIELDS = [
  "transferStation",
  "transferTime",
  "transferNote",
  "departureStation",
  "arrivalStation",
  "departureGate",
  "arrivalPlatform",
  "facilities",
  "cancellationPolicy",
  "luggagePolicy",
  "benefitNote",
];

/** Must live outside the page component — otherwise inputs remount and lose focus on each keystroke */
const RouteField = ({ label, name, value, onChange, type = "text" }) => (
  <div>
    <label className="mb-1 block text-xs font-medium text-[#64748b]">{label}</label>
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(name, e.target.value)}
      required={!OPTIONAL_ROUTE_FIELDS.includes(name)}
      className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00] focus:ring-2 focus:ring-[#4a6d00]/20"
    />
  </div>
);

const toDatetimeLocal = (val) => {
  if (!val) return "";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val)) return val.slice(0, 16);
  if (/^\d{2}:\d{2}$/.test(val)) {
    const d = new Date();
    const [hh, mm] = val.split(":");
    d.setHours(Number(hh), Number(mm), 0, 0);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const calcDuration = (departure, arrival) => {
  const d1 = new Date(departure);
  const d2 = new Date(arrival);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime()) || d2 <= d1) return "";
  const mins = Math.round((d2 - d1) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

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
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [operators, setOperators] = useState([]);
  const [cities, setCities] = useState([]);
  const [busTypes, setBusTypes] = useState([]);

  const loadRoutes = () => {
    Api("get", "admin/routes", null, router)
      .then((res) => setRoutes(res?.data?.routes || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRoutes();
    Api("get", "admin/operators", null, router)
      .then((res) => setOperators((res?.data?.operators || []).filter((o) => o.status === "active")))
      .catch(() => {});
    Api("get", "admin/cities", null, router)
      .then((res) => setCities((res?.data?.cities || []).filter((c) => c.status === "active")))
      .catch(() => {});
    Api("get", "admin/bus-types", null, router)
      .then((res) => setBusTypes((res?.data?.busTypes || []).filter((t) => t.status === "active")))
      .catch(() => {});
  }, []);

  const setScheduleField = (name, value) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "departure" || name === "arrival") {
        next.duration = calcDuration(
          name === "departure" ? value : next.departure,
          name === "arrival" ? value : next.arrival,
        );
      }
      return next;
    });
  };

  const applyBusType = (name) => {
    setForm((prev) => ({ ...prev, busType: name }));
  };

  const filtered = routes.filter(
    (r) =>
      r.from?.toLowerCase().includes(search.toLowerCase()) ||
      r.to?.toLowerCase().includes(search.toLowerCase()) ||
      r.operator?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setModal(true);
  };

  const openEdit = (r) => {
    setEditId(r.id || r.routeId);
    const departure = toDatetimeLocal(r.departure);
    const arrival = toDatetimeLocal(r.arrival);
    setForm({
      operator: r.operator,
      from: r.from,
      to: r.to,
      departure,
      arrival,
      duration: r.duration || calcDuration(departure, arrival),
      price: String(r.price),
      busType: r.busType,
      status: r.status,
      isPopular: r.isPopular !== false,
      isExpress: r.isExpress !== false,
      departureStation: r.departureStation || "",
      arrivalStation: r.arrivalStation || "",
      departureGate: r.departureGate || "",
      arrivalPlatform: r.arrivalPlatform || "",
      transferStation: r.transferStation || "",
      transferTime: r.transferTime || "",
      transferNote: r.transferNote || "",
      cancellationPolicy: r.cancellationPolicy || "Full refund up to 24h before departure",
      luggagePolicy: r.luggagePolicy || "1 Carry-on + 1 Checked bag Included",
      benefitNote: r.benefitNote || "Standard Premier includes meal and lounge access.",
      facilities: Array.isArray(r.facilities) ? r.facilities.join(",") : "wifi,power,ac,reclining",
    });
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.duration) {
      toastError("Arrival must be after departure");
      return;
    }
    const payload = {
      operator: form.operator,
      from: form.from,
      to: form.to,
      departure: form.departure,
      arrival: form.arrival,
      duration: form.duration,
      price: parseFloat(form.price),
      busType: form.busType,
      status: form.status,
      isPopular: form.isPopular,
      isExpress: form.isExpress,
      departureStation: form.departureStation,
      arrivalStation: form.arrivalStation,
      departureGate: form.departureGate,
      arrivalPlatform: form.arrivalPlatform,
      transferStation: form.transferStation,
      transferTime: form.transferTime,
      transferNote: form.transferNote,
      cancellationPolicy: form.cancellationPolicy,
      luggagePolicy: form.luggagePolicy,
      benefitNote: form.benefitNote,
      facilities: form.facilities
        ? form.facilities.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
    };
    try {
      if (editId) {
        await Api("put", `admin/routes/${editId}`, payload, router);
        toastSuccess("Route updated");
      } else {
        await Api("post", "admin/routes", payload, router);
        toastSuccess("Route created");
      }
      setModal(false);
      loadRoutes();
    } catch {
      toastError("Failed to save route");
    }
  };

  const setFormField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const remove = async (id) => {
    const ok = await swalConfirm("Delete this route?");
    if (!ok) return;
    try {
      await Api("delete", `admin/routes/${id}`, null, router);
      toastSuccess("Route deleted");
      loadRoutes();
    } catch {
      toastError("Failed to delete");
    }
  };

  return (
    <AdminLayout title="Bus Routes">
      {loading ? (
        <p className="text-sm text-[#64748b]">Loading routes...</p>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search routes..."
                className="w-full rounded-xl border border-[#e2e8f0] bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#4a6d00]"
              />
            </div>
            <button
              onClick={openAdd}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#4a6d00] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3d5a00]"
            >
              <Plus size={16} /> Add Route
            </button>
          </div>

          <div className="space-y-3 lg:hidden">
            {filtered.map((r) => (
              <div key={r.id} className="rounded-2xl border border-[#e2e8f0] bg-white p-4">
                <div className="mb-2 flex items-start justify-between">
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
                <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
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
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(r)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-[#e2e8f0] py-2 text-xs font-medium hover:bg-[#f8fafc]"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    onClick={() => remove(r.id)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-red-200 py-2 text-xs font-medium text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-left text-xs text-[#64748b]">
                  {["Route", "Operator", "Schedule", "Price", "Seats", "Type", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-[#f8fafc] hover:bg-[#fafafa]">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#1e293b]">
                        {r.from} → {r.to}
                      </p>
                      <p className="text-xs text-[#94a3b8]">{r.id}</p>
                    </td>
                    <td className="px-4 py-3 text-[#64748b]">{r.operator}</td>
                    <td className="px-4 py-3">
                      <p>
                        {formatScheduleLabel(r.departure)} – {formatScheduleLabel(r.arrival)}
                      </p>
                      <p className="text-xs text-[#94a3b8]">{r.duration}</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-[#f26522]">€{r.price}</td>
                    <td className="px-4 py-3">
                      {r.seatsAvailable}/{r.seats}
                    </td>
                    <td className="px-4 py-3 text-[#64748b]">{r.busType}</td>
                    <td className="px-4 py-3">
                      <Badge variant={r.status}>{r.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(r)} className="rounded-lg p-1.5 hover:bg-[#eaf5dd]">
                          <Pencil size={15} className="text-[#4a6d00]" />
                        </button>
                        <button onClick={() => remove(r.id)} className="rounded-lg p-1.5 hover:bg-red-50">
                          <Trash2 size={15} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-16 text-[#94a3b8]">
              <Bus size={40} className="mb-3 opacity-40" />
              <p>No routes found</p>
            </div>
          )}

          <Modal open={modal} onClose={() => setModal(false)} title={editId ? "Edit Route" : "Add New Route"} wide>
            <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#64748b]">Operator</label>
                {operators.length > 0 ? (
                  <select
                    required
                    value={form.operator}
                    onChange={(e) => setForm({ ...form, operator: e.target.value })}
                    className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                  >
                    <option value="">Select operator</option>
                    {operators.map((o) => (
                      <option key={o.id} value={o.name}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    required
                    value={form.operator}
                    onChange={(e) => setForm({ ...form, operator: e.target.value })}
                    className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                  />
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#64748b]">Bus Type</label>
                {busTypes.length > 0 ? (
                  <select
                    required
                    value={form.busType}
                    onChange={(e) => applyBusType(e.target.value)}
                    className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                  >
                    <option value="">Select type</option>
                    {busTypes.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.rowCount || 10}×{t.seatsPerSide || 2}+{t.seatsPerSide || 2})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    required
                    value={form.busType}
                    onChange={(e) => setForm({ ...form, busType: e.target.value })}
                    className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                  />
                )}
                {form.busType && (() => {
                  const t = busTypes.find((x) => x.name === form.busType);
                  if (!t) return null;
                  return (
                    <p className="mt-1 text-[11px] text-[#94a3b8]">
                      Seat map from type: {t.rowCount || 10} rows × {t.seatsPerSide || 2}+{t.seatsPerSide || 2}
                    </p>
                  );
                })()}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#64748b]">From City</label>
                {cities.length > 0 ? (
                  <select
                    required
                    value={form.from}
                    onChange={(e) => setForm({ ...form, from: e.target.value })}
                    className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                  >
                    <option value="">Select city</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    required
                    value={form.from}
                    onChange={(e) => setForm({ ...form, from: e.target.value })}
                    className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                  />
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#64748b]">To City</label>
                {cities.length > 0 ? (
                  <select
                    required
                    value={form.to}
                    onChange={(e) => setForm({ ...form, to: e.target.value })}
                    className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                  >
                    <option value="">Select city</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    required
                    value={form.to}
                    onChange={(e) => setForm({ ...form, to: e.target.value })}
                    className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                  />
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#64748b]">Departure</label>
                <input
                  type="datetime-local"
                  required
                  value={form.departure}
                  onChange={(e) => setScheduleField("departure", e.target.value)}
                  className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#64748b]">Arrival</label>
                <input
                  type="datetime-local"
                  required
                  value={form.arrival}
                  min={form.departure || undefined}
                  onChange={(e) => setScheduleField("arrival", e.target.value)}
                  className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#64748b]">Duration (auto)</label>
                <input
                  readOnly
                  value={form.duration}
                  placeholder="Set departure & arrival"
                  className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#1e293b] outline-none"
                />
              </div>
              <RouteField
                label="Price (€)"
                name="price"
                type="number"
                value={form.price}
                onChange={setFormField}
              />
              <div>
                <label className="mb-1 block text-xs font-medium text-[#64748b]">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#64748b]">Show in Popular Routes</label>
                <select
                  value={form.isPopular ? "yes" : "no"}
                  onChange={(e) => setForm({ ...form, isPopular: e.target.value === "yes" })}
                  className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#64748b]">Express Badge</label>
                <select
                  value={form.isExpress ? "yes" : "no"}
                  onChange={(e) => setForm({ ...form, isExpress: e.target.value === "yes" })}
                  className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#4a6d00]"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <RouteField
                label="Departure Station"
                name="departureStation"
                value={form.departureStation}
                onChange={setFormField}
              />
              <RouteField
                label="Arrival Station"
                name="arrivalStation"
                value={form.arrivalStation}
                onChange={setFormField}
              />
              <RouteField
                label="Departure Gate / Platform"
                name="departureGate"
                value={form.departureGate}
                onChange={setFormField}
              />
              <RouteField
                label="Arrival Platform"
                name="arrivalPlatform"
                value={form.arrivalPlatform}
                onChange={setFormField}
              />
              <RouteField
                label="Transfer Station (optional)"
                name="transferStation"
                value={form.transferStation}
                onChange={setFormField}
              />
              <RouteField
                label="Transfer Time (optional)"
                name="transferTime"
                value={form.transferTime}
                onChange={setFormField}
              />
              <div className="sm:col-span-2">
                <RouteField
                  label="Transfer Note (optional)"
                  name="transferNote"
                  value={form.transferNote}
                  onChange={setFormField}
                />
              </div>
              <div className="sm:col-span-2">
                <RouteField
                  label="Facilities (comma: wifi,power,ac,reclining)"
                  name="facilities"
                  value={form.facilities}
                  onChange={setFormField}
                />
              </div>
              <div className="sm:col-span-2">
                <RouteField
                  label="Cancellation Policy"
                  name="cancellationPolicy"
                  value={form.cancellationPolicy}
                  onChange={setFormField}
                />
              </div>
              <div className="sm:col-span-2">
                <RouteField
                  label="Luggage Policy"
                  name="luggagePolicy"
                  value={form.luggagePolicy}
                  onChange={setFormField}
                />
              </div>
              <div className="sm:col-span-2">
                <RouteField
                  label="Benefit Note (Payment card)"
                  name="benefitNote"
                  value={form.benefitNote}
                  onChange={setFormField}
                />
              </div>
              <div className="flex gap-3 pt-2 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="flex-1 rounded-xl border border-[#e2e8f0] py-2.5 text-sm font-medium hover:bg-[#f8fafc]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#4a6d00] py-2.5 text-sm font-semibold text-white hover:bg-[#3d5a00]"
                >
                  {editId ? "Save Changes" : "Create Route"}
                </button>
              </div>
            </form>
          </Modal>
        </>
      )}
    </AdminLayout>
  );
}
