import { useEffect, useState, useRef, useMemo } from "react";
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

const startIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/7165/7165761.png",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

const endIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1483/1483336.png",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

// Calculate distance in KM between two [lat, lng] coordinates
const getDistanceKm = (p1, p2) => {
  if (!p1 || !p2) return 0;
  const R = 6371;
  const dLat = ((p2[0] - p1[0]) * Math.PI) / 180;
  const dLng = ((p2[1] - p1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1[0] * Math.PI) / 180) *
      Math.cos((p2[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Smooth Animated Bus Marker with 60 FPS requestAnimationFrame Interpolation
function AnimatedBusMarker({ targetPosition, duration = 8000, routeId, speed, status }) {
  const map = useMap();
  const markerRef = useRef(null);
  const [currentPos, setCurrentPos] = useState(targetPosition);
  const [heading, setHeading] = useState(0);

  const prevPosRef = useRef(targetPosition);
  const animFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const isFirstRender = useRef(true);

  // Calculate bearing in degrees
  const calcBearing = (from, to) => {
    if (!from || !to || (from[0] === to[0] && from[1] === to[1])) return 0;
    const lat1 = (from[0] * Math.PI) / 180;
    const lat2 = (to[0] * Math.PI) / 180;
    const dLng = ((to[1] - from[1]) * Math.PI) / 180;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  };

  useEffect(() => {
    if (!targetPosition || !targetPosition[0] || !targetPosition[1]) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevPosRef.current = targetPosition;
      setCurrentPos(targetPosition);
      if (markerRef.current) markerRef.current.setLatLng(targetPosition);
      map.setView(targetPosition, 14);
      return;
    }

    const startPos = prevPosRef.current || targetPosition;
    const endPos = targetPosition;

    // If the distance between points is large (> 0.8 km, e.g. initial load / teleport), snap instantly
    const jumpDistKm = getDistanceKm(startPos, endPos);
    if (jumpDistKm > 0.8) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      prevPosRef.current = endPos;
      setCurrentPos(endPos);
      if (markerRef.current) markerRef.current.setLatLng(endPos);
      map.setView(endPos, 14);
      return;
    }

    // Calculate rotation angle towards direction of movement
    const newHeading = calcBearing(startPos, endPos);
    if (newHeading !== 0) {
      setHeading(newHeading);
    }

    startTimeRef.current = performance.now();
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    // 60 FPS smooth interpolation loop along the road
    const animate = (now) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      const currentLat = startPos[0] + (endPos[0] - startPos[0]) * progress;
      const currentLng = startPos[1] + (endPos[1] - startPos[1]) * progress;
      const interpolated = [currentLat, currentLng];

      setCurrentPos(interpolated);

      if (markerRef.current) {
        markerRef.current.setLatLng(interpolated);
      }

      // Smooth camera follow without jumpy zoom/flyTo
      if (progress === 1 || elapsed % 800 < 20) {
        map.panTo(interpolated, { animate: true, duration: 0.8, easeLinearity: 0.25 });
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        prevPosRef.current = endPos;
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [targetPosition, duration, map]);

  const customBusIcon = useMemo(() => {
    return L.divIcon({
      className: "custom-bus-marker-node",
      html: `
        <div style="
          position: relative;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${heading}deg);
          transition: transform 0.5s ease-out;
        ">
          <div style="
            position: absolute;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: rgba(37, 99, 235, 0.25);
            animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          "></div>
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #2563eb;
            border: 2.5px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 6v6"></path>
              <path d="M15 6v6"></path>
              <path d="M2 12h19.6"></path>
              <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.2 6 18.1 6H5.9C4.8 6 3.9 6.8 3.6 7.8l-1.4 5c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3"></path>
              <circle cx="7" cy="18" r="2"></circle>
              <circle cx="17" cy="18" r="2"></circle>
            </svg>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -22],
    });
  }, [heading]);

  if (!currentPos) return null;

  return (
    <Marker ref={markerRef} position={currentPos} icon={customBusIcon}>
      <Popup>
        <div style={{ padding: "4px", fontSize: "12px", lineHeight: "1.6" }}>
          <strong style={{ color: "#1e293b", fontSize: "13px" }}>Route: {routeId}</strong> <br />
          <span style={{ color: "#64748b" }}>Speed:</span> <strong>{Math.round(speed || 0)} km/h</strong> <br />
          <span style={{ color: "#64748b" }}>Status:</span> <strong style={{ color: "#2563eb" }}>{status}</strong>
        </div>
      </Popup>
    </Marker>
  );
}

export default function MapComponent({ routeId }) {
  const [location, setLocation] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [status, setStatus] = useState("Waiting for GPS...");
  const [routeLine, setRouteLine] = useState([]);

  const socketRef = useRef(null);

  // Fetch OSRM route geometry
  useEffect(() => {
    let mounted = true;
    const fetchRoute = async () => {
      const startLat = 26.8467;
      const startLng = 80.9462;
      const endLat = 26.4499;
      const endLng = 80.3319;
      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        const coords = data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);
        if (mounted) setRouteLine(coords);
      } catch (e) {
        console.error("OSRM Polyline Fetch Error", e);
      }
    };
    fetchRoute();
    return () => {
      mounted = false;
    };
  }, []);

  const lastPingTimeRef = useRef(Date.now());
  const [animDuration, setAnimDuration] = useState(8000);

  useEffect(() => {
    if (!routeId) return;

    const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3008";
    const backendUrl = backendBase.replace(/\/api\/?$/, "");

    const socket = io(backendUrl, {
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_route", routeId);
    });

    socket.on("bus_location_update", (data) => {
      if (data.location?.lat && data.location?.lng) {
        const now = Date.now();
        const delta = now - lastPingTimeRef.current;
        lastPingTimeRef.current = now;
        if (delta >= 2000 && delta <= 20000) {
          setAnimDuration(delta);
        }
        setLocation([Number(data.location.lat), Number(data.location.lng)]);
        setSpeed(Number(data.speed) || 0);
        setStatus(data.status || "In-Transit");
      }
    });

    return () => {
      socket.emit("leave_route", routeId);
      socket.disconnect();
    };
  }, [routeId]);

  const defaultPosition = location || [26.8467, 80.9462];

  return (
    <div style={{ height: "400px", width: "100%", borderRadius: "14px", overflow: "hidden", position: "relative" }}>
      <style>{`
        @keyframes pulse-ring {
          0% {
            transform: scale(0.8);
            opacity: 0.8;
          }
          80%, 100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
        .custom-bus-marker-node {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
      <MapContainer center={defaultPosition} zoom={13} style={{ height: "100%", width: "100%", zIndex: 10 }}>
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={["mt0", "mt1", "mt2", "mt3"]}
          maxZoom={20}
        />
        {routeLine.length > 0 && (
          <>
            <Polyline positions={routeLine} color="#2563eb" weight={6} opacity={0.9} lineCap="round" lineJoin="round" />
            <Marker position={routeLine[0]} icon={startIcon}>
              <Popup>Start Point</Popup>
            </Marker>
            <Marker position={routeLine[routeLine.length - 1]} icon={endIcon}>
              <Popup>Destination</Popup>
            </Marker>
          </>
        )}
        {location && (
          <AnimatedBusMarker
            targetPosition={location}
            duration={animDuration}
            routeId={routeId}
            speed={speed}
            status={status}
          />
        )}
      </MapContainer>

      {/* Overlay Status Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-[400] bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-100 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Status</p>
            <p className="text-sm font-bold text-slate-800 capitalize">{location ? status : "Waiting for GPS..."}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Speed</p>
          <p className="text-sm font-black text-blue-600">{Math.round(speed)} km/h</p>
        </div>
      </div>
    </div>
  );
}
