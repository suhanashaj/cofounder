import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUserProfile, logout, syncEmailVerification, getUnreadCounts, getConnectionCount, postOpportunity, getUsers, getAllConnections, sendConnectionRequest, getDirectDriveLink, getAllFeedbacks } from "../utils/api";
import "../css/dashboard.css";
import "../css/modal.css";

function Welcome() {
  const navigate = useNavigate();
  const username = sessionStorage.getItem("loggedInUser");
  const cachedProfilePic = getDirectDriveLink(sessionStorage.getItem("userProfilePic"));
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionCount, setConnectionCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isConnecting, setIsConnecting] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [globalFeedbacks, setGlobalFeedbacks] = useState([]);
  useEffect(() => {
    // Apply full-screen class to body for this page
    document.body.classList.add("full-screen-page");

    const fetchDashboardData = async () => {
      if (username) {
        try {
          // Parallel execution for faster loading
          const [, profileResult, countResult, allUsers, allConns, feedbacks] = await Promise.all([
            syncEmailVerification(),
            getCurrentUserProfile(),
            getConnectionCount(username),
            getUsers(),
            getAllConnections(),
            getAllFeedbacks()
          ]);

          if (profileResult.success) {
            setUserData(profileResult.data);

            // Calculate Suggestions
            if (allUsers && allUsers.length > 0) {
              const currentUser = profileResult.data;
              const extractSkills = (s) => {
                if (Array.isArray(s)) return s.map(skill => skill.name.toLowerCase());
                if (typeof s === 'string') return s.toLowerCase().split(',').map(item => item.trim()).filter(item => item);
                return [];
              };
              const mySkills = extractSkills(currentUser.skills);

              // Get my friends (accepted status)
              const myFriends = new Set();
              allConns.forEach(conn => {
                if (conn.status === 'accepted') {
                  if (conn.from === username) myFriends.add(conn.to);
                  if (conn.to === username) myFriends.add(conn.from);
                }
              });

              // Also get my pending requests to hide them
              const pendingOrSent = new Set();
              allConns.forEach(conn => {
                if (conn.from === username || conn.to === username) {
                  if (conn.from === username) pendingOrSent.add(conn.to);
                  if (conn.to === username) pendingOrSent.add(conn.from);
                }
              });

              const rankedSuggestions = allUsers
                .filter(u => u.username !== username && !pendingOrSent.has(u.username))
                .map(u => {
                  const uSkills = extractSkills(u.skills);
                  const sharedSkills = mySkills.filter(s => uSkills.includes(s));

                  // Calculate mutual friends
                  let mutualFriendsCount = 0;
                  const uFriends = new Set();
                  allConns.forEach(conn => {
                    if (conn.status === 'accepted') {
                      if (conn.from === u.username) uFriends.add(conn.to);
                      if (conn.to === u.username) uFriends.add(conn.from);
                    }
                  });

                  uFriends.forEach(f => {
                    if (myFriends.has(f)) mutualFriendsCount++;
                  });

                  return {
                    ...u,
                    score: (sharedSkills.length * 2) + (mutualFriendsCount * 3),
                    mutualCount: mutualFriendsCount,
                    sharedSkills: sharedSkills
                  };
                })
                .filter(u => u.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 4);

              setSuggestions(rankedSuggestions);
            }
          }
          setGlobalFeedbacks(feedbacks);
          setConnectionCount(countResult);
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        }
      }
      setLoading(false);
    };

    // Set a maximum loading time of 3 seconds
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    fetchDashboardData();

    return () => {
      clearTimeout(loadingTimeout);
      document.body.classList.remove("full-screen-page");
    };
  }, [username]);

  const handleConnect = async (targetUser) => {
    setIsConnecting(prev => ({ ...prev, [targetUser]: true }));
    const res = await sendConnectionRequest(username, targetUser);
    if (res.success) {
      alert("Connection request sent!");
      setSuggestions(prev => prev.filter(u => u.username !== targetUser));
    } else {
      alert("Error: " + res.msg);
    }
    setIsConnecting(prev => ({ ...prev, [targetUser]: false }));
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
              src={getDirectDriveLink(selectedUser.profilePicUrl) || `https://ui-avatars.com/api/?name=${selectedUser.username}&background=6366f1&color=fff&bold=true&size=200`}
              alt="Profile"
              className="modal-avatar"
              referrerPolicy="no-referrer"
            />
            <div className="modal-header-info">
              <span className="modal-role-badge">{selectedUser.role}</span>
              <h2>{selectedUser.fullName || selectedUser.username}</h2>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "15px" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>📍 {selectedUser.location || "Earth"}</span>
                {selectedUser.workStyle && <span style={{ color: "var(--accent-color)", fontSize: "0.9rem", fontWeight: "700" }}>🏠 {selectedUser.workStyle}</span>}
              </div>
              <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
                {selectedUser.linkedin && (
                  <a href={selectedUser.linkedin} target="_blank" rel="noreferrer" style={{ color: "white", fontSize: "1.2rem", opacity: 0.8 }}>
                    <i className="fab fa-linkedin"></i>
                  </a>
                )}
                {selectedUser.github && (
                  <a href={selectedUser.github} target="_blank" rel="noreferrer" style={{ color: "white", fontSize: "1.2rem", opacity: 0.8 }}>
                    <i className="fab fa-github"></i>
                  </a>
                )}
              </div>
              <div style={{ display: "flex", gap: "15px" }}>
                <button
                  className="action-btn"
                  onClick={() => {
                    handleConnect(selectedUser.username);
                    setSelectedUser(null);
                  }}
                  disabled={isConnecting[selectedUser.username]}
                >
                  {isConnecting[selectedUser.username] ? "CONNECTING..." : "CONNECT NOW"}
                </button>
                {selectedUser.pitchVideoUrl && (
                  <a href={getDirectDriveLink(selectedUser.pitchVideoUrl, false)} target="_blank" rel="noreferrer" className="video-preview-btn">
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
                {selectedUser.equity && (
                  <div className="modal-detail-card">
                    <h4>{isFounder ? "Equity Offered" : "Equity Expectation"}</h4>
                    <p style={{ color: "var(--accent-color)", fontWeight: "800" }}>{selectedUser.equity}</p>
                  </div>
                )}
                {selectedUser.workStyle && (
                  <div className="modal-detail-card">
                    <h4>Work Style</h4>
                    <p style={{ color: "var(--accent-color)", fontWeight: "800" }}>{selectedUser.workStyle}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

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
            referrerPolicy="no-referrer"
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
          <li className="nav-item" onClick={() => { navigate("/inbox"); setIsMenuOpen(false); }}>
            <span>📥</span> Inbox
          </li>
          <li className="nav-item" onClick={() => { navigate("/help-center"); setIsMenuOpen(false); }}>
            <span>❓</span> Help Center
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
          <div className="user-badge" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div className="badge-dot"></div>
              <span>{(userData?.role || 'Member').toLowerCase()}</span>
            </div>
            {userData?.startupId && (
              <div style={{
                fontSize: "0.65rem",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "white",
                padding: "2px 8px",
                borderRadius: "4px",
                fontWeight: "900",
                letterSpacing: "0.5px"
              }}>
                🚀 STARTUP PARTNER
              </div>
            )}
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
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="about-details">
              <div className="about-name">{userData?.fullName || username}</div>
              <div className="about-role text-gradient">{userData?.role || "USER"}</div>

              <div className="about-text">
                {userData?.about || "No bio added yet. Go to Profile to introduce yourself!"}
              </div>

              <div className="skills-container" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "15px" }}>
                {Array.isArray(userData?.skills) ? (
                  userData.skills.map((skill, index) => (
                    <span key={index} className="skill-pill" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      {skill.name}
                      {skill.verified && <span title="Verified Skill" style={{ color: "#10b981", fontSize: "0.8rem" }}>✅</span>}
                    </span>
                  ))
                ) : userData?.skills ? (
                  userData.skills.split(',').map((skill, index) => (
                    <span key={index} className="skill-pill">{skill.trim()}</span>
                  ))
                ) : (
                  <span className="skill-pill" style={{ fontStyle: "italic", opacity: 0.7 }}>no skills listed</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Suggestions Section */}
        {suggestions.length > 0 && (
          <div className="suggestions-section" style={{ marginBottom: "40px" }}>
            <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "white", margin: 0 }}>People You May Know</h2>
              <span style={{ fontSize: "0.9rem", color: "var(--accent-color)", fontWeight: "600" }}>Based on your skills & connections</span>
            </div>

            <div className="suggestions-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
              {suggestions.map((user) => (
                <div
                  key={user.username}
                  className="stat-card suggestion-card"
                  style={{ padding: "20px", position: "relative", overflow: "hidden", cursor: "pointer" }}
                  onClick={() => setSelectedUser(user)}
                >
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
                    <img
                      src={getDirectDriveLink(user.profilePicUrl) || `https://ui-avatars.com/api/?name=${user.username}&background=6366f1&color=fff&bold=true&size=48`}
                      alt={user.username}
                      style={{ width: "48px", height: "48px", borderRadius: "50%", marginRight: "12px", border: "1px solid var(--border-glass)" }}
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div style={{ fontWeight: "700", color: "white" }}>{user.fullName || user.username}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--accent-color)" }}>{user.role || "Co-founder"}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "15px", minHeight: "2.5em" }}>
                    {user.mutualCount > 0 && <span>👥 {user.mutualCount} mutual connections<br /></span>}
                    {user.sharedSkills.length > 0 && <span>✨ Shared skills: {user.sharedSkills.join(', ')}</span>}
                    {user.cvUrl && (
                      <div style={{ marginTop: "8px" }}>
                        <a
                          href={getDirectDriveLink(user.cvUrl, false)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--accent-color)", textDecoration: "none", fontSize: "0.75rem", fontWeight: "700" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          VIEW CV 📄
                        </a>
                      </div>
                    )}
                  </div>

                  <button
                    className="action-btn"
                    style={{ width: "100%", padding: "10px", fontSize: "0.9rem" }}
                    disabled={isConnecting[user.username]}
                    onClick={(e) => { e.stopPropagation(); handleConnect(user.username); }}
                  >
                    {isConnecting[user.username] ? "CONNECTING..." : "CONNECT"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Global Feedback Feed */}
        <div className="community-feed-section" style={{ marginBottom: "40px" }}>
          <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "white", margin: 0 }}>Startup Community Milestones</h2>
            <span style={{ fontSize: "0.9rem", color: "var(--success)", fontWeight: "600" }}>Recent Success Stories ✨</span>
          </div>

          <div className="feed-container" style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            padding: "20px",
            background: "rgba(255, 255, 255, 0.02)",
            borderRadius: "24px",
            border: "1px solid var(--border-glass)",
            maxHeight: "500px",
            overflowY: "auto"
          }}>
            {globalFeedbacks.length > 0 ? (
              globalFeedbacks.map((f, i) => (
                <div key={i} className="feed-item" style={{
                  padding: "15px",
                  background: "rgba(255, 255, 255, 0.03)",
                  borderRadius: "16px",
                  border: "1px solid rgba(255, 255, 255, 0.05)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontWeight: "800", color: "var(--accent-color)", fontSize: "0.85rem" }}>@{f.fromUser}</span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      {f.timestamp ? new Date(f.timestamp.seconds * 1000).toLocaleDateString() : "Recently"}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: "1.5", color: "white" }}>{f.text}</p>
                </div>
              ))
            ) : (
              <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>No community updates yet. Be the first to share your startup journey!</p>
            )}
          </div>
        </div>

        {/* Founder Post Section */}
        {userData?.role?.toLowerCase() === "founder" && (
          <div className="stat-card" style={{ marginBottom: "40px", padding: "32px", borderRadius: "32px", background: "linear-gradient(rgba(99, 102, 241, 0.05), rgba(168, 85, 247, 0.05))" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "10px", color: "white" }}>Find Your Perfect Co-founder</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>Post what you're looking for. All potential co-founders will be notified.</p>

            <textarea
              placeholder="I am looking for a partner for my startup who can help with..."
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              className="about-text"
              style={{ width: "100%", background: "rgba(0,0,0,0.2)", borderRadius: "16px", padding: "20px", border: "1px solid var(--border-glass)", color: "white", minHeight: "120px", marginBottom: "20px", fontSize: "1rem" }}
            />

            <input
              type="text"
              placeholder="Required Skills (e.g. React, UX Design, Marketing)"
              value={requiredSkills}
              onChange={(e) => setRequiredSkills(e.target.value)}
              className="about-text"
              style={{ width: "100%", background: "rgba(0,0,0,0.2)", borderRadius: "16px", padding: "12px 20px", border: "1px solid var(--border-glass)", color: "white", marginBottom: "24px" }}
            />

            <button
              className="action-btn"
              style={{ width: "100%", padding: "16px" }}
              disabled={isPosting || !statusText.trim()}
              onClick={async () => {
                setIsPosting(true);
                const res = await postOpportunity(username, userData.role, statusText, requiredSkills);
                if (res.success) {
                  alert("Opportunity posted! Everyone will see this in their Inbox.");
                  setStatusText("");
                  setRequiredSkills("");
                } else {
                  alert("Failed to post: " + res.msg);
                }
                setIsPosting(false);
              }}
            >
              {isPosting ? "TRANSMITTING..." : "POST OPPORTUNITY"}
            </button>
          </div>
        )}

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
      {renderProfileModal()}
    </div>
  );
}

export default Welcome;
