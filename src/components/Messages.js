import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getConnectionRequests, updateConnectionStatus, logout } from "../utils/api";
import "../css/dashboard.css";

function Messages() {
    const navigate = useNavigate();
    const username = localStorage.getItem("loggedInUser");
    const [connections, setConnections] = useState([]);

    const fetchConnections = useCallback(async () => {
        const data = await getConnectionRequests(username);
        setConnections(data);
    }, [username]);

    useEffect(() => {
        fetchConnections();
    }, [fetchConnections]);

    const handleStatusUpdate = async (connId, status) => {
        const res = await updateConnectionStatus(connId, status);
        if (res.success) {
            fetchConnections();
        } else {
            alert(res.msg);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const pendingRequests = connections.filter(c => c.to === username && c.status === "pending");
    const acceptedMatches = connections.filter(c => c.status === "accepted");

    return (
        <div className="dashboard-wrapper">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">Cofounder.</div>
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
                    <li className="nav-item active" onClick={() => navigate("/messages")}>
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
                        <h1>Connections & Messages</h1>
                        <p>Manage your partnerships and start collaborating.</p>
                    </div>
                </header>

                <div className="profile-grid-layout" style={{ gridTemplateColumns: "1fr 1fr", gap: "30px", padding: "0" }}>
                    {/* Left: Pending Requests */}
                    <section>
                        <h2 style={{ marginBottom: "20px", fontSize: "1.2rem" }}>Connection Requests</h2>
                        {pendingRequests.length > 0 ? (
                            pendingRequests.map((req) => (
                                <div key={req.id} className="stat-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                                    <div>
                                        <strong style={{ fontSize: "1.1rem" }}>{req.from}</strong>
                                        <p style={{ margin: "5px 0 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>wants to connect with you</p>
                                    </div>
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <button
                                            className="action-btn"
                                            style={{ padding: "8px 16px", backgroundColor: "#10b981" }}
                                            onClick={() => handleStatusUpdate(req.id, "accepted")}
                                        > Accept </button>
                                        <button
                                            className="secondary-btn"
                                            style={{ padding: "8px 16px", color: "#ef4444" }}
                                            onClick={() => handleStatusUpdate(req.id, "rejected")}
                                        > Decline </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="stat-card" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                                No pending requests
                            </div>
                        )}
                    </section>

                    {/* Right: Accepted Matches / Chat */}
                    <section>
                        <h2 style={{ marginBottom: "20px", fontSize: "1.2rem" }}>My Matches</h2>
                        {acceptedMatches.length > 0 ? (
                            acceptedMatches.map((match) => {
                                const partner = match.from === username ? match.to : match.from;
                                return (
                                    <div key={match.id} className="stat-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#6366f1", color: "white", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "12px", fontWeight: "bold" }}>
                                                {partner[0].toUpperCase()}
                                            </div>
                                            <strong>{partner}</strong>
                                        </div>
                                        <button
                                            className="action-btn"
                                            style={{ padding: "8px 16px" }}
                                        > Chat </button>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="stat-card" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                                No active matches yet. Use "Find Partners" to search.
                            </div>
                        )}
                    </section>
                </div>

                {/* Coming Soon Chat Modal Placeholder */}
                <section className="stats-grid" style={{ marginTop: "40px" }}>
                    <div className="stat-card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>
                        <h3>Message Feature Integration</h3>
                        <p style={{ color: "var(--text-muted)" }}>Full real-time chat between accepted matches is being finalized.</p>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default Messages;
