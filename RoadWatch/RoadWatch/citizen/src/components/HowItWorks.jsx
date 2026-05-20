import { UploadCloud, Cpu, PenTool } from "lucide-react";

function HowItWorks() {
  return (
    <section className="px-8 lg:px-20 py-24 bg-white">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-4">How RoadWatch Operates</h2>
        <p className="text-lg text-gray-600">
          A seamless, three-step automated pipeline connecting citizens directly to structural engineering workflows.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-12 max-w-6xl mx-auto relative">
        {/* Decorative connecting line behind steps (desktop only) */}
        <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-[2px] bg-gray-100 -z-10"></div>

        {/* Step 1 */}
        <div className="flex-1 text-center bg-white z-10">
          <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-100 relative">
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm border-4 border-white">1</div>
            <UploadCloud size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Capture & Submit</h3>
          <p className="text-gray-600 text-sm leading-relaxed px-4">
            Spot a hazard on the road? Snap a picture or upload an image directly from your device. 
            Our geolocation algorithms automatically attach precise GPS coordinates to your submission.
          </p>
        </div>

        {/* Step 2 */}
        <div className="flex-1 text-center bg-white z-10">
          <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-orange-100 relative">
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm border-4 border-white">2</div>
            <Cpu size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">AI Deep Analysis</h3>
          <p className="text-gray-600 text-sm leading-relaxed px-4">
            The image is fed into our computer vision engine, where it instantly predicts severity, 
            generates a continuous damage score (0-100), and categorizes the fault level.
          </p>
        </div>

        {/* Step 3 */}
        <div className="flex-1 text-center bg-white z-10">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-100 relative">
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm border-4 border-white">3</div>
            <PenTool size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Dispatch & Resolve</h3>
          <p className="text-gray-600 text-sm leading-relaxed px-4">
            High-severity issues are flagged immediately on the secure administrative dashboard. 
            Once maintenance crews complete repairs, citizens receive automated email confirmations.
          </p>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
