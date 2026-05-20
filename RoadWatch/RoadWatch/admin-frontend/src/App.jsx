import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function App() {
  const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem("adminToken");
    return token ? children : <Navigate to="/" />;
  };

  return (
    <Router>
      <Toaster position="top-center" toastOptions={{ style: { fontWeight: 'bold' } }} />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
