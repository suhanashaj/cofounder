import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUserProfile, logout, syncEmailVerification, getUnreadCounts, getConnectionCount } from "../utils/api";
import "../css/dashboard.css";

function Welcome() {
  const navigate = useNavigate();
  const username = sessionStorage.getItem("loggedInUser");
  const cachedProfilePic = sessionStorage.getItem("userProfilePic");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionCount, setConnectionCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (username) {
        try {
          // Parallel execution for faster loading
          const [, profileResult, countResult] = await Promise.all([
            syncEmailVerification(),
            getCurrentUserProfile(),
            getConnectionCount(username)
          ]);

          if (profileResult.success) {
            setUserData(profileResult.data);
          }
          setConnectionCount(countResult);
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
      {/* Mobile Toggle */}
      <button className="mobile-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        {isMenuOpen ? "✕" : "☰"}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${isMenuOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-logo">Cofounder.</div>

        {/* Sidebar Mini Profile */}
        <div className="sidebar-user-preview" style={{ padding: "20px", borderBottom: "1px solid var(--border-glass)", marginBottom: "10px", textAlign: "center" }}>
          <img
            src={userData?.profilePicUrl || cachedProfilePic || `https://ui-avatars.com/api/?name=${username}&background=6366f1&color=fff&bold=true&size=64`}
            alt="User"
            style={{ width: "64px", height: "64px", borderRadius: "50%", border: "2px solid var(--accent-color)", objectFit: "cover", marginBottom: "10px" }}
          />
          <div style={{ fontSize: "0.9rem", fontWeight: "700" }}>{userData?.fullName || username}</div>
        </div>

        <ul className="nav-menu">
          <li className="nav-item active" onClick={() => { navigate("/welcome"); setIsMenuOpen(false); }}>
            <span>🏠</span> Dashboard
          </li>
          <li className="nav-item" onClick={() => { navigate("/profile"); setIsMenuOpen(false); }}>
            <span>👤</span> My Profile
          </li>
          <li className="nav-item" onClick={() => { navigate("/find"); setIsMenuOpen(false); }}>
            <span>🔍</span> Find Partners
          </li>
          <li className="nav-item" onClick={() => { navigate("/messages"); setIsMenuOpen(false); }}>
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

      {/* Backdrop for mobile menu */}
      {isMenuOpen && <div className="sidebar-backdrop" onClick={() => setIsMenuOpen(false)}></div>}

      {/* Main Content */}
      <main className="main-content">
        <header className="header-section">
          <div className="welcome-text">
            <h1>Hello, {username}!</h1>
            <p>Here's what's happening with your {userData?.role || 'startup'} journey today.</p>
          </div>
          <div className="user-badge">
            <div className="badge-dot"></div>
            <span>{(userData?.role || 'Member').toLowerCase()}</span>
          </div>
        </header>

        {/* About User Card */}
        <div className="about-card" style={{ marginTop: "0", marginBottom: "40px" }}>
          <div className="about-header">
            <div className="traffic-light traffic-red"></div>
            <div className="traffic-light traffic-yellow"></div>
            <div className="traffic-light traffic-green"></div>
          </div>
          <div className="about-content">
            <div className="about-avatar-wrapper">
              <div className="avatar-glow"></div>
              <img
                src={userData?.profilePicUrl || cachedProfilePic || `https://ui-avatars.com/api/?name=${username}&background=6366f1&color=fff&bold=true&size=128`}
                alt="Profile"
                className="about-avatar"
              />
            </div>
            <div className="about-details">
              <div className="about-name">{userData?.fullName || username}</div>
              <div className="about-role text-gradient">{userData?.role || "USER"}</div>

              <div className="about-text">
                {userData?.about || "No bio added yet. Go to Profile to introduce yourself!"}
              </div>

              <div className="skills-container">
                {userData?.skills && userData.skills.trim().length > 0 ? (
                  userData.skills.split(',').filter(s => s.trim().length > 0).map((skill, index) => (
                    <span key={index} className="skill-pill">
                      {skill.trim()}
                    </span>
                  ))
                ) : (
                  <span className="skill-pill" style={{ fontStyle: "italic", opacity: 0.7 }}>no skills listed</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper blue">🛡️</div>
            <div className="stat-content">
              <div className="stat-value">{userData?.verified ? "Verified" : "Pending"}</div>
              <div className="stat-label">Email Status</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper orange">📜</div>
            <div className="stat-content">
              <div className="stat-value">{userData?.certificateApproved ? "Approved" : "Under Review"}</div>
              <div className="stat-label">Certificate Status</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper yellow">🤝</div>
            <div className="stat-content">
              <div className="stat-value">{connectionCount}</div>
              <div className="stat-label">Connections Made</div>
            </div>
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
