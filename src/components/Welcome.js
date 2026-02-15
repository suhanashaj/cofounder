import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUserProfile, logout, syncEmailVerification, getUnreadCounts } from "../utils/api";
import "../css/dashboard.css";

function Welcome() {
  const navigate = useNavigate();
  const username = localStorage.getItem("loggedInUser");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      if (username) {
        try {
          // Parallel execution for faster loading
          const [syncResult, profileResult] = await Promise.all([
            syncEmailVerification(),
            getCurrentUserProfile()
          ]);

          if (profileResult.success) {
            setUserData(profileResult.data);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      setLoading(false);
    };

    // Set a maximum loading time of 3 seconds
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    fetchUserData();

    return () => clearTimeout(loadingTimeout);
  }, [username]);

  // Poll for unread messages - reduced frequency
  useEffect(() => {
    const fetchUnread = async () => {
      if (username) {
        try {
          const counts = await getUnreadCounts(username);
          const total = Object.values(counts).reduce((a, b) => a + b, 0);
          setUnreadCount(total);
        } catch (error) {
          console.error("Error fetching unread counts:", error);
        }
      }
    };
    fetchUnread(); // Initial fetch
    const interval = setInterval(fetchUnread, 30000); // Poll every 30s instead of 5s
    return () => clearInterval(interval);
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
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        background: "var(--primary-bg)",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999,
        overflow: "hidden"
      }}>
        <div className="loader-aura"></div>
        <p style={{ fontSize: "1.2rem", color: "var(--accent-color)", fontWeight: "800", letterSpacing: "4px", zIndex: 10, animation: "pulse 2s infinite", textAlign: "center", padding: "0 20px" }}>
          INITIALIZING SECURE DASHBOARD...
        </p>
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
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
              <span>💬 Messages</span>
              {unreadCount > 0 && (
                <span style={{ background: "#ef4444", color: "white", fontSize: "0.7rem", padding: "2px 6px", borderRadius: "10px", marginLeft: "8px" }}>
                  {unreadCount}
                </span>
              )}
            </div>
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
        <div className="stat-card" style={{ marginTop: "24px", padding: "32px", borderRadius: "32px" }}>
          <div className="progress-header" style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "1.25rem", margin: 0, color: "white" }}>Profile Completion</h3>
            <span style={{ fontSize: "1.5rem", fontWeight: "900", color: "var(--accent-color)" }}>{calculateCompletion()}%</span>
          </div>
          <div className="progress-bar-container" style={{ height: "12px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "10px", overflow: "hidden" }}>
            <div
              className="progress-bar-fill"
              style={{ width: `${calculateCompletion()}%`, height: "100%", background: "linear-gradient(90deg, #6366f1, #a855f7)", borderRadius: "10px" }}
            ></div>
          </div>
          <p style={{ marginTop: "20px", fontSize: "0.9rem", color: "var(--text-muted)", fontStyle: "italic" }}>
            Tip: A complete profile gets 3x more interests. Add your vision to stand out!
          </p>
        </div>
      </main>
    </div>
  );
}

export default Welcome;
