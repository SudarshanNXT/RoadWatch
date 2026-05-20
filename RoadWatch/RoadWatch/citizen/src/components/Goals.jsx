import { Target, TrendingUp, BarChart3, Users } from "lucide-react";

function Goals() {
  const goals = [
    {
      title: "Early Hazard Detection",
      description: "Identifying micro-fractures and minor potholes before they degrade into critical structural failures.",
      icon: <Target size={24} className="text-blue-600" />
    },
    {
      title: "Budget Optimization",
      description: "Allocating municipal resources dynamically based on AI-verified severity metrics to maximize ROI.",
      icon: <TrendingUp size={24} className="text-green-600" />
    },
    {
      title: "Data-Driven Decisions",
      description: "Generating comprehensive heatmaps and longitudinal reports to forecast infrastructure decay.",
      icon: <BarChart3 size={24} className="text-orange-600" />
    },
    {
      title: "Community Synergy",
      description: "Fostering transparent communication pipelines directly back to the civilians reporting the faults.",
      icon: <Users size={24} className="text-purple-600" />
    },
  ];

  return (
    <section className="px-8 lg:px-20 py-24 bg-gray-50 border-t border-gray-200">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <span className="text-green-600 font-bold tracking-wider uppercase text-sm mb-2 block">Our Mission</span>
        <h2 className="text-4xl font-extrabold text-gray-900">Strategic Objectives</h2>
        <p className="mt-4 text-lg text-gray-600">
          Our methodology is driven by four core pillars that ensure precision, efficiency, and scale in modern infrastructure management.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {goals.map((goal, i) => (
          <div
            key={i}
            className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition duration-300"
          >
            <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center mb-6 border border-gray-100">
              {goal.icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{goal.title}</h3>
            <p className="text-gray-600 leading-relaxed text-sm">{goal.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Goals;
