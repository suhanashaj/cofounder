import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers, approveUserAPI, rejectUserAPI, getAllConnections, logout } from "../utils/api";
import "../css/dashboard.css";

function Admin() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("analytics");
    const [categoryView, setCategoryView] = useState(null); // Array of users to show in modal
    const [categoryName, setCategoryName] = useState("");

    const viewCategory = (type) => {
        let filtered = [];
        let name = "";

        if (type === "all") {
            filtered = users;
            name = "All Users";
        } else if (type === "founders") {
            filtered = users.filter(u => u.role === "Founder" || u.role === "user" || !u.role);
            name = "Founders";
        } else if (type === "cofounders") {
            filtered = users.filter(u => u.role?.toLowerCase() === "co-founder" || u.role?.toLowerCase() === "cofounder");
            name = "Co-Founders";
        } else if (type === "pending") {
            filtered = users.filter(u => (!u.certificateApproved || !u.profileApproved) && u.role !== "Admin");
            name = "Pending Approvals";
        } else if (type === "connections") {
            filtered = connections;
            name = "Connections";
        }

        setCategoryView(filtered);
        setCategoryName(name);
    };

    const closeCategoryView = () => {
        setCategoryView(null);
        setCategoryName("");
    };

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

    const handleApprove = async (username, type) => {
        const res = await approveUserAPI(username, type);
        alert(res.msg);
        if (res.success) {
            fetchData();
        }
    };

    const handleReject = async (username, type) => {
        const reason = window.prompt(`Please enter a reason for rejecting this ${type}:`);
        if (reason !== null) { // If not cancelled
            const res = await rejectUserAPI(username, type, reason || "No reason provided");
            alert(res.msg);
            if (res.success) {
                fetchData();
            }
        }
    };





    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const pendingUsers = users.filter(u => (!u.certificateApproved || !u.profileApproved) && u.role !== "Admin");
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
                        <div className="stat-card" onClick={() => viewCategory("all")} style={{ cursor: "pointer" }}>
                            <div className="stat-header">
                                <div className="stat-icon" style={{ backgroundColor: "rgba(99, 102, 241, 0.1)", color: "#6366f1" }}>👥</div>
                            </div>
                            <div className="stat-value">{users.length}</div>
                            <div className="stat-label">Total Users</div>
                        </div>
                        <div className="stat-card" onClick={() => viewCategory("founders")} style={{ cursor: "pointer" }}>
                            <div className="stat-header">
                                <div className="stat-icon" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>👑</div>
                            </div>
                            <div className="stat-value">{founderCount}</div>
                            <div className="stat-label">Founders</div>
                        </div>
                        <div className="stat-card" onClick={() => viewCategory("cofounders")} style={{ cursor: "pointer" }}>
                            <div className="stat-header">
                                <div className="stat-icon" style={{ backgroundColor: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" }}>🤝</div>
                            </div>
                            <div className="stat-value">{coFounderCount}</div>
                            <div className="stat-label">Co-founders</div>
                        </div>
                        <div className="stat-card" onClick={() => viewCategory("connections")} style={{ cursor: "pointer" }}>
                            <div className="stat-header">
                                <div className="stat-icon" style={{ backgroundColor: "rgba(236, 72, 153, 0.1)", color: "#ec4899" }}>🖇️</div>
                            </div>
                            <div className="stat-value">{connectionCount}</div>
                            <div className="stat-label">Connections</div>
                        </div>
                        <div className="stat-card" onClick={() => viewCategory("pending")} style={{ cursor: "pointer" }}>
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
                                    <tr style={{ borderBottom: "1px solid var(--border-glass)", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                        <th style={{ padding: "15px 30px" }}>USER</th>
                                        <th style={{ padding: "15px 30px" }}>ROLE</th>
                                        <th style={{ padding: "15px 30px" }}>CERTIFICATE</th>
                                        <th style={{ padding: "15px 30px" }}>PROFILE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingUsers.length > 0 ? pendingUsers.map((user, idx) => (
                                        <tr key={idx} style={{ borderBottom: "1px solid var(--border-glass)" }}>
                                            <td style={{ padding: "20px 30px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                    <div style={{ position: "relative" }}>
                                                        <img
                                                            src={user.profilePicUrl || `https://ui-avatars.com/api/?name=${user.username}&background=6366f1&color=fff&bold=true`}
                                                            alt="Avatar"
                                                            style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                                                        />
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
                                                    {user.role || 'User'}
                                                </span>
                                            </td>

                                            {/* CERTIFICATE COLUMN */}
                                            <td style={{ padding: "20px 30px" }}>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}>
                                                    {user.certificateUrl ? (
                                                        <a href={user.certificateUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#6366f1", fontSize: "0.8rem" }}>
                                                            View Doc
                                                        </a>
                                                    ) : <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No Doc</span>}

                                                    {user.certificateApproved ? (
                                                        <span style={{ color: "var(--success)", fontSize: "0.8rem", fontWeight: "bold" }}>✓ Verified</span>
                                                    ) : user.certificateRejected ? (
                                                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                            <span style={{ color: "var(--danger)", fontSize: "0.8rem", fontWeight: "bold" }}>✕ Rejected</span>
                                                            <button
                                                                className="action-btn"
                                                                style={{ padding: "2px 8px", fontSize: "0.65rem", background: "none", border: "1px solid var(--border-glass)", color: "var(--text-main)" }}
                                                                onClick={() => handleApprove(user.username, 'certificate')}
                                                            >
                                                                Approve
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: "flex", gap: "5px" }}>
                                                            <button
                                                                className="action-btn"
                                                                style={{ padding: "4px 12px", fontSize: "0.7rem" }}
                                                                onClick={() => handleApprove(user.username, 'certificate')}
                                                            >
                                                                Verify Doc
                                                            </button>
                                                            <button
                                                                className="action-btn"
                                                                style={{ padding: "4px 12px", fontSize: "0.7rem", backgroundColor: "var(--danger)", color: "white" }}
                                                                onClick={() => handleReject(user.username, 'certificate')}
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* PROFILE COLUMN */}
                                            <td style={{ padding: "20px 30px" }}>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}>
                                                    {user.profileApproved ? (
                                                        <span style={{ color: "var(--success)", fontSize: "0.8rem", fontWeight: "bold" }}>✓ Approved</span>
                                                    ) : user.profileRejected ? (
                                                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                            <span style={{ color: "var(--danger)", fontSize: "0.8rem", fontWeight: "bold" }}>✕ Rejected</span>
                                                            <button
                                                                className="action-btn"
                                                                style={{ padding: "2px 8px", fontSize: "0.65rem", background: "none", border: "1px solid var(--border-glass)", color: "var(--text-main)" }}
                                                                onClick={() => handleApprove(user.username, 'profile')}
                                                            >
                                                                Approve
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: "flex", gap: "5px" }}>
                                                            <button
                                                                className="action-btn"
                                                                style={{ padding: "4px 12px", fontSize: "0.7rem", backgroundColor: "#10b981", color: "white" }}
                                                                onClick={() => handleApprove(user.username, 'profile')}
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                className="action-btn"
                                                                style={{ padding: "4px 12px", fontSize: "0.7rem", backgroundColor: "var(--danger)", color: "white" }}
                                                                onClick={() => handleReject(user.username, 'profile')}
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
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


            {/* USER LIST MODAL */}
            {
                categoryView && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                        backdropFilter: 'blur(8px)'
                    }}>
                        <div style={{
                            width: '80%', maxHeight: '80%', overflowY: 'auto', background: 'var(--card-bg)',
                            padding: '30px', borderRadius: '20px', border: '1px solid var(--border-glass)',
                            position: 'relative', boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
                        }}>
                            <button onClick={closeCategoryView} style={{
                                position: 'absolute', right: '20px', top: '20px', background: 'rgba(255,255,255,0.1)', border: 'none',
                                color: 'white', width: "32px", height: "32px", borderRadius: "50%", cursor: 'pointer', display: "flex", alignItems: "center", justifyContent: "center"
                            }}>✕</button>

                            <h2 style={{ marginBottom: '20px', fontSize: "1.5rem" }}>{categoryName} List</h2>

                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                                    {categoryName === "Connections" ? (
                                        <>
                                            <thead>
                                                <tr style={{ borderBottom: "1px solid var(--border-glass)", color: "var(--text-muted)" }}>
                                                    <th style={{ padding: "15px" }}>From User</th>
                                                    <th style={{ padding: "15px" }}>To User</th>
                                                    <th style={{ padding: "15px" }}>Status</th>
                                                    <th style={{ padding: "15px" }}>Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {categoryView.length > 0 ? categoryView.map((conn, i) => (
                                                    <tr key={i} style={{ borderBottom: "1px solid var(--border-glass)" }}>
                                                        <td style={{ padding: "15px", fontWeight: "bold" }}>{conn.from}</td>
                                                        <td style={{ padding: "15px", fontWeight: "bold" }}>{conn.to}</td>
                                                        <td style={{ padding: "15px" }}>
                                                            <span style={{
                                                                padding: "4px 10px",
                                                                backgroundColor: conn.status === 'accepted' ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                                                                color: conn.status === 'accepted' ? "#10b981" : "#f59e0b",
                                                                borderRadius: "15px", fontSize: "0.75rem", fontWeight: "600"
                                                            }}>
                                                                {conn.status}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: "15px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                                            {conn.timestamp ? new Date(conn.timestamp.seconds * 1000).toLocaleDateString() : "N/A"}
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan="4" style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>No connections found.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </>
                                    ) : (
                                        <>
                                            <thead>
                                                <tr style={{ borderBottom: "1px solid var(--border-glass)", color: "var(--text-muted)" }}>
                                                    <th style={{ padding: "15px" }}>User</th>
                                                    <th style={{ padding: "15px" }}>Role</th>
                                                    <th style={{ padding: "15px" }}>Status</th>
                                                    <th style={{ padding: "15px" }}>Details</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {categoryView.length > 0 ? categoryView.map((u, i) => (
                                                    <tr key={i} style={{ borderBottom: "1px solid var(--border-glass)" }}>
                                                        <td style={{ padding: "15px" }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <img
                                                                    src={u.profilePicUrl || `https://ui-avatars.com/api/?name=${u.username}&background=6366f1&color=fff&bold=true`}
                                                                    alt={u.username}
                                                                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: "cover" }}
                                                                />
                                                                <div>
                                                                    <div style={{ fontWeight: 'bold' }}>{u.username}</div>
                                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: "15px" }}>
                                                            <span style={{ padding: "4px 10px", backgroundColor: "rgba(99, 102, 241, 0.1)", color: "#818cf8", borderRadius: "15px", fontSize: "0.75rem", fontWeight: "600" }}>
                                                                {u.role || 'User'}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: "15px" }}>
                                                            {u.certificateApproved ? (
                                                                <span style={{ color: "var(--success)" }}>Verified</span>
                                                            ) : (
                                                                <span style={{ color: "var(--text-muted)" }}>Unverified</span>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: "15px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                                            {u.experience ? `${u.experience} exp` : "No exp data"} • {u.domain || "No domain"}
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan="4" style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>No users found in this category.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </>
                                    )}
                                </table>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
}

export default Admin;
