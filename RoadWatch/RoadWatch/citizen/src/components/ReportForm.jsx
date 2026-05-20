import { useRef, useState } from "react";
import axios from "axios";
import { toast } from 'react-hot-toast';
import { Camera, Upload, User, Mail, Send, Search, MapPin } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

function MapController({ center }) {
  const map = useMap();
  map.flyTo(center, 15);
  return null;
}

function ReportForm() {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [locationDesc, setLocationDesc] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchAddress = async (lat, lng) => {
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      if (res.data && res.data.display_name) {
        setLocationDesc(res.data.display_name);
      }
    } catch (err) {
      console.error("Reverse geocoding failed", err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`);
      if (res.data && res.data.length > 0) {
        const lat = parseFloat(res.data[0].lat).toFixed(6);
        const lng = parseFloat(res.data[0].lon).toFixed(6);
        setLocation({ lat, lng });
        fetchAddress(lat, lng);
      } else {
        toast.error("Location not found");
      }
    } catch (err) {
      console.error("Search error", err);
    }
  };

  // ================= Upload Image =================
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setSelectedFile(file);

    // Call AI immediately
    analyzeImage(file);
  };

  // ================= Call Flask API =================
  const analyzeImage = async (file) => {
    try {
      setLoadingAI(true);
      setAnalysis(null);

      const formData = new FormData();
      formData.append("image", file);

      const response = await axios.post(
        "http://127.0.0.1:5000/analyze",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setAnalysis(response.data);
    } catch (error) {
      console.error("AI Error:", error);
      alert("Error analyzing image");
    } finally {
      setLoadingAI(false);
    }
  };

  // ================= Detect GPS =================
  const detectLocation = () => {
    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setLocation({ lat, lng });
        await fetchAddress(lat, lng);
        setLoadingLocation(false);
      },
      () => {
        toast.error("Location access denied");
        setLoadingLocation(false);
      }
    );
  };

  function ManualMarker({ setLocation }) {
    useMapEvents({
      click(e) {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);
        setLocation({ lat, lng });
        fetchAddress(lat, lng);
      },
    });
    return null;
  }

  // ================= Submit =================
  const handleSubmit = async () => {
    if (!analysis || !selectedFile) {
      toast.error("Please upload and analyze an image first");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("description", description);
    formData.append("locationDesc", locationDesc);
    formData.append("location", JSON.stringify(location));
    formData.append("ai_result", JSON.stringify(analysis));
    formData.append("image", selectedFile);

    try {
      const response = await axios.post("http://localhost:5001/api/complaints", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      console.log("Report Submitted:", response.data);
      toast.success("Report Submitted Successfully ✅");
      
      // Optionally reset form here
    } catch (error) {
      console.error("Error submitting report:", error);
      if (error.response?.status === 409) {
        toast.error("Duplicate! A similar open report exists within 50 meters of this location.");
      } else {
        toast.error("Failed to submit report. Ensure backend is running.");
      }
    }
  };

  return (
    <section id="report-section" className="px-20 py-20 bg-gray-100">
      <h2 className="text-4xl font-bold text-center mb-10">
        Report Infrastructure Issue
      </h2>

      <div className="bg-white p-10 rounded-2xl shadow-xl max-w-4xl mx-auto space-y-8">

        {/* ================= Upload Section ================= */}
        <div>
          <h3 className="flex items-center gap-2 font-semibold mb-4 text-lg">
            <Camera size={20} className="text-green-600" />
            Upload Photo of Road Damage
          </h3>

          <div className="border-2 border-dashed border-green-500 rounded-2xl p-12 text-center">

            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="mx-auto mb-6 rounded-xl max-h-60"
              />
            ) : (
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera size={30} className="text-green-600" />
              </div>
            )}

            <div className="flex justify-center gap-6 mb-4">

              <button
                onClick={() => cameraInputRef.current.click()}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition"
              >
                <Camera size={18} />
                Take Photo
              </button>

              <button
                onClick={() => fileInputRef.current.click()}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition"
              >
                <Upload size={18} />
                Upload File
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/png, image/jpeg"
              onChange={handleFileChange}
            />

            <input
              type="file"
              ref={cameraInputRef}
              className="hidden"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* ================= AI RESULT SECTION ================= */}
        {loadingAI && (
          <div className="text-center text-blue-600 font-semibold text-lg">
            🤖 Analyzing Image...
          </div>
        )}

        {analysis && (
          <div
            className={`p-6 rounded-2xl text-white text-center ${
              analysis.severity === "high"
                ? "bg-red-600"
                : analysis.severity === "medium"
                ? "bg-yellow-500"
                : "bg-green-600"
            }`}
          >
            <h3 className="text-2xl font-bold mb-2">
              AI Damage Analysis Result
            </h3>

            <p className="text-lg">
              Damage Score: <strong>{analysis.final_score}</strong>
            </p>

            <p className="text-lg">
              Severity Level:{" "}
              <strong>{analysis.severity.toUpperCase()}</strong>
            </p>
          </div>
        )}

        {/* ================= Location Section ================= */}
        <div>
          <button
            onClick={detectLocation}
            disabled={loadingLocation}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-semibold transition flex items-center justify-center gap-2"
          >
            <MapPin size={20} />
            {loadingLocation
              ? "Detecting..."
              : location
              ? "Auto Detected Location"
              : "Auto Detect GPS Location"}
          </button>

          <div className="mt-6 border p-2 rounded-xl flex items-center gap-2 bg-white focus-within:ring-2 focus-within:ring-green-500 shadow-sm">
            <input 
              type="text"
              placeholder="Search for a location manually..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-3 py-2 outline-none text-gray-700"
            />
            <button onClick={(e) => { e.preventDefault(); handleSearch(); }} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition">
              <Search size={18} /> Search
            </button>
          </div>

          <p className="text-gray-500 text-sm mt-3 flex items-center gap-2">
            💡 <span className="font-medium">Pro Tip:</span> You can drag the marker or click anywhere on the map to fine-tune the exact location.
          </p>

          <div className="mt-3 rounded-2xl overflow-hidden shadow-lg border-2 border-gray-100 relative z-0">
            <MapContainer
              center={
                location
                  ? [location.lat, location.lng]
                  : [6.5244, 3.3792]
              }
              zoom={location ? 15 : 6}
              style={{ height: "300px", width: "100%" }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {location && <MapController center={[location.lat, location.lng]} />}
              {location && (
                <Marker 
                  position={[location.lat, location.lng]} 
                  draggable={true}
                  eventHandlers={{
                    dragend: (e) => {
                      const marker = e.target;
                      const position = marker.getLatLng();
                      const lat = position.lat.toFixed(6);
                      const lng = position.lng.toFixed(6);
                      setLocation({ lat, lng });
                      fetchAddress(lat, lng);
                    }
                  }}
                />
              )}
              <ManualMarker setLocation={setLocation} />
            </MapContainer>
          </div>
          
          {locationDesc && (
            <div className="mt-4 bg-green-50 p-4 rounded-xl text-green-800 font-medium border border-green-200">
              <MapPin size={18} className="inline ml-1 mr-2 text-green-600" />
              {locationDesc}
            </div>
          )}
        </div>

        {/* ================= Name ================= */}
        <input
          type="text"
          placeholder="Enter your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-3 w-full rounded-lg"
        />

        {/* ================= Email ================= */}
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-3 w-full rounded-lg"
        />

        {/* ================= Description ================= */}
        <textarea
          rows="4"
          placeholder="Describe the road damage..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-3 w-full rounded-lg"
        />

        {/* ================= Submit ================= */}
        <button
          onClick={handleSubmit}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl text-lg font-semibold transition shadow-lg"
        >
          <Send size={20} />
          Submit Report
        </button>

      </div>
    </section>
  );
}

export default ReportForm;