import logo from "../assets/logo.jpeg";

function Navbar() {

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    section?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <nav className="flex justify-between items-center px-10 py-4 shadow-md bg-white sticky top-0 z-50">
      
      {/* LEFT LOGO */}
      <div className="flex items-center gap-3">
        <img src={logo} alt="logo" className="w-10 h-10" />
        <div>
          <h1 className="text-2xl font-bold text-green-600">RoadWatch</h1>
          <p className="text-sm text-gray-500">AI-Powered Infrastructure</p>
        </div>
      </div>

      {/* NAV LINKS */}
      <ul className="flex gap-8 font-medium text-gray-700">
        <li
          onClick={() => scrollToSection("home-section")}
          className="hover:text-green-600 cursor-pointer transition"
        >
          Home
        </li>

        <li
          onClick={() => scrollToSection("report-section")}
          className="hover:text-green-600 cursor-pointer transition"
        >
          Report Issue
        </li>

        <li
          onClick={() => scrollToSection("track-section")}
          className="hover:text-green-600 cursor-pointer transition"
        >
          Track Report
        </li>

        <li
          onClick={() => scrollToSection("about-section")}
          className="hover:text-green-600 cursor-pointer transition"
        >
          About
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
