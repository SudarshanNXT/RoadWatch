import { Camera, Search, ShieldAlert } from "lucide-react";
import worker from "../assets/worker.jpeg";

function Hero() {

  const scrollToReport = () => {
    document.getElementById("report-section").scrollIntoView({
      behavior: "smooth",
    });
  };

  const scrollToTrack = () => {
    document.getElementById("track-section").scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <section id="home-section" className="bg-gradient-to-br from-green-800 to-green-900 text-white px-8 lg:px-20 py-24 flex flex-col lg:flex-row justify-between items-center gap-16 relative overflow-hidden">
      
      {/* Dynamic Background Pattern */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "30px 30px" }}></div>

      {/* LEFT SIDE */}
      <div className="max-w-2xl relative z-10">
        <div className="inline-flex items-center gap-2 bg-green-700 border border-green-600 px-4 py-2 rounded-full text-sm font-semibold tracking-wide mb-6">
          <ShieldAlert size={16} className="text-orange-400" />
          <span className="text-green-50">State-of-the-art Infrastructure Analytics</span>
        </div>

        <h1 className="text-5xl lg:text-7xl font-extrabold mt-4 leading-tight tracking-tight">
          Report Road Damage.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">
            Accelerate the Fix.
          </span>
        </h1>

        <p className="mt-6 text-lg lg:text-xl text-green-100 leading-relaxed font-light">
          RoadWatch leverages next-generation computer vision to instantly analyze, categorize, and route your infrastructure reports directly to municipal maintenance teams, ensuring a safer commute for everyone.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <button
            onClick={scrollToReport}
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 px-8 py-4 rounded-xl font-bold shadow-xl shadow-orange-900/20 transition-all hover:-translate-y-1"
          >
            <Camera size={22} />
            Report Issue Now
          </button>

          <button
            onClick={scrollToTrack}
            className="flex items-center justify-center gap-2 bg-green-800 border border-green-600 px-8 py-4 rounded-xl font-bold hover:bg-green-700 transition-all text-white"
          >
            <Search size={22} />
            Track Existing Report
          </button>
        </div>
      </div>

      {/* RIGHT SIDE IMAGE WITH FRAME */}
      <div className="relative z-10 w-full lg:w-auto flex justify-center">
        
        {/* Outer Soft Frame & Glow */}
        <div className="absolute -inset-4 bg-gradient-to-tr from-green-400 to-orange-400 opacity-20 blur-2xl rounded-[3rem]"></div>
        
        {/* Decorative Elements */}
        <div className="absolute -top-6 -left-6 w-24 h-24 bg-green-500 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-orange-500 rounded-full opacity-20 blur-xl"></div>

        {/* Main Image */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 rotate-1 hover:rotate-0 transition-transform duration-500">
          <img
            src={worker}
            alt="Workers repairing road infrastructure using modern tools"
            className="w-full max-w-[500px] h-auto object-cover transform scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6">
            <p className="text-white font-semibold text-lg">AI-powered tracking in action</p>
            <div className="w-full h-1 bg-white/30 rounded mt-2 overflow-hidden">
               <div className="w-3/4 h-full bg-orange-500 shadow-md"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
