import { useState, useEffect } from "react";
import axios from "axios";
import { Toaster, toast } from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Goals from "./components/Goals";
import HowItWorks from "./components/HowItWorks";
import ReportForm from "./components/ReportForm";
import TrackReport from "./components/TrackReport";
import MapView from "./components/MapView";
import RecentReports from "./components/RecentReports";
import Footer from "./components/Footer";

function App() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5001/api/alerts")
      .then(res => {
        if (res.data && res.data.length > 0) {
          setAlerts(res.data);
          toast.error(`Emergency: ${res.data[0].message}`, { duration: 10000, icon: '🚨' });
        }
      })
      .catch(err => console.error("Could not fetch alerts"));
  }, []);

  return (
    <div className="font-sans">
      <Toaster position="top-center" toastOptions={{ style: { fontWeight: 'bold' } }} />
      {alerts.length > 0 && (
        <div className="bg-red-600 text-white p-3 text-center font-bold flex items-center justify-center gap-2 shadow-lg animate-pulse">
          <AlertTriangle size={24} />
          {alerts[0].message}
        </div>
      )}
      <Navbar />
      <Hero />
      <HowItWorks />
      <ReportForm />
      <MapView/>
      <TrackReport />
      <RecentReports />
      <About />
      <Goals />
      <Footer />
    </div>
  );
}

export default App;
