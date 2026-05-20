import { useState, useEffect } from "react";
import { Shield, Home, Search as SearchIcon, Map as MapIcon, Image as ImageIcon, AlertTriangle, ExternalLink, Database, UploadCloud, Cpu, RefreshCw, CheckCircle2, TrendingUp, X } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom());
  }, [center, map]);
  return null;
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

const getMarkerIcon = (severity, status) => {
  let color = "bg-green-500";
  if (status === "resolved" || status === "cancelled") color = "bg-white border-2 border-gray-400";
  else if (severity === "high") color = "bg-red-500";
  else if (severity === "medium") color = "bg-yellow-500";

  return L.divIcon({
    className: "custom-icon",
    html: `<div class="w-6 h-6 rounded-full shadow-lg ${color} flex items-center justify-center -ml-3 -mt-3 ring-2 ring-white"></div>`
  });
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("active"); // active, history, map
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [adminComments, setAdminComments] = useState("");
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("warning");
  const [activeAlerts, setActiveAlerts] = useState([]);
  
  const [mapCenter, setMapCenter] = useState([6.5244, 3.3792]);
  const [searchQuery, setSearchQuery] = useState("");
  const [radiusKm, setRadiusKm] = useState(0);

  const navigate = useNavigate();

  // --- AI Retraining & Dataset Manager State & Logic ---
  const [datasetStats, setDatasetStats] = useState(null);
  const [uploadCategory, setUploadCategory] = useState("1");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainResults, setRetrainResults] = useState(null);
  const [oldAccuracy, setOldAccuracy] = useState(null);

  const fetchDatasetStats = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.get("http://localhost:5001/api/dataset/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDatasetStats(res.data);
    } catch (err) {
      console.error("Error fetching dataset stats", err);
    }
  };

  const handleDatasetUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return toast.error("Please select an image file first");
    
    setIsUploading(true);
    const token = localStorage.getItem("adminToken");
    const formData = new FormData();
    formData.append("image", uploadFile);
    formData.append("category", uploadCategory);

    try {
      await axios.post("http://localhost:5001/api/dataset/upload", formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data" 
        }
      });
      toast.success("Dataset image uploaded and labeled successfully!");
      setUploadFile(null);
      setUploadPreview(null);
      fetchDatasetStats();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to upload image to dataset");
    } finally {
      setIsUploading(false);
    }
  };

  const handleTriggerRetraining = async () => {
    setIsRetraining(true);
    setRetrainResults(null);
    const token = localStorage.getItem("adminToken");

    if (retrainResults?.valid_accuracy) {
      setOldAccuracy(retrainResults.valid_accuracy);
    } else {
      setOldAccuracy(77.8);
    }

    toast.loading("Running Enhanced AI Retraining Pipeline...", { id: "retrain" });

    try {
      const res = await axios.post("http://localhost:5001/api/model/retrain", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRetrainResults(res.data);
      toast.success("AI Model Retrained and Hot-Reloaded successfully! 🤖", { id: "retrain" });
      fetchDatasetStats();
    } catch (err) {
      toast.error(err.response?.data?.error || "Retraining failed", { id: "retrain" });
    } finally {
      setIsRetraining(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`);
      if (res.data && res.data.length > 0) {
        setMapCenter([parseFloat(res.data[0].lat), parseFloat(res.data[0].lon)]);
      } else {
        toast.error("Location not found");
      }
    } catch(err) {
      toast.error("Error searching location");
    }
  };

  useEffect(() => {
    fetchComplaints();
    fetchAlerts();
    fetchDatasetStats();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/alerts");
      setActiveAlerts(res.data);
    } catch (err) {
      console.error("Error fetching alerts", err);
    }
  };

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      // Getting all complaints for admin (bypassing 30-day filter for history)
      const res = await axios.get("http://localhost:5001/api/complaints");
      // Note: Backend might need a specific admin route to get ALL history, but we'll use the existing one for now.
      setComplaints(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        navigate("/");
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.patch(`http://localhost:5001/api/complaints/${id}/status`, 
        { status: newStatus, adminComments },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Status updated successfully!");
      setSelectedComplaint(null);
      setAdminComments("");
      fetchComplaints();
    } catch (err) {
      toast.error("Error updating status");
    }
  };

  const handleAIRecheck = async (id) => {
    try {
      const token = localStorage.getItem("adminToken");
      toast.loading("Re-analyzing image with AI...", { id: 'recheck' });
      const res = await axios.post(`http://localhost:5001/api/complaints/${id}/recheck`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("AI Recheck Complete!", { id: 'recheck' });
      fetchComplaints();
      if (selectedComplaint && selectedComplaint._id === id) {
        setSelectedComplaint(prev => ({ ...prev, aiAnalysis: res.data.aiAnalysis }));
      }
    } catch(err) {
      toast.error(err.response?.data?.error || "Error rechecking image", { id: 'recheck' });
    }
  };

  const handleDeleteAlert = async (id) => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.delete(`http://localhost:5001/api/alerts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Alert removed.");
      fetchAlerts();
    } catch(err) {
      toast.error("Failed to delete alert.");
    }
  };

  const handleSendAlert = async () => {
    if(!alertMessage) return toast.error("Message required");
    try {
      const token = localStorage.getItem("adminToken");
      await axios.post(`http://localhost:5001/api/alerts`, 
        { message: alertMessage, type: alertType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Global Alert Broadcasted!");
      setAlertMessage("");
      fetchAlerts();
    } catch(err) {
      toast.error("Failed to send alert.");
    }
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    navigate("/");
  };

  const filteredComplaints = complaints.filter(c => {
    if (activeTab === "active") return ["open", "in progress", "scheduled"].includes(c.status);
    if (activeTab === "history") return ["resolved", "rejected", "cancelled"].includes(c.status);
    return true; // map shows all
  });

  const mapFilteredComplaints = complaints.filter(c => {
    if (!c.location || !c.location.lat) return false;
    if (radiusKm === 0) return true;
    const dist = getDistance(mapCenter[0], mapCenter[1], parseFloat(c.location.lat), parseFloat(c.location.lng));
    return dist <= radiusKm;
  });

  const renderTable = (complaintsList) => (
    <div className="bg-white rounded-xl shadow-md border overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-500 border-b font-bold uppercase text-xs">
          <tr>
            <th className="p-4">Image</th>
            <th className="p-4">Tracking #</th>
            <th className="p-4">Location</th>
            <th className="p-4">Severity</th>
            <th className="p-4">Status</th>
            <th className="p-4">Submitted At</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {complaintsList.length === 0 && (
            <tr><td colSpan="7" className="p-8 text-center text-gray-500">No reports found.</td></tr>
          )}
          {complaintsList.map(c => (
            <tr key={c._id} className="hover:bg-gray-50">
              <td className="p-4">
                {c.imageUrl ? (
                  <a href={c.imageUrl} target="_blank" rel="noreferrer">
                    <img src={c.imageUrl} alt="Pothole" className="w-16 h-12 object-cover rounded shadow hover:scale-110 transition cursor-pointer" />
                  </a>
                ) : (
                  <div className="w-16 h-12 bg-gray-200 flex items-center justify-center rounded text-gray-400">
                    <ImageIcon size={20} />
                  </div>
                )}
              </td>
              <td className="p-4 font-semibold text-gray-700">{c.complaintId}</td>
              <td className="p-4 max-w-[150px] truncate" title={c.locationDesc}>{c.locationDesc || "Unknown Location"}</td>
              <td className="p-4">
                <div className="flex flex-col gap-1 w-24">
                  <span className="font-bold text-gray-700">{c.aiAnalysis?.damage_score}/100</span>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${c.aiAnalysis?.severity?.toLowerCase() === 'high' ? 'bg-red-500' : (c.aiAnalysis?.severity?.toLowerCase() === 'medium' ? 'bg-yellow-500' : 'bg-green-500')}`}
                      style={{ width: `${c.aiAnalysis?.damage_score}%` }}
                    ></div>
                  </div>
                </div>
              </td>
              <td className="p-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  c.status === 'resolved' || c.status === 'scheduled' ? 'bg-green-100 text-green-700' : 
                  (c.status === 'rejected' || c.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700')
                }`}>
                  {c.status}
                </span>
              </td>
              <td className="p-4 text-gray-500 whitespace-nowrap">{new Date(c.createdAt).toLocaleString()}</td>
              <td className="p-4">
                <button 
                  onClick={() => setSelectedComplaint(c)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold text-xs hover:bg-green-700"
                >
                  Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAIDatasetManager = () => (
    <div className="space-y-8 animate-fade-in">
      {/* Accuracy Header Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Active Model Info */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-6 -mt-6"></div>
          <div>
            <Cpu size={32} className="opacity-80 mb-4" />
            <h4 className="text-sm font-semibold opacity-85 uppercase tracking-wider">Active Road Damage Model</h4>
            <h3 className="text-2xl font-black mt-2">RandomForestClassifier</h3>
          </div>
          <div className="mt-6 flex justify-between items-center text-xs opacity-75">
            <span>Estimators: 150</span>
            <span>Hot-Reload Enabled</span>
          </div>
        </div>

        {/* Validation Accuracy Card */}
        <div className="bg-white rounded-2xl p-6 shadow-md border flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Model Validation Accuracy</h4>
              <h2 className="text-4xl font-extrabold text-gray-800 mt-2">
                {retrainResults?.valid_accuracy ? `${retrainResults.valid_accuracy}%` : "77.8%"}
              </h2>
            </div>
            <div className="bg-green-100 text-green-700 font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
              <TrendingUp size={12} /> Baseline
            </div>
          </div>
          {oldAccuracy && retrainResults?.valid_accuracy && (
            <div className="mt-4 text-sm text-gray-600">
              Compared to previous: <strong className={retrainResults.valid_accuracy >= oldAccuracy ? "text-green-600" : "text-red-500"}>
                {retrainResults.valid_accuracy >= oldAccuracy ? "+" : ""}{(retrainResults.valid_accuracy - oldAccuracy).toFixed(1)}%
              </strong>
            </div>
          )}
          <div className="mt-auto pt-4 text-xs text-gray-400 border-t">
            Measured against completely unseen validation samples.
          </div>
        </div>

        {/* Test Accuracy Card */}
        <div className="bg-white rounded-2xl p-6 shadow-md border flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Model Final Test Accuracy</h4>
              <h2 className="text-4xl font-extrabold text-gray-800 mt-2">
                {retrainResults?.test_accuracy ? `${retrainResults.test_accuracy}%` : "76.4%"}
              </h2>
            </div>
            <div className="bg-emerald-100 text-emerald-700 font-bold text-xs px-2.5 py-1 rounded-full">
              Final Exam
            </div>
          </div>
          <div className="mt-auto pt-4 text-xs text-gray-400 border-t">
            Evaluated against the final exam test partition.
          </div>
        </div>
      </div>

      {/* Dataset Statistics and Image Uploader */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Dataset Stats Table */}
        <div className="bg-white rounded-2xl p-6 shadow-md border flex flex-col">
          <div className="flex items-center gap-2 mb-6 border-b pb-4">
            <Database className="text-green-600" />
            <h3 className="text-lg font-bold text-gray-800">Training & Evaluation Dataset</h3>
          </div>
          
          {datasetStats ? (
            <div className="overflow-x-auto flex-1 flex flex-col justify-between">
              <table className="w-full text-left text-sm mb-6">
                <thead className="bg-gray-50 text-gray-500 border-b font-bold uppercase text-xs">
                  <tr>
                    <th className="p-3">Data Split</th>
                    <th className="p-3 text-center">Low (1)</th>
                    <th className="p-3 text-center">Medium (2)</th>
                    <th className="p-3 text-center">High (3)</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-700">
                  <tr>
                    <td className="p-3 font-semibold text-gray-800">Training Set (80%)</td>
                    <td className="p-3 text-center">{datasetStats.train['1']}</td>
                    <td className="p-3 text-center">{datasetStats.train['2']}</td>
                    <td className="p-3 text-center">{datasetStats.train['3']}</td>
                    <td className="p-3 text-right font-bold text-green-700">{datasetStats.train.total}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-gray-800">Validation Set (10%)</td>
                    <td className="p-3 text-center">{datasetStats.valid['1']}</td>
                    <td className="p-3 text-center">{datasetStats.valid['2']}</td>
                    <td className="p-3 text-center">{datasetStats.valid['3']}</td>
                    <td className="p-3 text-right font-bold text-yellow-700">{datasetStats.valid.total}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-gray-800">Testing Set (10%)</td>
                    <td className="p-3 text-center">{datasetStats.test['1']}</td>
                    <td className="p-3 text-center">{datasetStats.test['2']}</td>
                    <td className="p-3 text-center">{datasetStats.test['3']}</td>
                    <td className="p-3 text-right font-bold text-red-700">{datasetStats.test.total}</td>
                  </tr>
                  <tr className="bg-gray-50 font-bold">
                    <td className="p-3 text-gray-800">Grand Total</td>
                    <td className="p-3 text-center">{datasetStats.train['1'] + datasetStats.valid['1'] + datasetStats.test['1']}</td>
                    <td className="p-3 text-center">{datasetStats.train['2'] + datasetStats.valid['2'] + datasetStats.test['2']}</td>
                    <td className="p-3 text-center">{datasetStats.train['3'] + datasetStats.valid['3'] + datasetStats.test['3']}</td>
                    <td className="p-3 text-right text-gray-900">{datasetStats.grandTotal} images</td>
                  </tr>
                </tbody>
              </table>
              <div className="bg-green-50 text-green-800 border border-green-200 rounded-xl p-4 text-xs font-medium">
                💡 <strong>Best Practice:</strong> To keep model performance balanced, aim to maintain a similar count of images across all three severity classes.
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
              <RefreshCw className="animate-spin mb-4" size={24} />
              <span>Scanning directories for dataset counts...</span>
            </div>
          )}
        </div>

        {/* Dataset Image Uploader */}
        <div className="bg-white rounded-2xl p-6 shadow-md border">
          <div className="flex items-center gap-2 mb-6 border-b pb-4">
            <UploadCloud className="text-green-600" />
            <h3 className="text-lg font-bold text-gray-800">Expand Training Dataset</h3>
          </div>

          <form onSubmit={handleDatasetUpload} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Select Target Label (Class)</label>
              <select 
                value={uploadCategory} 
                onChange={e => setUploadCategory(e.target.value)}
                className="w-full border rounded-xl p-3 bg-white outline-none focus:ring-2 focus:ring-green-500 font-medium text-gray-700 shadow-sm"
              >
                <option value="1">Label 1: Low Damage (Cracks, Wear)</option>
                <option value="2">Label 2: Medium Damage (Developing Pothole)</option>
                <option value="3">Label 3: High Damage (Severe deep pothole)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Drop Training Image</label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-green-500 transition cursor-pointer relative bg-gray-50/50">
                {uploadPreview ? (
                  <div className="relative inline-block">
                    <img src={uploadPreview} alt="Upload Preview" className="mx-auto rounded-lg max-h-40 object-cover" />
                    <button 
                      type="button" 
                      onClick={() => { setUploadFile(null); setUploadPreview(null); }}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block w-full h-full py-4">
                    <UploadCloud className="mx-auto text-gray-400 mb-3" size={32} />
                    <span className="text-sm text-gray-600 font-medium block">Click to select image file</span>
                    <span className="text-xs text-gray-400 mt-1 block">Supports JPEG, PNG</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) {
                          setUploadFile(file);
                          setUploadPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isUploading || !uploadFile}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3.5 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow hover:shadow-green-100"
            >
              {isUploading ? <RefreshCw className="animate-spin" size={18} /> : null}
              {isUploading ? "Uploading..." : "Upload and Add to Dataset"}
            </button>
          </form>
        </div>
      </div>

      {/* Trigger Retraining Card */}
      <div className="bg-white rounded-2xl p-8 shadow-md border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
              <RefreshCw className={isRetraining ? "animate-spin text-green-600" : "text-green-600"} />
              Dynamic Model Retraining &amp; Hot-Reload
            </h3>
            <p className="text-sm text-gray-500 max-w-2xl">
              Initiates the Random Forest feature-extraction and training pipeline. The new model is automatically benchmarked against the validation and test splits, saved to disk, and loaded in memory with **zero downtime**.
            </p>
          </div>
          
          <button 
            onClick={handleTriggerRetraining}
            disabled={isRetraining}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-extrabold px-8 py-4 rounded-xl shadow-lg transition whitespace-nowrap flex items-center gap-3 shrink-0"
          >
            {isRetraining ? <RefreshCw className="animate-spin" size={20} /> : <Cpu size={20} />}
            {isRetraining ? "Retraining AI..." : "Retrain AI Model Now"}
          </button>
        </div>

        {/* Retraining Results Logs */}
        {retrainResults && (
          <div className="mt-8 border-t pt-6 space-y-4">
            <h4 className="text-sm font-bold text-gray-700">Retraining Pipeline Results Log:</h4>
            <div className="bg-gray-900 text-green-400 font-mono text-xs rounded-xl p-5 overflow-x-auto space-y-2.5 shadow-inner border border-gray-800">
              <div className="flex items-center gap-2 text-green-500 font-bold border-b border-gray-800 pb-2 mb-2">
                <CheckCircle2 size={14} /> Pipeline Executed Successfully!
              </div>
              <p>&gt; Staging directories scanned: Dataset/train, Dataset/valid, Dataset/test</p>
              <p>&gt; Extracted features: Edge Density (Canny) &amp; Color Histograms (RGB)</p>
              <p>&gt; Random Forest model fit complete with {retrainResults.train_size} active training items.</p>
              <p>&gt; Hot-reload complete: active in-memory weights loaded into Python API.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-800 text-white font-semibold">
                <p>📊 Train Accuracy: {retrainResults.train_accuracy}%</p>
                <p>📈 Validation Accuracy: {retrainResults.valid_accuracy}%</p>
                <p>🧪 Test Accuracy: {retrainResults.test_accuracy}%</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-white px-8 py-4 flex justify-between items-center shadow-sm border-b">
        <div className="flex items-center gap-2">
          <Shield className="text-green-600" fill="#16a34a" size={24} />
          <span className="text-xl font-bold text-green-700">RoadWatch</span>
          <span className="text-gray-500 font-medium ml-2">Admin Dashboard</span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium">
          <button onClick={() => setIsAlertModalOpen(true)} className="bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-200">
            <AlertTriangle size={16}/> Broadcast Alert
          </button>
          <a href="http://localhost:5173" target="_blank" rel="noreferrer" className="text-gray-600 hover:text-green-600 flex items-center gap-1">
            Citizen Portal <ExternalLink size={14}/>
          </a>
          <button onClick={logout} className="text-gray-500 hover:text-gray-700">Logout</button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Submitted Reports</h1>
          <p className="text-gray-500">A complete overview of all infrastructure reports submitted by citizens.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button 
            className={`pb-3 px-4 font-semibold text-sm ${activeTab === 'active' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('active')}
          >
            Active Reports
          </button>
          <button 
            className={`pb-3 px-4 font-semibold text-sm ${activeTab === 'history' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('history')}
          >
            History / Resolved
          </button>
          <button 
            className={`pb-3 px-4 font-semibold text-sm ${activeTab === 'map' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('map')}
          >
            Live Map View
          </button>
          <button 
            className={`pb-3 px-4 font-semibold text-sm ${activeTab === 'ai' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('ai')}
          >
            🤖 AI &amp; Dataset Manager
          </button>
        </div>

        {activeTab === 'map' ? (
          <div className="bg-white p-4 rounded-xl shadow-md border overflow-hidden flex flex-col gap-4">
            <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border">
              <input 
                type="text" 
                placeholder="Search location..." 
                className="px-4 py-2 border rounded-lg flex-1 outline-none focus:ring-2 focus:ring-green-500"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 whitespace-nowrap flex items-center gap-2">
                <SearchIcon size={18} /> Search
              </button>
              
              <div className="h-8 w-px bg-gray-300 mx-2"></div>
              
              <label className="font-semibold text-gray-700 whitespace-nowrap">Radius Filter:</label>
              <select 
                className="px-4 py-2 border rounded-lg bg-white outline-none text-gray-700 font-medium"
                value={radiusKm}
                onChange={e => setRadiusKm(Number(e.target.value))}
              >
                <option value={0}>Show All (No Radius)</option>
                <option value={5}>Within 5 km</option>
                <option value={10}>Within 10 km</option>
                <option value={15}>Within 15 km</option>
              </select>
            </div>

            <MapContainer center={mapCenter} zoom={12} style={{ height: "600px", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapController center={mapCenter} />
              {radiusKm > 0 && <Circle center={mapCenter} radius={radiusKm * 1000} pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.1 }} />}
              
              <MarkerClusterGroup chunkedLoading>
                {mapFilteredComplaints.map(c => (
                  <Marker 
                    key={c._id} 
                    position={[parseFloat(c.location.lat), parseFloat(c.location.lng)]}
                    icon={getMarkerIcon(c.aiAnalysis?.severity?.toLowerCase(), c.status)}
                  >
                    <Popup>
                      <strong>{c.complaintId}</strong><br/>
                      Status: {c.status}<br/>
                      Severity: {c.aiAnalysis?.severity}
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>
            </MapContainer>
            
            <div className="mt-4">
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                Reports {radiusKm === 0 ? 'All Ranges' : `Within ${radiusKm} km`} ({mapFilteredComplaints.length})
              </h3>
              {renderTable(mapFilteredComplaints)}
            </div>
          </div>
        ) : activeTab === 'ai' ? (
          renderAIDatasetManager()
        ) : (
          renderTable(filteredComplaints)
        )}
      </main>

      {/* Action Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Review Report: {selectedComplaint.complaintId}</h3>
            
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-600 mb-1">Description:</p>
              <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg border">{selectedComplaint.description}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-600 mb-2">Admin Comments (sent to user)</label>
              <textarea 
                className="w-full border rounded-lg p-3 text-sm focus:ring-green-500 outline-none h-24"
                placeholder="Enter resolution notes, scheduling details, or rejection reasons..."
                value={adminComments}
                onChange={e => setAdminComments(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button onClick={() => handleStatusChange(selectedComplaint.complaintId, 'in progress')} className="bg-blue-100 text-blue-700 font-bold py-2 rounded-lg hover:bg-blue-200">
                Mark In Progress
              </button>
              <button onClick={() => handleStatusChange(selectedComplaint.complaintId, 'resolved')} className="bg-green-100 text-green-700 font-bold py-2 rounded-lg hover:bg-green-200">
                Mark Resolved
              </button>
              <button onClick={() => handleStatusChange(selectedComplaint.complaintId, 'cancelled')} className="bg-red-100 text-red-700 font-bold py-2 rounded-lg hover:bg-red-200">
                Cancel / Reject
              </button>
              <button onClick={() => handleAIRecheck(selectedComplaint._id)} className="bg-purple-100 text-purple-700 font-bold py-2 rounded-lg hover:bg-purple-200">
                AI Recheck
              </button>
            </div>

            <button onClick={() => {setSelectedComplaint(null); setAdminComments("")}} className="w-full border-2 border-gray-200 text-gray-600 font-bold py-2 rounded-lg hover:bg-gray-50">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Global Alert Modal */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center gap-2 mb-4 text-red-600 font-bold text-xl">
              <AlertTriangle size={24} /> Broadcast SOS
            </div>
            
            <div className="overflow-y-auto mb-4 border-b pb-4">
              <h4 className="text-sm font-bold text-gray-700 mb-2">Active Broadcasts</h4>
              {activeAlerts.length === 0 && <p className="text-xs text-gray-400">No active alerts.</p>}
              {activeAlerts.map(a => (
                <div key={a._id} className="flex justify-between items-center bg-gray-50 p-2 rounded mb-2 border text-sm">
                  <span className="truncate flex-1 font-medium mr-2">{a.message}</span>
                  <button onClick={() => handleDeleteAlert(a._id)} className="text-red-500 hover:text-red-700 font-bold text-xs">Delete</button>
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-500 mb-4">Display an emergency alert to all connected citizens on the public portal.</p>
            
            <label className="block text-sm font-bold text-gray-700 mb-1">Message</label>
            <textarea 
              className="w-full border rounded-lg p-3 text-sm focus:ring-red-500 outline-none h-20 mb-4"
              placeholder="e.g. Severe flooding on Main St. Avoid area."
              value={alertMessage}
              onChange={e => setAlertMessage(e.target.value)}
            />

            <label className="block text-sm font-bold text-gray-700 mb-1">Alert Type</label>
            <select className="w-full border rounded-lg p-2 mb-6" value={alertType} onChange={e => setAlertType(e.target.value)}>
              <option value="warning">Warning / Bad Road</option>
              <option value="emergency">Emergency / SOS</option>
            </select>

            <div className="flex gap-3 mt-auto">
              <button onClick={() => setIsAlertModalOpen(false)} className="flex-1 border text-gray-600 font-bold py-2 rounded-lg hover:bg-gray-50">Close</button>
              <button onClick={handleSendAlert} className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700">Broadcast</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
