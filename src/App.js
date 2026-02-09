import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./components/Login";
import Signup from "./components/Signup";
import OTP from "./components/OTP";
import Profile from "./components/Profile";
import Admin from "./components/Admin";
import FindCoFounder from "./components/FindCoFounder";
import Welcome from "./components/Welcome";

function App() {
  const getUser = () => localStorage.getItem("loggedInUser");
  const getEmail = () => localStorage.getItem("userEmail");
  const isAdmin = () => getEmail() === "appadmin@gmail.com";

  return (
    <Router>
      <Routes>
        <Route path="/" element={getUser() ? <Navigate to="/welcome" /> : <Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/otp" element={<OTP />} />
        <Route path="/profile" element={getUser() ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/find" element={getUser() ? <FindCoFounder /> : <Navigate to="/login" />} />
        <Route path="/admin" element={isAdmin() ? <Admin /> : <Navigate to="/login" />} />
        <Route path="/welcome" element={getUser() ? <Welcome /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
