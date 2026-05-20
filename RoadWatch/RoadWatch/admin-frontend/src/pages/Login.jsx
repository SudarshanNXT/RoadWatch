import { useState } from "react";
import { Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [deptId, setDeptId] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await axios.post("http://localhost:5001/api/admin/login", { email, password });
        localStorage.setItem("adminToken", res.data.token);
        navigate("/dashboard");
      } else {
        await axios.post("http://localhost:5001/api/admin/signup", { email, password, deptId });
        alert("Signup successful, please login.");
        setIsLogin(true);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Error occurred");
    }
  };

  return (
    <div className="min-h-screen flex text-gray-800">
      {/* Left green panel */}
      <div className="hidden lg:flex w-1/2 bg-green-600 flex-col justify-center items-center text-white px-12">
        <div className="w-24 h-24 bg-green-500 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
          <Shield size={48} className="text-white" fill="white" />
        </div>
        <h1 className="text-4xl font-bold mb-4 text-center">Admin Access</h1>
        <p className="text-lg text-center font-medium max-w-md">
          Manage road damage reports and coordinate maintenance efforts
        </p>
      </div>

      {/* Right login panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-8 bg-white">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-12">
            <Shield className="text-green-600" fill="#16a34a" size={24} />
            <span className="text-xl font-bold text-green-700">RoadWatch</span>
          </div>

          <h2 className="text-3xl font-bold mb-2 text-gray-900">
            {isLogin ? "Welcome back!" : "Create an account"}
          </h2>
          <p className="text-gray-500 mb-8 font-medium">
            {isLogin ? "Sign in to your admin account to manage infrastructure reports" : "Sign up to track and manage issues"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input 
                type="email" 
                placeholder="Email or Username" 
                className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {!isLogin && (
              <div>
                <input 
                  type="text" 
                  placeholder="Department ID" 
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
                  value={deptId}
                  onChange={(e) => setDeptId(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <input 
                type="password" 
                placeholder="Password" 
                className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <a href="#" className="text-sm font-semibold text-green-600 hover:underline">Forgot Password?</a>
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-lg shadow-md transition duration-200"
            >
              {isLogin ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-medium">
            <span className="text-gray-500">{isLogin ? "Need an account? " : "Already have an account? "}</span>
            <button onClick={() => setIsLogin(!isLogin)} className="text-green-600 font-semibold hover:underline">
              {isLogin ? "Sign Up" : "Log In"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
