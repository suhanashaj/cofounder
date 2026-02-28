import React, { useState, useEffect } from "react";
import { getUsers, sendConnectionRequest, getConnectionRequests, getCurrentUserProfile, logout, getDirectDriveLink } from "../utils/api";
import { useNavigate } from "react-router-dom";
import "../css/dashboard.css";
import "../css/modal.css";

function FindCoFounder() {
  const navigate = useNavigate();
  const username = sessionStorage.getItem("loggedInUser");

  const [users, setUsers] = useState([]);
  const [results, setResults] = useState([]);
  const [myConnections, setMyConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ skill: "", domain: "", location: "" });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);


  useEffect(() => {
    // Apply full-screen class to body for this page
    document.body.classList.add("full-screen-page");

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

    return () => {
      clearTimeout(loadingTimeout);
      document.body.classList.remove("full-screen-page");
    };
  }, [username]);

  useEffect(() => {
    const extractSkills = (s) => {
      if (Array.isArray(s)) return s.map(skill => skill.name.toLowerCase());
      if (typeof s === 'string') return s.toLowerCase().split(',').map(item => item.trim()).filter(item => item);
      return [];
    };

    const filtered = users.filter(u => {
      if (u.username === username) return false;
      if (!u.verified || !u.certificateApproved) return false;

      const userSkillNames = extractSkills(u.skills);
      const matchesSkill = !filters.skill || userSkillNames.some(s => s.includes(filters.skill.toLowerCase()));
      const matchesDomain = !filters.domain || u.domain?.toLowerCase().includes(filters.domain.toLowerCase());
      const matchesLocation = !filters.location || u.location?.toLowerCase().includes(filters.location.toLowerCase());

      return matchesSkill && matchesDomain && matchesLocation;
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

  const renderProfileModal = () => {
    if (!selectedUser) return null;

    const isFounder = selectedUser.role?.toLowerCase() === 'founder';
    const isCoFounder = selectedUser.role?.toLowerCase() === 'cofounder' || selectedUser.role?.toLowerCase() === 'co-founder';

    return (
      <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
        <div className="profile-modal-content" onClick={e => e.stopPropagation()}>
          <button className="modal-close-btn" onClick={() => setSelectedUser(null)}>✕</button>

          <div className="profile-modal-header">
            <img
              src={selectedUser.profilePicUrl || `https://ui-avatars.com/api/?name=${selectedUser.username}&background=6366f1&color=fff&bold=true&size=200`}
              alt="Profile"
              className="modal-avatar"
            />
            <div className="modal-header-info">
              <span className="modal-role-badge">{selectedUser.role}</span>
              <h2>{selectedUser.fullName || selectedUser.username}</h2>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>📍 {selectedUser.location || "Earth"}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>⚡ {selectedUser.availability}</span>
              </div>
              <div style={{ display: "flex", gap: "15px" }}>
                {getConnectionStatus(selectedUser.username) === 'accepted' ? (
                  <button
                    className="action-btn"
                    style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white" }}
                    onClick={() => {
                      navigate(`/messages?user=${selectedUser.username}`);
                      setSelectedUser(null);
                    }}
                  >
                    OPEN CHANNEL
                  </button>
                ) : (
                  <button
                    className="action-btn"
                    onClick={() => {
                      handleConnect(selectedUser.username);
                      setSelectedUser(null);
                    }}
                    disabled={getConnectionStatus(selectedUser.username) === 'pending'}
                  >
                    {getConnectionStatus(selectedUser.username) === 'pending' ? "PENDING..." : "CONNECT NOW"}
                  </button>
                )}
                {selectedUser.pitchVideoUrl && (
                  <a href={getDirectDriveLink(selectedUser.pitchVideoUrl)} target="_blank" rel="noreferrer" className="video-preview-btn">
                    <span>🎬</span> WATCH PITCH
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="modal-details-grid">
            <div className="modal-detail-card">
              <h4>About</h4>
              <p>{selectedUser.about || "This visionary hasn't added a bio yet."}</p>
            </div>

            <div className="modal-detail-card">
              <h4>Industry & Domain</h4>
              <p>{selectedUser.domain || "Not specified"}</p>
            </div>

            {isFounder && (
              <>
                <div className="modal-detail-card" style={{ gridColumn: "1 / -1" }}>
                  <h4>Startup Idea Description</h4>
                  <p>{selectedUser.startupIdea || "Idea details are private or not yet provided."}</p>
                </div>
                <div className="modal-detail-card">
                  <h4>Company Name</h4>
                  <p>{selectedUser.companyName || "Stealth Startup"}</p>
                </div>
                <div className="modal-detail-card">
                  <h4>Startup Stage</h4>
                  <p>{selectedUser.startupStage || "Ideation"}</p>
                </div>
                <div className="modal-detail-card">
                  <h4>Looking For</h4>
                  <p>{selectedUser.lookingFor} {selectedUser.otherLookingFor ? `- ${selectedUser.otherLookingFor}` : ""}</p>
                </div>
                <div className="modal-detail-card">
                  <h4>Required Skills</h4>
                  <p>{selectedUser.requiredSkills || "Passionate collaborators"}</p>
                </div>
              </>
            )}

            {isCoFounder && (
              <>
                <div className="modal-detail-card">
                  <h4>Skills</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                    {Array.isArray(selectedUser.skills) ? selectedUser.skills.map((s, i) => (
                      <span key={i} style={{ fontSize: "0.8rem", background: "rgba(99,102,241,0.1)", padding: "5px 10px", borderRadius: "5px", color: "white" }}>
                        {s.name} {s.verified ? "✅" : ""}
                      </span>
                    )) : selectedUser.skills}
                  </div>
                </div>
                {selectedUser.education && (
                  <div className="modal-detail-card">
                    <h4>Education</h4>
                    <p>{selectedUser.education.degree} from {selectedUser.education.institution} ({selectedUser.education.year})</p>
                  </div>
                )}
                {selectedUser.workExperience && (
                  <div className="modal-detail-card" style={{ gridColumn: "1 / -1" }}>
                    <h4>Work Experience</h4>
                    <p><strong>{selectedUser.workExperience.role}</strong> at {selectedUser.workExperience.company}</p>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "10px" }}>{selectedUser.workExperience.description}</p>
                  </div>
                )}
                {selectedUser.projects && (
                  <div className="modal-detail-card" style={{ gridColumn: "1 / -1" }}>
                    <h4>Featured Project</h4>
                    <p><strong>{selectedUser.projects.title}</strong></p>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "5px" }}>{selectedUser.projects.description}</p>
                    {selectedUser.projects.link && <a href={selectedUser.projects.link} target="_blank" rel="noreferrer" style={{ color: "var(--accent-color)", fontSize: "0.8rem" }}>Live Link ↗</a>}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
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
    <div className="dashboard-wrapper" style={{ display: "flex", background: "var(--primary-bg)", minHeight: "100vh" }}>
      {/* Mobile Toggle */}
      <button className="mobile-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        {isMenuOpen ? "✕" : "☰"}
      </button>

      {/* Sidebar - Consistent with other pages */}
      <aside className={`sidebar ${isMenuOpen ? "mobile-open" : ""}`} style={{ position: "sticky", top: 0, height: "100vh" }}>
        <div className="sidebar-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>Cofounder.</div>
        <ul className="nav-menu">
          <li className="nav-item" onClick={() => { navigate("/welcome"); setIsMenuOpen(false); }}>
            <span>🏠</span> Dashboard
          </li>
          <li className="nav-item" onClick={() => { navigate("/profile"); setIsMenuOpen(false); }}>
            <span>👤</span> My Profile
          </li>
          <li className="nav-item active" onClick={() => { navigate("/find"); setIsMenuOpen(false); }}>
            <span>🔍</span> Find Partners
          </li>
          <li className="nav-item" onClick={() => { navigate("/messages"); setIsMenuOpen(false); }}>
            <span>💬</span> Messages
          </li>
          <li className="nav-item" onClick={() => { navigate("/inbox"); setIsMenuOpen(false); }}>
            <span>📥</span> Inbox
          </li>
          <li className="nav-item" onClick={() => { navigate("/help-center"); setIsMenuOpen(false); }}>
            <span>❓</span> Help Center
          </li>
        </ul>
        <div className="nav-item logout-item" onClick={async () => { await logout(); navigate("/login"); }} style={{ marginTop: "auto" }}>
          <span>🚪</span> Logout
        </div>
      </aside>

      {/* Backdrop for mobile menu */}
      {isMenuOpen && <div className="sidebar-backdrop" onClick={() => setIsMenuOpen(false)}></div>}

      {/* Main Content */}
      <main className="main-content" style={{ padding: "40px", maxWidth: "100%", flexGrow: 1 }}>
        <header className="header-section" style={{ marginBottom: "30px" }}>
          <div className="welcome-text">
            <h1 style={{ fontSize: "2.5rem" }}>Expert Directory</h1>
            <p style={{ fontSize: "1.1rem" }}>Explore our community of verified founders and experts.</p>
          </div>
        </header>

        <div className="filters-container" style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "24px",
          marginBottom: "48px",
          background: "var(--card-bg)",
          padding: "32px",
          borderRadius: "32px",
          boxShadow: "var(--card-shadow)",
          border: "1px solid var(--border-glass)",
          backdropFilter: "blur(20px)"
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
          <div style={{ flex: 1, minWidth: "250px" }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "800", marginBottom: "12px", color: "var(--accent-color)", textTransform: "uppercase", letterSpacing: "1px" }}>Location</label>
            <input
              type="text"
              placeholder="e.g. Kochi, San Francisco..."
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              style={{ width: "100%", padding: "16px 20px", borderRadius: "16px", border: "1px solid var(--border-glass)", outline: "none", fontSize: "1rem", color: "var(--text-main)", background: "rgba(255, 255, 255, 0.05)", transition: "all 0.3s" }}
            />
          </div>
        </div>

        {/* Discovery Results */}
        <div className="discovery-results-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "25px" }}>
          {results.length > 0 ? (
            results.map((user, idx) => {
              const status = getConnectionStatus(user.username);
              return (
                <div
                  key={idx}
                  className="stat-card"
                  style={{ textAlign: "left", animationDelay: `${idx * 0.05}s`, display: "flex", flexDirection: "column", cursor: "pointer" }}
                  onClick={() => setSelectedUser(user)}
                >
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                      <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                        <div style={{ position: "relative" }}>
                          <img
                            src={user.profilePicUrl || `https://ui-avatars.com/api/?name=${user.username}&background=6366f1&color=fff&bold=true`}
                            alt="Avatar"
                            style={{ width: "64px", height: "64px", borderRadius: "18px", objectFit: "cover", border: "2px solid var(--border-glass)", background: "rgba(255, 255, 255, 0.05)" }}
                          />
                          {user.verified && <div style={{ position: "absolute", bottom: "-5px", right: "-5px", background: "var(--success)", width: "18px", height: "18px", borderRadius: "50%", border: "3px solid #020617", boxShadow: "0 0 10px var(--success)" }}></div>}
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "white" }}>{user.fullName || user.username}</h3>
                          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--accent-color)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px" }}>{user.role}</p>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
                      {Array.isArray(user.skills) ? (
                        user.skills.map((skill, i) => (
                          <span key={i} style={{ padding: "4px 12px", backgroundColor: "rgba(99, 102, 241, 0.1)", color: "#818cf8", borderRadius: "8px", fontSize: "0.7rem", fontWeight: "800", border: "1px solid rgba(129, 140, 248, 0.2)" }}>
                            {skill.name}
                            {skill.verified && " ✅"}
                          </span>
                        ))
                      ) : (user.skills || "").split(',').filter(s => s.trim() !== "").map((skill, i) => (
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
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>LOCATION</span>
                        <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "white" }}>{user.location?.toUpperCase() || "EARTH"}</span>
                      </div>

                      {user.education?.degree && (
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>EDUCATION</span>
                          <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "white", textAlign: "right", maxWidth: "180px" }}>
                            {user.education.degree} @ {user.education.institution}
                          </span>
                        </div>
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>EXPERIENCE</span>
                        <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "white" }}>
                          {user.isFresher ? "FRESHER" : (user.workExperience?.role || user.experience?.toUpperCase() || "N/A")}
                        </span>
                      </div>

                      {user.projects?.title && (
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>FEATURED PROJECT</span>
                          <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "white", textAlign: "right" }}>{user.projects.title}</span>
                        </div>
                      )}

                      {user.cvUrl && (
                        <div style={{ marginTop: "15px", borderTop: "1px dashed var(--border-glass)", paddingTop: "12px", textAlign: "center" }}>
                          <a
                            href={getDirectDriveLink(user.cvUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "var(--accent-color)", textDecoration: "none", fontSize: "0.85rem", fontWeight: "800", display: "inline-flex", alignItems: "center", gap: "5px" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            VIEW FULL CV 📄
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {
                    status === "pending" ? (
                      <button className="action-btn" disabled onClick={(e) => e.stopPropagation()} style={{ width: "100%", background: "rgba(255, 255, 255, 0.05)", color: "var(--text-muted)", cursor: "not-allowed", border: "1px solid var(--border-glass)" }}>REQUEST PENDING</button>
                    ) : status === "accepted" ? (
                      <button className="action-btn" style={{ width: "100%", background: "linear-gradient(135deg, #10b981, #059669)", color: "white" }} onClick={(e) => { e.stopPropagation(); navigate(`/messages?user=${user.username}`); }}>OPEN CHANNEL</button>
                    ) : (
                      <button className="action-btn" style={{ width: "100%" }} onClick={(e) => { e.stopPropagation(); handleConnect(user.username); }}>QUICK CONNECT</button>
                    )
                  }
                </div>
              );
            })
          ) : (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "80px", color: "var(--text-muted)" }}>
              {loading ? "Discovering potential partners..." : "No experts match these criteria yet. Try broadening your skills or domain search."}
            </div>
          )}
        </div>

        {renderProfileModal()}
      </main >
    </div >
  );
}

export default FindCoFounder;
