import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers, approveUserAPI, rejectUserAPI, getAllConnections, logout, verifySpecificSkillAPI, sendMessage, getCurrentUserProfile, getDirectDriveLink } from "../utils/api";
import { db } from "../firebase";
import { collection, getDocs, updateDoc, doc, query, orderBy, serverTimestamp } from "firebase/firestore";
import "../css/dashboard.css";
import "../css/modal.css";


function Admin() {
    const navigate = useNavigate();
    const username = sessionStorage.getItem("loggedInUser");
    const cachedProfilePic = getDirectDriveLink(sessionStorage.getItem("userProfilePic"));
    const [userData, setUserData] = useState(null);
    const [users, setUsers] = useState([]);
    const [connections, setConnections] = useState([]);
    const [helpMessages, setHelpMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("analytics");
    const [categoryView, setCategoryView] = useState(null); // Array of users to show in modal
    const [selectedUserSkills, setSelectedUserSkills] = useState(null);
    const [categoryName, setCategoryName] = useState("");
    const [replyTo, setReplyTo] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [isReplying, setIsReplying] = useState(false);
    const [selectedFullUser, setSelectedFullUser] = useState(null);


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


    useEffect(() => {
        document.body.classList.add("full-screen-page");
        fetchData();

        return () => {
            document.body.classList.remove("full-screen-page");
        };
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [userDataResult, connectionData, currentUserProfile] = await Promise.all([
                getUsers(),
                getAllConnections(),
                getCurrentUserProfile()
            ]);
            setUsers(userDataResult);
            setConnections(connectionData);
            if (currentUserProfile.success) {
                setUserData(currentUserProfile.data);
            }

            // Fetch Help Center Messages
            const q = query(collection(db, "helpMessages"), orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(q);
            const messages = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setHelpMessages(messages);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (messageId) => {
        try {
            const messageRef = doc(db, "helpMessages", messageId);
            await updateDoc(messageRef, { status: "read" });

            // Update local state
            setHelpMessages(prev => prev.map(msg =>
                msg.id === messageId ? { ...msg, status: "read" } : msg
            ));
        } catch (error) {
            console.error("Error marking message as read:", error);
            alert("Failed to update status.");
        }
    };

    const handleSendReply = async () => {
        if (!replyTo || !replyText.trim()) return;
        setIsReplying(true);

        try {
            // 1. Mark as Resolved in Firestore
            const messageRef = doc(db, "helpMessages", replyTo.id);
            await updateDoc(messageRef, {
                status: "resolved",
                adminReply: replyText,
                respondedAt: serverTimestamp()
            });

            // 2. Find target user by email or username
            let targetUsername = replyTo.username;
            if (!targetUsername || targetUsername === "anonymous") {
                const userObj = users.find(u => u.email === replyTo.email);
                if (userObj) targetUsername = userObj.username;
            }

            if (targetUsername && targetUsername !== "anonymous") {
                // 3. Send Internal Message
                await sendMessage("Admin", targetUsername, replyText);

                // 4. Update local state
                setHelpMessages(prev => prev.map(msg =>
                    msg.id === replyTo.id ? { ...msg, status: "resolved", adminReply: replyText } : msg
                ));

                setReplyTo(null);
                setReplyText("");
                alert(`Successfully marked as RESOLVED and sent in-app message to ${targetUsername}!`);
            } else {
                // If user is anonymous or not found in system
                alert(`Note: No registered user found with email ${replyTo.email}. Marking as RESOLVED locally, but no in-app message could be sent.`);

                setHelpMessages(prev => prev.map(msg =>
                    msg.id === replyTo.id ? { ...msg, status: "resolved", adminReply: replyText } : msg
                ));
                setReplyTo(null);
                setReplyText("");
            }
        } catch (error) {
            console.error("Error replying to message:", error);
            alert("Database update failed. Please check your connection.");
        } finally {
            setIsReplying(false);
        }
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

    const handleVerifySpecificSkill = async (username, skillName, status) => {
        let reason = "";
        if (status === 'rejected') {
            reason = window.prompt(`Reason for rejecting ${skillName}:`) || "Invalid proof";
        }

        const res = await verifySpecificSkillAPI(username, skillName, status, reason);
        alert(res.msg);
        if (res.success) {
            // Update local user data to reflect change immediately if possible, or just re-fetch
            fetchData();
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

    const renderFullProfileModal = () => {
        if (!selectedFullUser) return null;

        const isFounder = selectedFullUser.role?.toLowerCase() === 'founder';
        const isCoFounder = selectedFullUser.role?.toLowerCase() === 'cofounder' || selectedFullUser.role?.toLowerCase() === 'co-founder';

        return (
            <div className="modal-overlay" onClick={() => setSelectedFullUser(null)}>
                <div className="profile-modal-content" onClick={e => e.stopPropagation()} style={{ border: '2px solid var(--accent-color)' }}>
                    <button className="modal-close-btn" onClick={() => setSelectedFullUser(null)}>✕</button>

                    <div className="profile-modal-header">
                        <img
                            src={getDirectDriveLink(selectedFullUser.profilePicUrl) || `https://ui-avatars.com/api/?name=${selectedFullUser.username}&background=6366f1&color=fff&bold=true&size=200`}
                            alt="Profile"
                            className="modal-avatar"
                            referrerPolicy="no-referrer"
                        />
                        <div className="modal-header-info">
                            <span className="modal-role-badge">{selectedFullUser.role || 'User'}</span>
                            <h2>{selectedFullUser.fullName || selectedFullUser.username}</h2>
                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "15px" }}>
                                <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>📍 {selectedFullUser.location || "Not specified"}</span>
                                {selectedFullUser.workStyle && <span style={{ color: "var(--accent-color)", fontSize: "0.9rem", fontWeight: "700" }}>🏠 {selectedFullUser.workStyle}</span>}
                                {selectedFullUser.email && <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>✉️ {selectedFullUser.email}</span>}
                            </div>
                            <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
                                {selectedFullUser.linkedin && (
                                    <a href={selectedFullUser.linkedin} target="_blank" rel="noreferrer" style={{ color: "white", fontSize: "1.2rem", opacity: 0.8 }}>
                                        <i className="fab fa-linkedin"></i>
                                    </a>
                                )}
                                {selectedFullUser.github && (
                                    <a href={selectedFullUser.github} target="_blank" rel="noreferrer" style={{ color: "white", fontSize: "1.2rem", opacity: 0.8 }}>
                                        <i className="fab fa-github"></i>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="modal-details-grid">
                        <div className="modal-detail-card">
                            <h4>About</h4>
                            <p>{selectedFullUser.about || "No bio provided."}</p>
                        </div>

                        <div className="modal-detail-card">
                            <h4>Industry & Domain</h4>
                            <p>{selectedFullUser.domain || "Not specified"}</p>
                        </div>

                        {isFounder && (
                            <>
                                <div className="modal-detail-card" style={{ gridColumn: "1 / -1" }}>
                                    <h4>Startup Idea Description</h4>
                                    <p>{selectedFullUser.startupIdea || "No idea details provided."}</p>
                                </div>
                                <div className="modal-detail-card">
                                    <h4>Company Name</h4>
                                    <p>{selectedFullUser.companyName || "N/A"}</p>
                                </div>
                                <div className="modal-detail-card">
                                    <h4>Startup Stage</h4>
                                    <p>{selectedFullUser.startupStage || "N/A"}</p>
                                </div>
                            </>
                        )}

                        {isCoFounder && (
                            <>
                                <div className="modal-detail-card">
                                    <h4>Skills</h4>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                                        {Array.isArray(selectedFullUser.skills) ? selectedFullUser.skills.map((s, i) => (
                                            <span key={i} style={{ fontSize: "0.8rem", background: "rgba(99,102,241,0.1)", padding: "5px 10px", borderRadius: "5px", color: "white" }}>
                                                {s.name} {s.verified ? "✅" : ""}
                                            </span>
                                        )) : selectedFullUser.skills || "Not specified"}
                                    </div>
                                </div>
                                {selectedFullUser.experience && (
                                    <div className="modal-detail-card">
                                        <h4>Experience</h4>
                                        <p>{selectedFullUser.experience}</p>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="modal-detail-card">
                            <h4>Verification Status</h4>
                            <p>Certificate: {selectedFullUser.certificateApproved ? "✅ APPROVED" : (selectedFullUser.certificateRejected ? "❌ REJECTED" : "⏳ PENDING")}</p>
                            <p>Profile: {selectedFullUser.profileApproved ? "✅ APPROVED" : (selectedFullUser.profileRejected ? "❌ REJECTED" : "⏳ PENDING")}</p>
                        </div>
                    </div>

                    <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                        {(!selectedFullUser.certificateApproved || !selectedFullUser.profileApproved) && (
                            <div style={{ padding: "15px", background: "rgba(245, 158, 11, 0.1)", borderRadius: "12px", border: "1px solid rgba(245, 158, 11, 0.2)", width: "100%" }}>
                                <p style={{ fontSize: "0.85rem", color: "#f59e0b", margin: 0 }}>Reviewing this user will remove them from the pending list.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };


    return (
        <div className="dashboard-wrapper">
            <aside className="sidebar">
                <div className="sidebar-logo">Admin Panel</div>

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
                    <li
                        className={`nav-item ${activeTab === "analytics" ? "active" : ""}`}
                        onClick={() => setActiveTab("analytics")}
                    >
                        <span>📊</span> Ecosystem Hub
                    </li>
                    <li
                        className={`nav-item ${activeTab === "verifications" ? "active" : ""}`}
                        onClick={() => setActiveTab("verifications")}
                    >
                        <span>🛡️</span> Expert Verification
                    </li>
                    <li
                        className={`nav-item ${activeTab === "messages" ? "active" : ""}`}
                        onClick={() => setActiveTab("messages")}
                    >
                        <span>📨</span> Founder Inquiries
                    </li>
                </ul>
                <div className="nav-item logout-item" onClick={handleLogout}>
                    <span>🚪</span> Logout
                </div>
            </aside>

            <main className="main-content">
                <header className="header-section">
                    <div className="welcome-text">
                        <h1>
                            {activeTab === "analytics"
                                ? "Ecosystem Overview"
                                : activeTab === "messages"
                                    ? "Founder Support Tickets"
                                    : "Expert Review Queue"}
                        </h1>
                        <p>
                            {activeTab === "analytics"
                                ? "Monitoring platform vitality and connection health."
                                : activeTab === "messages"
                                    ? "Assisting founders and experts with platform needs."
                                    : "Ensuring high-integrity profiles for the community."}
                        </p>
                    </div>
                </header>

                {activeTab === "analytics" ? (
                    <section className="stats-grid">
                        <div className="stat-card" onClick={() => viewCategory("all")}>
                            <div className="stat-header">
                                <div className="stat-icon" style={{ backgroundColor: "rgba(99, 102, 241, 0.15)", color: "#6366f1" }}>👥</div>
                            </div>
                            <div className="stat-value">{users.length}</div>
                            <div className="stat-label">Total Visionaries</div>
                            <div className="stat-footer">Audit ecosystem map <span>→</span></div>
                        </div>
                        <div className="stat-card" onClick={() => viewCategory("founders")}>
                            <div className="stat-header">
                                <div className="stat-icon" style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>🚀</div>
                            </div>
                            <div className="stat-value">{founderCount}</div>
                            <div className="stat-label">Venture Founders</div>
                            <div className="stat-footer">Review leads <span>→</span></div>
                        </div>
                        <div className="stat-card" onClick={() => viewCategory("cofounders")}>
                            <div className="stat-header">
                                <div className="stat-icon" style={{ backgroundColor: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6" }}>💡</div>
                            </div>
                            <div className="stat-value">{coFounderCount}</div>
                            <div className="stat-label">Matching Experts</div>
                            <div className="stat-footer">Audit expert pool <span>→</span></div>
                        </div>
                        <div className="stat-card" onClick={() => viewCategory("connections")}>
                            <div className="stat-header">
                                <div className="stat-icon" style={{ backgroundColor: "rgba(236, 72, 153, 0.15)", color: "#ec4899" }}>🤝</div>
                            </div>
                            <div className="stat-value">{connectionCount}</div>
                            <div className="stat-label">Successful Matchings</div>
                            <div className="stat-footer">Ecosystem pairings <span>→</span></div>
                        </div>
                        <div className="stat-card" onClick={() => viewCategory("pending")}>
                            <div className="stat-header">
                                <div className="stat-icon" style={{ backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>⏳</div>
                            </div>
                            <div className="stat-value">{pendingUsers.length}</div>
                            <div className="stat-label">Pending Approval</div>
                            <div className="stat-footer">Review verifications <span>→</span></div>
                        </div>
                    </section>
                ) : activeTab === "messages" ? (
                    <div className="progress-section" style={{ padding: "0" }}>
                        <h2 style={{ padding: "30px 30px 10px", fontSize: "1.2rem" }}>Help Center Messages</h2>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid var(--border-glass)", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                        <th style={{ padding: "15px 30px" }}>NAME & EMAIL</th>
                                        <th style={{ padding: "15px 30px" }}>SUBJECT</th>
                                        <th style={{ padding: "15px 30px" }}>MESSAGE</th>
                                        <th style={{ padding: "15px 30px" }}>DATE</th>
                                        <th style={{ padding: "15px 30px" }}>STATUS</th>
                                        <th style={{ padding: "15px 30px" }}>ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {helpMessages.length > 0 ? helpMessages.map((msg, idx) => (
                                        <tr key={idx} style={{ borderBottom: "1px solid var(--border-glass)", opacity: msg.status === 'read' ? 0.7 : 1 }}>
                                            <td style={{ padding: "20px 30px" }}>
                                                <div>
                                                    <strong style={{ display: "block" }}>{msg.name}</strong>
                                                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{msg.email}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: "20px 30px" }}>
                                                <span style={{ fontWeight: "600" }}>{msg.subject}</span>
                                            </td>
                                            <td style={{ padding: "20px 30px", maxWidth: "300px" }}>
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: "0.85rem",
                                                    color: "var(--text-main)",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis"
                                                }} title={msg.message}>
                                                    {msg.message}
                                                </p>
                                            </td>
                                            <td style={{ padding: "20px 30px", whiteSpace: "nowrap", fontSize: "0.85rem" }}>
                                                {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleString() : "Recently"}
                                            </td>
                                            <td style={{ padding: "20px 30px" }}>
                                                <span style={{
                                                    padding: "4px 10px",
                                                    backgroundColor: msg.status === 'unread' ? "rgba(239, 68, 68, 0.1)" : msg.status === 'resolved' ? "rgba(16, 185, 129, 0.1)" : "rgba(99, 102, 241, 0.1)",
                                                    color: msg.status === 'unread' ? "#ef4444" : msg.status === 'resolved' ? "#10b981" : "#6366f1",
                                                    borderRadius: "15px",
                                                    fontSize: "0.75rem",
                                                    fontWeight: "600",
                                                    textTransform: "capitalize"
                                                }}>
                                                    {msg.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: "20px 30px" }}>
                                                <div style={{ display: "flex", gap: "10px" }}>
                                                    {msg.status === 'unread' && (
                                                        <button
                                                            className="action-btn"
                                                            onClick={() => handleMarkAsRead(msg.id)}
                                                            style={{ padding: "6px 12px", fontSize: "0.75rem" }}
                                                        >
                                                            Mark Read
                                                        </button>
                                                    )}
                                                    <button
                                                        className="action-btn"
                                                        onClick={() => setReplyTo(msg)}
                                                        style={{ padding: "6px 12px", fontSize: "0.75rem", backgroundColor: "#6366f1", color: "white" }}
                                                    >
                                                        {msg.status === 'resolved' ? "Resend Reply" : "Reply"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="6" style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>
                                                {loading ? "Loading messages..." : "No help messages found."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : activeTab === "skills" ? (
                    <div className="progress-section" style={{ padding: "30px" }}>
                        <h2>Skill Verification Requests</h2>
                        <div className="admin-skills-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px", marginTop: "20px" }}>
                            {users.filter(u => Array.isArray(u.skills) && u.skills.some(s => s.status === 'pending')).map(user => (
                                <div key={user.username} className="stat-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                                        <img
                                            src={getDirectDriveLink(user.profilePicUrl) || `https://ui-avatars.com/api/?name=${user.username}&background=6366f1&color=fff`}
                                            alt={user.username}
                                            style={{ width: "50px", height: "50px", borderRadius: "50%" }}
                                            referrerPolicy="no-referrer"
                                        />
                                        <div>
                                            <div style={{ fontWeight: "800", fontSize: "1.1rem" }}>{user.fullName || user.username}</div>
                                            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                                {user.skills.filter(s => s.status === 'pending').length} pending skill(s)
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        className="action-btn"
                                        onClick={() => setSelectedUserSkills(user)}
                                    >
                                        Review Skills
                                    </button>
                                </div>
                            ))}
                            {users.filter(u => Array.isArray(u.skills) && u.skills.some(s => s.status === 'pending')).length === 0 && (
                                <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>No pending skill verifications.</p>
                            )}
                        </div>

                        {selectedUserSkills && (
                            <div className="modal-overlay" style={{
                                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100,
                                backdropFilter: 'blur(10px)'
                            }}>
                                <div className="modal-content" style={{
                                    width: '800px', background: 'var(--card-bg)', padding: '40px', borderRadius: '32px',
                                    border: '1px solid var(--border-glass)', boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                                    maxHeight: '90vh', overflowY: 'auto'
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                                        <h2>Skills Review: {selectedUserSkills.fullName || selectedUserSkills.username}</h2>
                                        <button onClick={() => setSelectedUserSkills(null)} style={{ background: "none", border: "none", color: "white", fontSize: "1.5rem", cursor: "pointer" }}>✕</button>
                                    </div>

                                    <div className="skills-admin-list" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                        {selectedUserSkills.skills.filter(s => s.status === 'pending' || s.certificateUrl).map((skill, idx) => (
                                            <div key={idx} style={{
                                                padding: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "20px",
                                                border: "1px solid var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center"
                                            }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
                                                        <span style={{ fontWeight: "700", fontSize: "1.1rem" }}>{skill.name}</span>
                                                        <span style={{
                                                            fontSize: "0.7rem", padding: "2px 8px", borderRadius: "10px",
                                                            background: skill.status === 'pending' ? "#f59e0b" : skill.status === 'approved' ? "#10b981" : "#ef4444",
                                                            color: "white", textTransform: "uppercase", fontWeight: "800"
                                                        }}>
                                                            {skill.status}
                                                        </span>
                                                    </div>
                                                    {skill.certificateUrl ? (
                                                        <a
                                                            href={skill.certificateUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            style={{ color: "var(--accent-color)", textDecoration: "none", fontSize: "0.9rem", fontWeight: "600" }}
                                                        >
                                                            View Evidence Document ↗
                                                        </a>
                                                    ) : (
                                                        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>No document uploaded</span>
                                                    )}
                                                </div>

                                                {skill.status === 'pending' && (
                                                    <div style={{ display: "flex", gap: "10px" }}>
                                                        <button
                                                            className="action-btn"
                                                            style={{ backgroundColor: "#10b981", padding: "8px 16px" }}
                                                            onClick={() => handleVerifySpecificSkill(selectedUserSkills.username, skill.name, 'approved')}
                                                        >
                                                            Verify
                                                        </button>
                                                        <button
                                                            className="action-btn"
                                                            style={{ backgroundColor: "#ef4444", padding: "8px 16px" }}
                                                            onClick={() => handleVerifySpecificSkill(selectedUserSkills.username, skill.name, 'rejected')}
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ marginTop: "40px", textAlign: "right" }}>
                                        <button
                                            className="action-btn"
                                            style={{ background: "none", border: "1px solid var(--border-glass)" }}
                                            onClick={() => setSelectedUserSkills(null)}
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="verifications-section">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h2 style={{ fontSize: "1.5rem", fontWeight: "800" }}>Pending Verifications</h2>
                            <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>{pendingUsers.length} Users awaiting review</span>
                        </div>

                        <div className="verification-cards-grid">
                            {pendingUsers.length > 0 ? pendingUsers.map((user, idx) => (
                                <div key={idx} className="verification-card" onClick={() => setSelectedFullUser(user)} style={{ cursor: "pointer" }}>
                                    <div className="verification-badge" style={{

                                        backgroundColor: user.role === 'Founder' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                                        color: user.role === 'Founder' ? '#10b981' : '#6366f1'
                                    }}>
                                        {user.role || 'User'}
                                    </div>

                                    <div className="verification-card-header">
                                        <img
                                            src={getDirectDriveLink(user.profilePicUrl) || `https://ui-avatars.com/api/?name=${user.username}&background=6366f1&color=fff&bold=true`}
                                            alt="Avatar"
                                            className="verification-card-avatar"
                                            referrerPolicy="no-referrer"
                                        />
                                        <div className="verification-card-info">
                                            <h3>{user.username}</h3>
                                            <p>{user.email}</p>
                                        </div>
                                    </div>

                                    <div className="verification-card-actions">
                                        <div className="v-action-item">
                                            <span className="v-section-title">Certificate Hook</span>
                                            <div className="v-action-group">
                                                {user.certificateUrl ? (
                                                    <a href={user.certificateUrl} target="_blank" rel="noopener noreferrer" className="v-doc-link" onClick={e => e.stopPropagation()}>
                                                        📄 View Doc ↗
                                                    </a>
                                                ) : <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No document</span>}

                                                <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
                                                    {user.certificateApproved ? (
                                                        <span className="v-status verified">✓ Verified</span>
                                                    ) : user.certificateRejected ? (
                                                        <div style={{ display: "flex", gap: "5px", alignItems: "center" }} onClick={e => e.stopPropagation()}>
                                                            <span className="v-status rejected">✕ Rejected</span>
                                                            <button
                                                                className="action-btn"
                                                                style={{ padding: "4px 8px", fontSize: "0.6rem", background: "none", border: "1px solid var(--border-glass)", borderRadius: "8px" }}
                                                                onClick={(e) => { e.stopPropagation(); handleApprove(user.username, 'certificate'); }}
                                                            >Approve</button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: "flex", gap: "8px" }} onClick={e => e.stopPropagation()}>
                                                            <button
                                                                className="action-btn"
                                                                style={{ padding: "6px 12px", fontSize: "0.7rem", borderRadius: "10px" }}
                                                                onClick={(e) => { e.stopPropagation(); handleApprove(user.username, 'certificate'); }}
                                                            >Approve</button>
                                                            <button
                                                                className="action-btn"
                                                                style={{ padding: "6px 12px", fontSize: "0.7rem", backgroundColor: "var(--danger)", color: "white", borderRadius: "10px" }}
                                                                onClick={(e) => { e.stopPropagation(); handleReject(user.username, 'certificate'); }}
                                                            >Reject</button>
                                                        </div>
                                                    )}
                                                </div>

                                            </div>
                                        </div>

                                        <div className="v-action-item">
                                            <span className="v-section-title">Profile Integrity</span>
                                            <div className="v-action-group">
                                                <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
                                                    {user.profileApproved ? (
                                                        <span className="v-status verified">✓ Approved</span>
                                                    ) : user.profileRejected ? (
                                                        <div style={{ display: "flex", gap: "5px", alignItems: "center" }} onClick={e => e.stopPropagation()}>
                                                            <span className="v-status rejected">✕ Rejected</span>
                                                            <button
                                                                className="action-btn"
                                                                style={{ padding: "4px 8px", fontSize: "0.6rem", background: "none", border: "1px solid var(--border-glass)", borderRadius: "8px" }}
                                                                onClick={(e) => { e.stopPropagation(); handleApprove(user.username, 'profile'); }}
                                                            >Approve</button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: "flex", gap: "8px" }} onClick={e => e.stopPropagation()}>
                                                            <button
                                                                className="action-btn"
                                                                style={{ padding: "6px 12px", fontSize: "0.7rem", backgroundColor: "#10b981", color: "white", borderRadius: "10px" }}
                                                                onClick={(e) => { e.stopPropagation(); handleApprove(user.username, 'profile'); }}
                                                            >Approve</button>
                                                            <button
                                                                className="action-btn"
                                                                style={{ padding: "6px 12px", fontSize: "0.7rem", backgroundColor: "var(--danger)", color: "white", borderRadius: "10px" }}
                                                                onClick={(e) => { e.stopPropagation(); handleReject(user.username, 'profile'); }}
                                                            >Reject</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            )) : (
                                <div style={{ gridColumn: "1 / -1", padding: "100px", textAlign: "center", color: "var(--text-muted)" }}>
                                    <h3 style={{ fontSize: "1.5rem", marginBottom: "10px" }}>Zero Pending Items</h3>
                                    <p>The queue is empty. Great job!</p>
                                </div>
                            )}
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
                                                                    src={getDirectDriveLink(u.profilePicUrl) || `https://ui-avatars.com/api/?name=${u.username}&background=6366f1&color=fff&bold=true`}
                                                                    alt={u.username}
                                                                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: "cover" }}
                                                                    referrerPolicy="no-referrer"
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

            {renderFullProfileModal()}
            {replyTo && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100,
                    backdropFilter: 'blur(10px)'
                }}>
                    <div className="modal-content" style={{
                        width: '600px', background: 'var(--card-bg)', padding: '40px', borderRadius: '32px',
                        border: '1px solid var(--border-glass)', boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h2 style={{ fontSize: "1.5rem" }}>Reply to Inquiry</h2>
                            <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", color: "white", fontSize: "1.5rem", cursor: "pointer" }}>✕</button>
                        </div>

                        <div style={{ marginBottom: "20px", padding: "15px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "5px" }}>Original Message from <strong>{replyTo.name}</strong>:</p>
                            <p style={{ fontSize: "0.95rem", fontStyle: "italic" }}>"{replyTo.message}"</p>
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", marginBottom: "8px", fontSize: "0.85rem", color: "var(--accent-color)", fontWeight: "bold" }}>YOUR RESPONSE (WILL BE SENT AS IN-APP MESSAGE)</label>
                            <textarea
                                style={{
                                    width: "100%", height: "200px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-glass)",
                                    borderRadius: "15px", padding: "15px", color: "white", outline: "none", resize: "none"
                                }}
                                placeholder="Type your solution here..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                            />
                        </div>

                        <div style={{ display: "flex", gap: "10px" }}>
                            <button
                                className="action-btn"
                                style={{ flex: 1, backgroundColor: "#6366f1", color: "white", padding: "14px" }}
                                onClick={handleSendReply}
                                disabled={isReplying || !replyText.trim()}
                            >
                                {isReplying ? "Processing..." : "Send Message & Resolve"}
                            </button>
                            <button
                                className="action-btn"
                                style={{ background: "none", border: "1px solid var(--border-glass)", padding: "14px" }}
                                onClick={() => setReplyTo(null)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Admin;
