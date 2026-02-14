import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Standard application imports
import Landing from "./components/Landing";
import Login from "./components/Login";
import Signup from "./components/Signup";
import OTP from "./components/OTP";
import Profile from "./components/Profile";
import Admin from "./components/Admin";
import FindCoFounder from "./components/FindCoFounder";
import Welcome from "./components/Welcome";
import Messages from "./components/Messages";

function App() {
  const getUser = () => localStorage.getItem("loggedInUser");
  const getEmail = () => localStorage.getItem("userEmail");
  const isAdmin = () => {
    const user = getUser();
    const email = getEmail()?.toLowerCase();
    const role = localStorage.getItem("userRole");
    const adminEmails = ["appadmin@gmail.com", "admin@example.com"];
    return user && (adminEmails.includes(email) || role === "admin");
  };

  return (
    <Router>
      <Routes>
        {/* Root Path Redirection */}
        <Route path="/" element={<Landing />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/otp" element={<OTP />} />

        {/* Protected Regular User Routes */}
        <Route path="/profile" element={getUser() ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/find" element={<FindCoFounder />} />
        <Route path="/welcome" element={getUser() ? <Welcome /> : <Navigate to="/login" />} />
        <Route path="/messages" element={getUser() ? <Messages /> : <Navigate to="/login" />} />

        {/* Protected Admin Route */}
        <Route path="/admin" element={isAdmin() ? <Admin /> : <Navigate to="/welcome" />} />

        {/* Catch-all Route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
