import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfileAPI, logout } from "../utils/api";
import "../css/dashboard.css";

function Welcome() {
  const navigate = useNavigate();
  const username = localStorage.getItem("loggedInUser");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (username) {
        const res = await getProfileAPI(username);
        if (res.success) {
          setUserData(res.data);
        }
      }
      setLoading(false);
    };
    fetchUserData();
  }, [username]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const calculateCompletion = () => {
    if (!userData) return 0;
    const fields = ['skills', 'domain', 'experience', 'availability', 'fullName', 'location', 'about'];
    const filledFields = fields.filter(field => userData[field] && userData[field] !== "");
    return Math.round((filledFields.length / fields.length) * 100);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f8faff" }}>
        <p style={{ fontSize: "1.2rem", color: "#6366f1" }}>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">Cofounder.</div>
        <ul className="nav-menu">
          <li className="nav-item active" onClick={() => navigate("/welcome")}>
            <span>🏠</span> Dashboard
          </li>
          <li className="nav-item" onClick={() => navigate("/profile")}>
            <span>👤</span> My Profile
          </li>
          <li className="nav-item" onClick={() => navigate("/find")}>
            <span>🔍</span> Find Partners
          </li>
          <li className="nav-item" onClick={() => navigate("/messages")}>
            <span>💬</span> Messages
          </li>
        </ul>
        <div className="nav-item logout-item" onClick={handleLogout}>
          <span>🚪</span> Logout
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header-section">
          <div className="welcome-text">
            <h1>Hello, {username}!</h1>
            <p>Here's what's happening with your {userData?.role || 'startup'} journey today.</p>
          </div>
          <div className="user-badge">
            <div className="badge-dot"></div>
            <span>{userData?.role || 'Member'}</span>
          </div>
        </header>

        {/* Stats Section */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon" style={{ backgroundColor: "rgba(99, 102, 241, 0.1)", color: "#6366f1" }}>🛡️</div>
            </div>
            <div className="stat-value">{userData?.verified ? "Verified" : "Pending"}</div>
            <div className="stat-label">Email Status</div>
          </div>
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>📜</div>
            </div>
            <div className="stat-value">{userData?.certificateApproved ? "Approved" : "Under Review"}</div>
            <div className="stat-label">Certificate Status</div>
          </div>
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>🤝</div>
            </div>
            <div className="stat-value">0</div>
            <div className="stat-label">Connections Made</div>
          </div>
        </section>

        {/* Action Banner */}
        <div className="action-banner">
          <div className="action-text">
            <h2>Complete Your Startup Profile</h2>
            <p>A complete profile gets 3x more interests from potential co-founders. Tell the world about your vision!</p>
          </div>
          <button className="action-btn" onClick={() => navigate("/profile")}>Edit Profile</button>
        </div>

        {/* Progress Tracker */}
        <div className="progress-section">
          <div className="progress-header">
            <h3>Profile Completion</h3>
            <span>{calculateCompletion()}%</span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${calculateCompletion()}%` }}
            ></div>
          </div>
          <p style={{ marginTop: "15px", fontSize: "0.875rem", color: "#64748b" }}>
            Tip: Add your WhatsApp and LinkedIn to make it easier for partners to reach out.
          </p>
        </div>
      </main>
    </div>
  );
}

export default Welcome;
