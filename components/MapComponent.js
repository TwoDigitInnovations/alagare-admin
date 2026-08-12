import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import io from "socket.io-client";

// Leaflet default icon fix for Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom Bus Icon
const busIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3448/3448339.png", // A simple bus icon
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
  className: "smooth-marker"
});

const startIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/7165/7165761.png", // Pin icon
  iconSize: [28, 28],
  iconAnchor: [14, 28]
});

const endIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1483/1483336.png", // Flag icon
  iconSize: [28, 28],
  iconAnchor: [14, 28]
});

// Helper component to center map on marker updates
const MapAutoCenter = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position && position[0] && position[1]) {
      map.flyTo(position, 14, { animate: true });
    }
  }, [position, map]);
  return null;
};

export default function MapComponent({ routeId }) {
  const [location, setLocation] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [status, setStatus] = useState("Waiting...");
  const [routeLine, setRouteLine] = useState([]);
  
  const socketRef = useRef(null);

  // Fetch OSRM route geometry
  useEffect(() => {
    const fetchRoute = async () => {
      // Default to Kanpur and Lucknow for simulation
      const startLat = 26.8467;
      const startLng = 80.9462;
      const endLat = 26.4499;
      const endLng = 80.3319;
      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]); // [lat, lng]
        setRouteLine(coords);
      } catch (e) {
        console.error("OSRM Polyline Fetch Error", e);
      }
    };
    fetchRoute();
  }, []);

  useEffect(() => {
    if (!routeId) return;

    // We assume backend is running on localhost:3008 for local testing
    // In production, this should be the live backend URL
    const backendUrl = "http://localhost:3008"; 

    const socket = io(backendUrl, {
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Admin Map connected to socket");
      socket.emit("join_route", routeId);
    });

    socket.on("bus_location_update", (data) => {
      if (data.location?.lat && data.location?.lng) {
        setLocation([data.location.lat, data.location.lng]);
        setSpeed(data.speed || 0);
        setStatus(data.status || "In-Transit");
      }
    });

    return () => {
      socket.emit("leave_route", routeId);
      socket.disconnect();
    };
  }, [routeId]);

  const defaultPosition = location || [26.8467, 80.9462]; // Default to UP, India

  return (
    <div style={{ height: "400px", width: "100%", borderRadius: "12px", overflow: "hidden", position: "relative" }}>
      <style>{`
        .smooth-marker {
          transition: transform 5.1s linear !important;
        }
      `}</style>
      <MapContainer center={defaultPosition} zoom={13} style={{ height: "100%", width: "100%", zIndex: 10 }}>
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {routeLine.length > 0 && (
          <>
            <Polyline positions={routeLine} color="#2563eb" weight={6} opacity={0.9} />
            <Marker position={routeLine[0]} icon={startIcon}>
              <Popup>Start Point</Popup>
            </Marker>
            <Marker position={routeLine[routeLine.length - 1]} icon={endIcon}>
              <Popup>Destination</Popup>
            </Marker>
          </>
        )}
        {location && (
          <>
            <Marker position={location} icon={busIcon}>
              <Popup>
                <strong>Route:</strong> {routeId} <br />
                <strong>Speed:</strong> {Math.round(speed)} km/h <br />
                <strong>Status:</strong> {status}
              </Popup>
            </Marker>
            <MapAutoCenter position={location} />
          </>
        )}
      </MapContainer>
      
      {/* Overlay Status Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-[400] bg-white rounded-xl shadow-lg border border-slate-100 p-4 flex justify-between items-center">
        <div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Status</p>
          <p className="text-sm font-bold text-slate-800">{location ? status : "Waiting for GPS..."}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Speed</p>
          <p className="text-sm font-bold text-blue-600">{Math.round(speed)} km/h</p>
        </div>
      </div>
    </div>
  );
}
