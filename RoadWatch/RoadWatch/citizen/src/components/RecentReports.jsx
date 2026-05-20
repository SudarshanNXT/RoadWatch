import { useState, useEffect } from "react";
import axios from "axios";

function RecentReports() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await axios.get("http://localhost:5001/api/complaints");
        setComplaints(response.data);
      } catch (err) {
        console.error("Error fetching complains", err);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  return (
    <section className="px-20 py-20 bg-gray-100">
      <h2 className="text-4xl font-bold text-center mb-10">
        Recent Reports
      </h2>

      {loading ? (
        <div className="text-center">Loading reports...</div>
      ) : complaints.length === 0 ? (
        <div className="text-center text-gray-500">No reports found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {complaints.map((c) => (
            <div key={c.complaintId} className="bg-white p-6 rounded-xl shadow border-l-4" style={{ 
              borderColor: c.status === 'resolved' ? '#9ca3af' : (c.aiAnalysis?.severity?.toLowerCase() === 'high' ? '#ef4444' : (c.aiAnalysis?.severity?.toLowerCase() === 'medium' ? '#f59e0b' : '#22c55e'))
             }}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg truncate" title={c.locationDesc || "Unknown Location"}>
                  {c.locationDesc || "Unknown Location"}
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full uppercase font-bold ${
                  c.status === 'resolved' ? 'bg-gray-200 text-gray-700' : 
                  (c.status === 'in progress' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700')
                }`}>
                  {c.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-4">{new Date(c.createdAt).toLocaleDateString()}</p>
              <p className="text-sm text-gray-700 mb-4 line-clamp-2">{c.description}</p>
              
              <div className="flex justify-between items-center text-sm border-t pt-4 mt-auto">
                <span className="font-medium text-gray-600">ID: {c.complaintId}</span>
                <span className={`font-bold ${
                  c.aiAnalysis?.severity?.toLowerCase() === 'high' ? 'text-red-500' : 
                  (c.aiAnalysis?.severity?.toLowerCase() === 'medium' ? 'text-yellow-500' : 'text-green-500')
                }`}>
                  Severity: {c.aiAnalysis?.severity?.toUpperCase() || 'N/A'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default RecentReports;
