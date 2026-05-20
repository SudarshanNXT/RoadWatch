import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FileSearch, Clock, CheckCircle, ShieldAlert } from 'lucide-react';

function TrackReport() {
  const [trackId, setTrackId] = useState("");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async () => {
    if (!trackId.trim()) return toast.error("Please enter a tracking number!");
    
    setLoading(true);
    setReportData(null);
    try {
      const res = await axios.get(`http://localhost:5001/api/complaints/track/${trackId.trim()}`);
      setReportData(res.data);
      toast.success("Report found!");
    } catch (err) {
      toast.error("Tracking ID not found or Invalid.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="track-section" className="px-20 py-20 bg-gray-50 flex flex-col items-center">
      <h2 className="text-4xl font-bold mb-6 text-center">Track Your Report</h2>
      <p className="text-gray-500 mb-8 max-w-xl text-center">Enter the RW-XXXX tracking ID emailed to you to monitor your complaint's live status.</p>

      <div className="flex justify-center gap-4 w-full max-w-xl mb-10 shadow-lg select-none duration-200">
        <input
          type="text"
          placeholder="e.g. RW-A1B2C3D4"
          className="border border-gray-300 p-4 flex-1 rounded-l-xl outline-none focus:ring-2 focus:ring-green-500 text-lg uppercase font-mono"
          value={trackId}
          onChange={(e) => setTrackId(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
        />
        <button 
          onClick={handleTrack} 
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-r-xl font-bold text-lg flex items-center gap-2 transition"
        >
          <FileSearch size={24} />
          {loading ? 'Searching...' : 'Track'}
        </button>
      </div>

      {reportData && (
        <div className="bg-white border p-8 rounded-2xl shadow-xl w-full max-w-2xl text-left transition-all duration-500">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{reportData.complaintId}</h3>
              <p className="text-gray-500 font-medium">{new Date(reportData.createdAt).toLocaleDateString()}</p>
            </div>
            <div className={`px-4 py-2 rounded-full font-bold shadow-sm uppercase text-sm ${
              reportData.status === 'resolved' ? 'bg-white border-2 border-green-500 text-green-600' :
              reportData.status === 'in progress' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {reportData.status}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-3 bg-gray-100 rounded-lg"><Clock className="text-gray-600" size={20} /></span>
              <div>
                <p className="text-sm font-bold text-gray-500">LAST UPDATED</p>
                <p className="text-lg font-medium text-gray-800">{new Date(reportData.updatedAt).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="p-3 bg-red-100 rounded-lg"><ShieldAlert className="text-red-500" size={20} /></span>
              <div>
                <p className="text-sm font-bold text-gray-500">AI SEVERITY CHECK</p>
                <p className="text-lg font-bold text-gray-800 uppercase">{reportData.aiAnalysis?.severity}</p>
              </div>
            </div>
          </div>

          {reportData.adminComments && (
            <div className="mt-8 bg-blue-50 p-6 rounded-xl border border-blue-200">
              <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><CheckCircle size={18}/> Admin Remarks:</h4>
              <p className="text-blue-900 font-medium">{reportData.adminComments}</p>
            </div>
          )}

          {reportData.imageUrl && (
            <div className="mt-6 border-t pt-6">
              <p className="text-sm font-bold text-gray-500 mb-3 uppercase">Attached Evidence</p>
              <img src={reportData.imageUrl} alt="Complaint Evidence" className="w-full max-h-64 object-cover rounded-xl shadow-md" />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default TrackReport;
