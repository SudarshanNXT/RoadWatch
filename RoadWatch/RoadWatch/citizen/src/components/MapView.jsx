import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useState, useEffect } from "react";
import axios from "axios";
import L from "leaflet";

// Fix marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const getMarkerIcon = (severity, status) => {
  let color = "bg-green-500"; // default low
  if (status === "resolved") {
    color = "bg-white border-2 border-gray-400";
  } else if (severity === "high") {
    color = "bg-red-500";
  } else if (severity === "medium") {
    color = "bg-yellow-500";
  }

  return L.divIcon({
    className: "custom-icon",
    html: `<div class="w-6 h-6 rounded-full shadow-lg ${color} flex items-center justify-center -ml-3 -mt-3 ring-2 ring-white"></div>`
  });
};

function MapView() {
  const [position, setPosition] = useState(null);
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    // Get user live location
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {
        // Fallback location if denied
        setPosition([20.5937, 78.9629]); 
      }
    );

    // Fetch complaints
    const fetchComplaints = async () => {
      try {
        const response = await axios.get("http://localhost:5001/api/complaints");
        setComplaints(response.data);
      } catch (err) {
        console.error("Error fetching map complaints", err);
      }
    };
    fetchComplaints();
  }, []);

  if (!position) {
    return (
      <section className="px-20 py-20 bg-gray-100 text-center">
        <h2 className="text-3xl font-semibold">
          Detecting your location...
        </h2>
      </section>
    );
  }

  return (
    <section className="px-20 py-20 bg-gray-100">
      <h2 className="text-4xl font-bold text-center mb-10">
        Road Issues Map
      </h2>

      <div className="max-w-6xl mx-auto rounded-2xl overflow-hidden shadow-xl">
        <MapContainer
          center={position}
          zoom={15}
          scrollWheelZoom={false}
          style={{ height: "450px", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={position}>
            <Popup>You are here 📍</Popup>
          </Marker>

          {complaints.map((c) => {
            if (!c.location || !c.location.lat || !c.location.lng) return null;
            return (
              <Marker
                key={c.complaintId}
                position={[parseFloat(c.location.lat), parseFloat(c.location.lng)]}
                icon={getMarkerIcon(c.aiAnalysis?.severity?.toLowerCase(), c.status)}
              >
                <Popup>
                  <strong>Report:</strong> {c.complaintId} <br/>
                  <strong>Location:</strong> {c.locationDesc || "Unknown"} <br/>
                  <strong>Severity:</strong> {c.aiAnalysis?.severity?.toUpperCase() || "N/A"}<br/>
                  <strong>Status:</strong> <span className="uppercase font-bold">{c.status}</span>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <div className="flex justify-center gap-6 mt-6">
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-500 border border-gray-300"></div> High Severity</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-yellow-500 border border-gray-300"></div> Medium</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-green-500 border border-gray-300"></div> Low/Minor</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-white border-2 border-gray-400"></div> Resolved</div>
      </div>
    </section>
  );
}

export default MapView;
