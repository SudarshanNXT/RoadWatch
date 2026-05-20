import { Activity, ShieldCheck, Zap } from "lucide-react";

function About() {
  return (
    <section id="about-section" className="px-8 lg:px-20 py-20 bg-white text-center">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-extrabold mb-6 text-gray-900 tracking-tight">About RoadWatch</h2>
        <p className="text-lg text-gray-600 mb-12 leading-relaxed">
          At RoadWatch, we stand at the intersection of civic engagement and artificial intelligence. 
          Our platform is designed to seamlessly bridge the communication gap between citizens and municipal maintenance 
          teams. By utilizing state-of-the-art computer vision models, we rapidly assess, categorize, and prioritize 
          infrastructure damage, ensuring that high-severity hazards are addressed before they cause harm.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-10 max-w-6xl mx-auto">
        <div className="bg-green-50 p-8 rounded-2xl border border-green-100 hover:shadow-lg transition">
          <div className="bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6">
            <Zap size={28} />
          </div>
          <h3 className="text-xl font-bold mb-3 text-gray-800">Real-Time Processing</h3>
          <p className="text-gray-600 text-sm">
            Leveraging our microservices architecture, reports are instantly transmitted, analyzed, and mapped 
            onto administrative dashboards within seconds of submission.
          </p>
        </div>

        <div className="bg-orange-50 p-8 rounded-2xl border border-orange-100 hover:shadow-lg transition">
          <div className="bg-orange-500 text-white w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6">
            <Activity size={28} />
          </div>
          <h3 className="text-xl font-bold mb-3 text-gray-800">Computer Vision Analysis</h3>
          <p className="text-gray-600 text-sm">
            Our proprietary PyTorch convolutional neural networks scan uploaded images to accurately detect 
            pothole dimensions, estimating depth and structural threat levels.
          </p>
        </div>

        <div className="bg-blue-50 p-8 rounded-2xl border border-blue-100 hover:shadow-lg transition">
          <div className="bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={28} />
          </div>
          <h3 className="text-xl font-bold mb-3 text-gray-800">Secure & Transparent</h3>
          <p className="text-gray-600 text-sm">
            From JWT-secured administrative hubs to citizen email pipelines, every interaction is 
            authenticated, ensuring public data integrity and administrative transparency.
          </p>
        </div>
      </div>
    </section>
  );
}

export default About;
