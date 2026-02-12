import React, { useState, useEffect } from "react";
import { getUsers, sendConnectionRequest, getConnectionRequests, getProfileAPI, logout } from "../utils/api";
import { useNavigate } from "react-router-dom";
import "../css/dashboard.css";

function FindCoFounder() {
  const navigate = useNavigate();
  const username = localStorage.getItem("loggedInUser");

  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ skill: "", domain: "", exp: "", avail: "" });
  const [results, setResults] = useState([]);
  const [myConnections, setMyConnections] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [allUsers, connections, profile] = await Promise.all([
        getUsers(),
        getConnectionRequests(username),
        getProfileAPI(username)
      ]);
      setUsers(allUsers);
      setMyConnections(connections);
      if (profile.success) setUserData(profile.data);

      // Initial results: show all verified/approved users except self
      const initialMatches = allUsers.filter(u => u.username !== username && u.verified && u.certificateApproved);
      setResults(initialMatches);

      setLoading(false);
    };
    fetchData();
  }, [username]);

  const handleSearch = () => {
    const currentUser = users.find(u => u.username === username);
    if (!currentUser?.certificateApproved) {
      alert("Please wait for your certificate to be approved before searching.");
      return;
    }

    const matches = users.filter(u => {
      if (u.username === username) return false;
      if (!u.verified || !u.certificateApproved) return false;

      let score = 0;
      if (filters.skill && u.skills?.toLowerCase().includes(filters.skill.toLowerCase())) score += 40;
      if (filters.domain && u.domain?.toLowerCase().includes(filters.domain.toLowerCase())) score += 30;
      if (filters.exp && u.experience === filters.exp) score += 20;
      if (filters.avail && u.availability === filters.avail) score += 10;

      // If no filters, show all relevant users
      if (!filters.skill && !filters.domain && !filters.exp && !filters.avail) return true;

      return score > 0;
    });
    setResults(matches);
  };

  const handleConnect = async (targetUser) => {
    const res = await sendConnectionRequest(username, targetUser);
    alert(res.msg);
    if (res.success) {
      const updatedCons = await getConnectionRequests(username);
      setMyConnections(updatedCons);
    }
  };

  const getConnectionStatus = (targetUser) => {
    const conn = myConnections.find(c => c.to === targetUser || c.from === targetUser);
    return conn ? conn.status : null;
  };

  const acceptedCount = myConnections.filter(c => c.status === "accepted").length;
  const pendingCount = myConnections.filter(c => c.from === username && c.status === "pending").length;

  return (
    <div className="dashboard-wrapper">
      {/* Sidebar - Consistent with Webpage */}
      <aside className="sidebar">
        <div className="sidebar-logo">Cofounder.</div>
        <ul className="nav-menu">
          <li className="nav-item" onClick={() => navigate("/welcome")}>
            <span>🏠</span> Dashboard
          </li>
          <li className="nav-item" onClick={() => navigate("/profile")}>
            <span>👤</span> My Profile
          </li>
          <li className="nav-item active" onClick={() => navigate("/find")}>
            <span>🔍</span> Find Partners
          </li>
          <li className="nav-item" onClick={() => navigate("/messages")}>
            <span>💬</span> Messages
          </li>
        </ul>
        <div className="nav-item logout-item" onClick={async () => { await logout(); navigate("/login"); }}>
          <span>🚪</span> Logout
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header-section">
          <div className="welcome-text">
            <h1>Partner Discovery</h1>
            <p>Connect with high-potential entrepreneurs who match your vision.</p>
          </div>
          <div className="user-badge">
            <div className="badge-dot" style={{ backgroundColor: userData?.verified ? "#10b981" : "#f59e0b" }}></div>
            <span>{userData?.role || 'Founder'}</span>
          </div>
        </header>

        {/* Highlight Stats - Consistent with Welcome Page */}
        <section className="stats-grid" style={{ marginBottom: "30px" }}>
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon" style={{ backgroundColor: "rgba(99, 102, 241, 0.1)", color: "#6366f1" }}>👥</div>
            </div>
            <div className="stat-value">{users.length - 1}</div>
            <div className="stat-label">Available Experts</div>
          </div>
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>✅</div>
            </div>
            <div className="stat-value">{acceptedCount}</div>
            <div className="stat-label">Active Connections</div>
          </div>
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>⏳</div>
            </div>
            <div className="stat-value">{pendingCount}</div>
            <div className="stat-label">Requests Sent</div>
          </div>
        </section>

        {/* Filter Section - Consistent with Webpage Actions */}
        <div className="action-banner" style={{ display: "block", marginBottom: "40px", background: "white", color: "var(--text-main)", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "20px", fontWeight: "600" }}>Smart Filters</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
            <div className="form-group-custom">
              <input
                type="text"
                placeholder="Skill (e.g. React)"
                value={filters.skill}
                onChange={e => setFilters({ ...filters, skill: e.target.value })}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.9rem", color: "#1f2937", background: "white" }}
              />
            </div>
            <div className="form-group-custom">
              <input
                type="text"
                placeholder="Domain (e.g. AI, Fintech)"
                value={filters.domain}
                onChange={e => setFilters({ ...filters, domain: e.target.value })}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.9rem", color: "#1f2937", background: "white" }}
              />
            </div>
            <div className="form-group-custom">
              <select
                value={filters.exp}
                onChange={e => setFilters({ ...filters, exp: e.target.value })}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.9rem", color: "#1f2937", background: "white" }}
              >
                <option value="">Experience</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
            <button className="action-btn" onClick={handleSearch} style={{ width: "100%", background: "var(--accent-color)", color: "white" }}>
              Apply Filters
            </button>
          </div>
        </div>

        {/* Discovery Results */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "25px" }}>
          {results.length > 0 ? (
            results.map((user, idx) => {
              const status = getConnectionStatus(user.username);
              return (
                <div key={idx} className="stat-card" style={{ textAlign: "left", animationDelay: `${idx * 0.05}s`, display: "flex", flexDirection: "column" }}>
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                      <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                        <img
                          src={user.profilePicUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                          alt="Avatar"
                          style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", border: "2px solid #f1f5f9" }}
                        />
                        <div>
                          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700" }}>{user.fullName || user.username}</h3>
                          <p style={{ margin: 0, fontSize: "0.8rem", color: "#6366f1", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>{user.role}</p>
                        </div>
                      </div>
                      {user.verified && <span title="Highly Vetted" style={{ fontSize: "1.2rem" }}>✨</span>}
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
                      {(user.skills || "").split(',').filter(s => s.trim() !== "").map((skill, i) => (
                        <span key={i} style={{ padding: "4px 10px", backgroundColor: "#f1f5f9", color: "#475569", borderRadius: "15px", fontSize: "0.7rem", fontWeight: "600" }}>{skill.trim()}</span>
                      ))}
                    </div>

                    <div style={{ marginBottom: "25px", borderTop: "1px solid #f1f5f9", paddingTop: "15px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Domain:</span>
                        <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>{user.domain || "N/A"}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Level:</span>
                        <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>{user.experience || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {status === "pending" ? (
                    <button className="action-btn" disabled style={{ width: "100%", background: "#f1f5f9", color: "#94a3b8", cursor: "not-allowed" }}>Request Pending</button>
                  ) : status === "accepted" ? (
                    <button className="action-btn" style={{ width: "100%", background: "#10b981", color: "white" }} onClick={() => navigate("/messages")}>Start Chatting</button>
                  ) : (
                    <button className="action-btn" style={{ width: "100%" }} onClick={() => handleConnect(user.username)}>Quick Connect</button>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "80px", color: "var(--text-muted)" }}>
              {loading ? "Discovering potential partners..." : "No experts match these criteria yet. Try broadening your skills or domain search."}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default FindCoFounder;
