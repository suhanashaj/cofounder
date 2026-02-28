import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOpportunities, logout, getCurrentUserProfile, sendConnectionRequest, getConnectionRequests, getDirectDriveLink } from "../utils/api";
import "../css/dashboard.css";

function Notifications() {
    const navigate = useNavigate();
    const username = sessionStorage.getItem("loggedInUser");
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myConnections, setMyConnections] = useState([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userData, setUserData] = useState(null);
    const cachedProfilePic = getDirectDriveLink(sessionStorage.getItem("userProfilePic"));

    useEffect(() => {
        // Apply full-screen class to body for this page
        document.body.classList.add("full-screen-page");

        const fetchData = async () => {
            const [opps, profile, connections] = await Promise.all([
                getOpportunities(),
                getCurrentUserProfile(),
                getConnectionRequests(username)
            ]);

            let filteredOpps = opps;
            if (profile.success && profile.data) {
                setUserData(profile.data);
                const extractSkills = (s) => {
                    if (Array.isArray(s)) return s.map(skill => skill.name.toLowerCase());
                    if (typeof s === 'string') return s.toLowerCase().split(',').map(item => item.trim()).filter(item => item);
                    return [];
                };
                const userSkills = extractSkills(profile.data.skills);

                filteredOpps = opps.filter(opp => {
                    if (opp.username === username) return true;
                    if (!opp.skills) return true;
                    const oppSkills = opp.skills.toLowerCase().split(',').map(s => s.trim());
                    return oppSkills.some(skill => userSkills.includes(skill));
                });
            }

            setOpportunities(filteredOpps);
            setMyConnections(connections);
            setLoading(false);
        };
        fetchData();

        return () => {
            document.body.classList.remove("full-screen-page");
        };
    }, [username]);

    const handleConnect = async (targetUser) => {
        const res = await sendConnectionRequest(username, targetUser);
        alert(res.msg);
        if (res.success) {
            const updatedCons = await getConnectionRequests(username);
            setMyConnections(updatedCons);
        }
    };

    const getConnectionStatus = (targetUser) => {
        if (targetUser === username) return "self";
        const conn = myConnections.find(c => c.to === targetUser || c.from === targetUser);
        return conn ? conn.status : null;
    };

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    if (loading) return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "var(--primary-bg)" }}>
            <div className="loader-aura"></div>
            <p style={{ color: "var(--accent-color)", fontWeight: "800" }}>LOADING INBOX...</p>
        </div>
    );

    return (
        <div className="dashboard-wrapper">
            <button className="mobile-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? "✕" : "☰"}
            </button>

            <aside className={`sidebar ${isMenuOpen ? "mobile-open" : ""}`}>
                <div className="sidebar-logo" onClick={() => navigate("/welcome")} style={{ cursor: "pointer" }}>Cofounder.</div>

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
                    <li className="nav-item" onClick={() => navigate("/welcome")}>
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
                    <li className="nav-item active" onClick={() => navigate("/inbox")}>
                        <span>📥</span> Inbox
                    </li>
                    <li className="nav-item" onClick={() => navigate("/help-center")}>
                        <span>❓</span> Help Center
                    </li>
                </ul>
                <div className="nav-item logout-item" onClick={handleLogout} style={{ marginTop: "auto" }}>
                    <span>🚪</span> Logout
                </div>
            </aside>

            {isMenuOpen && <div className="sidebar-backdrop" onClick={() => setIsMenuOpen(false)}></div>}

            <main className="main-content">
                <header className="header-section">
                    <div className="welcome-text">
                        <h1>Inbox & Notifications</h1>
                        <p>Stay updated with the latest opportunities from founders.</p>
                    </div>
                </header>

                <div className="notifications-list" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {opportunities.length === 0 ? (
                        <div className="stat-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                            <span style={{ fontSize: "3rem", display: "block", marginBottom: "20px" }}>📭</span>
                            No notifications yet. Opportunities posted by founders will appear here.
                        </div>
                    ) : (
                        opportunities.map((opp) => (
                            <div key={opp.id} className="stat-card" style={{
                                padding: "24px",
                                borderRadius: "24px",
                                border: "1px solid var(--border-glass)",
                                background: "rgba(255, 255, 255, 0.02)",
                                transition: "transform 0.3s ease"
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{
                                            width: "40px",
                                            height: "40px",
                                            borderRadius: "12px",
                                            background: "var(--accent-color)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "1.2rem"
                                        }}>
                                            💡
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: "1.1rem", color: "white" }}>{opp.username}</h3>
                                            <span style={{ fontSize: "0.8rem", color: "var(--accent-color)", fontWeight: "700" }}>{opp.role?.toUpperCase()}</span>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                        {opp.timestamp?.toDate ? opp.timestamp.toDate().toLocaleDateString() : "Just now"}
                                    </span>
                                </div>

                                <p style={{ color: "var(--text-main)", fontSize: "1rem", lineHeight: "1.6", margin: "0 0 16px 0" }}>
                                    "{opp.text}"
                                </p>

                                {opp.skills && (
                                    <div className="skills-container" style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                        {opp.skills.split(',').map((skill, idx) => (
                                            <span key={idx} className="skill-pill" style={{ fontSize: "0.75rem", padding: "4px 12px" }}>
                                                {skill.trim()}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div style={{ marginTop: "20px" }}>
                                    {getConnectionStatus(opp.username) === "accepted" ? (
                                        <button
                                            className="action-btn"
                                            style={{ padding: "10px 24px", fontSize: "0.85rem", background: "linear-gradient(135deg, #10b981, #059669)", color: "white" }}
                                            onClick={() => navigate(`/messages?user=${opp.username}`)}
                                        >
                                            OPEN CHAT
                                        </button>
                                    ) : getConnectionStatus(opp.username) === "pending" ? (
                                        <button
                                            className="action-btn"
                                            disabled
                                            style={{ padding: "10px 24px", fontSize: "0.85rem", background: "rgba(255, 255, 255, 0.05)", color: "var(--text-muted)", cursor: "not-allowed", border: "1px solid var(--border-glass)" }}
                                        >
                                            REQUEST PENDING
                                        </button>
                                    ) : getConnectionStatus(opp.username) === "self" ? (
                                        <span style={{ fontSize: "0.85rem", color: "var(--accent-color)", fontWeight: "700" }}>YOUR POST</span>
                                    ) : (
                                        <button
                                            className="action-btn"
                                            style={{ padding: "10px 24px", fontSize: "0.85rem" }}
                                            onClick={() => handleConnect(opp.username)}
                                        >
                                            SEND CONNECT REQUEST
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}

export default Notifications;
