import React, { useState, useEffect } from "react";
import { getUsers, sendConnectionRequest, getConnectionRequests, getCurrentUserProfile } from "../utils/api";
import { useNavigate } from "react-router-dom";
import "../css/dashboard.css";

function FindCoFounder() {
  const navigate = useNavigate();
  const username = sessionStorage.getItem("loggedInUser");

  const [users, setUsers] = useState([]);
  const [results, setResults] = useState([]);
  const [myConnections, setMyConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ skill: "", domain: "" });

  // Professional avatar URLs to check for watermark
  const professionalAvatars = [
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop"
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [allUsers, connections] = await Promise.all([
          getUsers(),
          getConnectionRequests(username),
          getCurrentUserProfile()
        ]);
        setUsers(allUsers);
        setMyConnections(connections);

        // Initial results: show all verified/approved users except self
        const initialMatches = allUsers.filter(u => u.username !== username && u.verified && u.certificateApproved);
        setResults(initialMatches);
      } catch (error) {
        console.error("Error fetching data:", error);
        // Set empty arrays on error to prevent crashes
        setUsers([]);
        setResults([]);
        setMyConnections([]);
      } finally {
        setLoading(false);
      }
    };

    // Set a maximum loading time of 5 seconds
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    fetchData();

    return () => clearTimeout(loadingTimeout);
  }, [username]);

  useEffect(() => {
    const filtered = users.filter(u => {
      if (u.username === username) return false;
      if (!u.verified || !u.certificateApproved) return false;

      const matchesSkill = !filters.skill || u.skills?.toLowerCase().includes(filters.skill.toLowerCase());
      const matchesDomain = !filters.domain || u.domain?.toLowerCase().includes(filters.domain.toLowerCase());

      return matchesSkill && matchesDomain;
    });
    setResults(filtered);
  }, [filters, users, username]);


  const handleConnect = async (targetUser) => {
    if (!username) {
      alert("Please login to connect with experts.");
      navigate("/login");
      return;
    }
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
          DISCOVERING VISIONARIES...
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper" style={{ display: "block", background: "var(--primary-bg)" }}>
      {/* Simple Header for Explore Mode */}
      <nav style={{
        padding: "20px 8%",
        background: "rgba(2, 6, 23, 0.7)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        borderBottom: "1px solid var(--border-glass)"
      }}>
        <div className="sidebar-logo" style={{ marginBottom: 0, cursor: "pointer" }} onClick={() => navigate("/")}>Cofounder.</div>
        <div>
          {username ? (
            <button className="action-btn" onClick={() => navigate("/welcome")} style={{ padding: "8px 20px", fontSize: "0.9rem" }}>Dashboard</button>
          ) : (
            <button className="action-btn" onClick={() => navigate("/login")} style={{ padding: "8px 20px", fontSize: "0.9rem" }}>Login to Connect</button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content" style={{ padding: "40px 8%", maxWidth: "1400px", margin: "0 auto" }}>
        <header className="header-section" style={{ marginBottom: "30px" }}>
          <div className="welcome-text">
            <h1 style={{ fontSize: "2.5rem" }}>Expert Directory</h1>
            <p style={{ fontSize: "1.1rem" }}>Explore our community of verified founders and experts.</p>
          </div>
        </header>

        {/* Live Search Filters */}
        <div style={{
          display: "flex",
          gap: "24px",
          marginBottom: "48px",
          background: "var(--card-bg)",
          padding: "32px",
          borderRadius: "32px",
          boxShadow: "var(--card-shadow)",
          border: "1px solid var(--border-glass)",
          backdropFilter: "blur(20px)",
          flexWrap: "wrap"
        }}>
          <div style={{ flex: 1, minWidth: "250px" }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "800", marginBottom: "12px", color: "var(--accent-color)", textTransform: "uppercase", letterSpacing: "1px" }}>Skill / Technology</label>
            <input
              type="text"
              placeholder="e.g. React, Python, Marketing..."
              value={filters.skill}
              onChange={(e) => setFilters(prev => ({ ...prev, skill: e.target.value }))}
              style={{ width: "100%", padding: "16px 20px", borderRadius: "16px", border: "1px solid var(--border-glass)", outline: "none", fontSize: "1rem", color: "var(--text-main)", background: "rgba(255, 255, 255, 0.05)", transition: "all 0.3s" }}
            />
          </div>
          <div style={{ flex: 1, minWidth: "250px" }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "800", marginBottom: "12px", color: "var(--accent-color)", textTransform: "uppercase", letterSpacing: "1px" }}>Industry Domain</label>
            <input
              type="text"
              placeholder="e.g. Fintech, AI, SaaS..."
              value={filters.domain}
              onChange={(e) => setFilters(prev => ({ ...prev, domain: e.target.value }))}
              style={{ width: "100%", padding: "16px 20px", borderRadius: "16px", border: "1px solid var(--border-glass)", outline: "none", fontSize: "1rem", color: "var(--text-main)", background: "rgba(255, 255, 255, 0.05)", transition: "all 0.3s" }}
            />
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
                        <div style={{ position: "relative" }}>
                          <img
                            src={user.profilePicUrl || `https://ui-avatars.com/api/?name=${user.username}&background=6366f1&color=fff&bold=true`}
                            alt="Avatar"
                            style={{ width: "64px", height: "64px", borderRadius: "18px", objectFit: "cover", border: "2px solid var(--border-glass)", background: "rgba(255, 255, 255, 0.05)" }}
                          />
                          {/* AVATAR watermark for pre-selected avatars */}
                          {user.profilePicUrl && professionalAvatars.includes(user.profilePicUrl) && (
                            <div style={{
                              position: "absolute",
                              top: "4px",
                              left: "4px",
                              background: "rgba(0, 0, 0, 0.75)",
                              color: "white",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "0.5rem",
                              fontWeight: "800",
                              letterSpacing: "0.5px",
                              backdropFilter: "blur(4px)",
                              border: "1px solid rgba(255, 255, 255, 0.2)"
                            }}>
                              AVATAR
                            </div>
                          )}
                          {user.verified && <div style={{ position: "absolute", bottom: "-5px", right: "-5px", background: "var(--success)", width: "18px", height: "18px", borderRadius: "50%", border: "3px solid #020617", boxShadow: "0 0 10px var(--success)" }}></div>}
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "white" }}>{user.fullName || user.username}</h3>
                          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--accent-color)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px" }}>{user.role}</p>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
                      {(user.skills || "").split(',').filter(s => s.trim() !== "").map((skill, i) => (
                        <span key={i} style={{ padding: "4px 12px", backgroundColor: "rgba(99, 102, 241, 0.1)", color: "#818cf8", borderRadius: "8px", fontSize: "0.7rem", fontWeight: "800", border: "1px solid rgba(129, 140, 248, 0.2)" }}>{skill.trim()}</span>
                      ))}
                    </div>

                    <div style={{ marginBottom: "24px" }}>
                      <p style={{
                        fontSize: "0.9rem",
                        color: "var(--text-muted)",
                        lineHeight: "1.6",
                        margin: 0,
                        display: "-webkit-box",
                        WebkitLineClamp: "3",
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        fontStyle: user.about ? "normal" : "italic",
                        opacity: 0.8
                      }}>
                        {user.about || "Visionary co-founder exploring new horizons."}
                      </p>
                    </div>

                    <div style={{ marginBottom: "25px", borderTop: "1px solid var(--border-glass)", paddingTop: "15px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>DOMAIN</span>
                        <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "white" }}>{user.domain?.toUpperCase() || "N/A"}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>EXPERTISE</span>
                        <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "white" }}>{user.experience?.toUpperCase() || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {status === "pending" ? (
                    <button className="action-btn" disabled style={{ width: "100%", background: "rgba(255, 255, 255, 0.05)", color: "var(--text-muted)", cursor: "not-allowed", border: "1px solid var(--border-glass)" }}>REQUEST PENDING</button>
                  ) : status === "accepted" ? (
                    <button className="action-btn" style={{ width: "100%", background: "linear-gradient(135deg, #10b981, #059669)", color: "white" }} onClick={() => navigate("/messages")}>OPEN CHANNEL</button>
                  ) : (
                    <button className="action-btn" style={{ width: "100%" }} onClick={() => handleConnect(user.username)}>QUICK CONNECT</button>
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
