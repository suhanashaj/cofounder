import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers, approveUserAPI, getAllConnections, logout } from "../utils/api";
import "../css/dashboard.css";

function Admin() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("analytics");

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
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [userData, connectionData] = await Promise.all([
            getUsers(),
            getAllConnections()
        ]);
        setUsers(userData);
        setConnections(connectionData);
        setLoading(false);
    };

    const handleApprove = async (username) => {
        const res = await approveUserAPI(username);
        alert(res.msg);
        if (res.success) {
            fetchData();
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const pendingUsers = users.filter(u => !u.certificateApproved && u.role !== "Admin");
    const founderCount = users.filter(u => u.role === "Founder" || u.role === "user" || !u.role).length;
    const coFounderCount = users.filter(u => u.role?.toLowerCase() === "co-founder" || u.role?.toLowerCase() === "cofounder").length;
    const connectionCount = connections.length;

    return (
        <div className="dashboard-wrapper">
            <aside className="sidebar">
                <div className="sidebar-logo">Admin Panel</div>
                <ul className="nav-menu">
                    <li
                        className={`nav-item ${activeTab === "analytics" ? "active" : ""}`}
                        onClick={() => setActiveTab("analytics")}
                    >
                        <span>📊</span> Analytics
                    </li>
                    <li
                        className={`nav-item ${activeTab === "verifications" ? "active" : ""}`}
                        onClick={() => setActiveTab("verifications")}
                    >
                        <span>🛡️</span> Verifications
                    </li>
                </ul>
                <div className="nav-item logout-item" onClick={handleLogout}>
                    <span>🚪</span> Logout
                </div>
            </aside>

            <main className="main-content">
                <header className="header-section">
                    <div className="welcome-text">
                        <h1>{activeTab === "analytics" ? "Platform Analytics" : "User Verifications"}</h1>
                        <p>
                            {activeTab === "analytics"
                                ? "Monitor platform growth and user engagement."
                                : "Review and verify co-founder certifications."}
                        </p>
                    </div>
                </header>

                {activeTab === "analytics" ? (
                    <section className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon" style={{ backgroundColor: "rgba(99, 102, 241, 0.1)", color: "#6366f1" }}>👥</div>
                            </div>
                            <div className="stat-value">{users.length}</div>
                            <div className="stat-label">Total Users</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>👑</div>
                            </div>
                            <div className="stat-value">{founderCount}</div>
                            <div className="stat-label">Founders</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon" style={{ backgroundColor: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" }}>🤝</div>
                            </div>
                            <div className="stat-value">{coFounderCount}</div>
                            <div className="stat-label">Co-founders</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon" style={{ backgroundColor: "rgba(236, 72, 153, 0.1)", color: "#ec4899" }}>🖇️</div>
                            </div>
                            <div className="stat-value">{connectionCount}</div>
                            <div className="stat-label">Connections</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>⏳</div>
                            </div>
                            <div className="stat-value">{pendingUsers.length}</div>
                            <div className="stat-label">Pending Approval</div>
                        </div>
                    </section>
                ) : (
                    <div className="progress-section" style={{ padding: "0" }}>
                        <h2 style={{ padding: "30px 30px 10px", fontSize: "1.2rem" }}>Pending Verifications</h2>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid #e2e8f0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                        <th style={{ padding: "15px 30px" }}>USER</th>
                                        <th style={{ padding: "15px 30px" }}>ROLE</th>
                                        <th style={{ padding: "15px 30px" }}>CERTIFICATE</th>
                                        <th style={{ padding: "15px 30px" }}>STATUS</th>
                                        <th style={{ padding: "15px 30px" }}>ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingUsers.length > 0 ? pendingUsers.map((user, idx) => (
                                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "20px 30px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                    <div style={{ position: "relative" }}>
                                                        <img
                                                            src={user.profilePicUrl || `https://ui-avatars.com/api/?name=${user.username}&background=6366f1&color=fff&bold=true`}
                                                            alt="Avatar"
                                                            style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                                                        />
                                                        {/* AVATAR watermark for pre-selected avatars */}
                                                        {user.profilePicUrl && professionalAvatars.includes(user.profilePicUrl) && (
                                                            <div style={{
                                                                position: "absolute",
                                                                top: "2px",
                                                                left: "2px",
                                                                background: "rgba(0, 0, 0, 0.75)",
                                                                color: "white",
                                                                padding: "1px 4px",
                                                                borderRadius: "3px",
                                                                fontSize: "0.45rem",
                                                                fontWeight: "800",
                                                                letterSpacing: "0.3px",
                                                                backdropFilter: "blur(4px)",
                                                                border: "1px solid rgba(255, 255, 255, 0.2)"
                                                            }}>
                                                                AVATAR
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <strong>{user.username}</strong>
                                                        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: "20px 30px" }}>
                                                <span style={{ padding: "4px 10px", backgroundColor: "#ede9fe", color: "#6366f1", borderRadius: "15px", fontSize: "0.75rem", fontWeight: "600" }}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: "20px 30px" }}>
                                                {user.certificateUrl ? (
                                                    <a
                                                        href={user.certificateUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ color: "#6366f1", textDecoration: "none", fontSize: "0.85rem", fontWeight: "600" }}
                                                    >
                                                        📄 View Certificate
                                                    </a>
                                                ) : (
                                                    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No certificate</span>
                                                )}
                                            </td>
                                            <td style={{ padding: "20px 30px" }}>
                                                <span style={{ padding: "4px 10px", backgroundColor: "#fef3c7", color: "#92400e", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "600" }}>Pending</span>
                                            </td>
                                            <td style={{ padding: "20px 30px" }}>
                                                <button
                                                    className="action-btn"
                                                    style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                                                    onClick={() => {
                                                        if (!user.certificateUrl) {
                                                            const confirm = window.confirm(`${user.username} has not uploaded a certificate. Approve anyway?`);
                                                            if (confirm) handleApprove(user.username);
                                                        } else {
                                                            handleApprove(user.username);
                                                        }
                                                    }}
                                                >
                                                    Approve
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>
                                                {loading ? "Loading users..." : "No users pending verification."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Admin;
