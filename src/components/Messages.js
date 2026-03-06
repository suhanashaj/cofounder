import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getConnectionRequests, updateConnectionStatus, logout, sendMessage, getMessages, getUnreadCounts, markMessagesAsRead, getMessagePartners, getCurrentUserProfile, getDirectDriveLink, getProfileAPI, getUsers } from "../utils/api";
import "../css/dashboard.css";
import "../css/modal.css";

function Messages() {
    const navigate = useNavigate();
    const username = sessionStorage.getItem("loggedInUser");
    const [connections, setConnections] = useState([]);
    const [allPartners, setAllPartners] = useState([]);
    const [partnerProfiles, setPartnerProfiles] = useState({});
    const [activeChat, setActiveChat] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [unreadCounts, setUnreadCounts] = useState({});
    const messagesEndRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userData, setUserData] = useState(null);
    const cachedProfilePic = getDirectDriveLink(sessionStorage.getItem("userProfilePic"));
    const location = useLocation();
    const [viewingProfile, setViewingProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);

    // Handle "user" query parameter from Inbox/Notifications
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const userParam = params.get("user");
        if (userParam) {
            setActiveChat(userParam);
            // Clear the param from URL to ensure "Back" button works as expected
            navigate("/messages", { replace: true });
        }
    }, [location.search, navigate]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchConnections = useCallback(async () => {
        const [data, partners, allUsers] = await Promise.all([
            getConnectionRequests(username),
            getMessagePartners(username),
            getUsers()
        ]);
        setConnections(data);
        setAllPartners(partners);

        const profileMap = {};
        allUsers.forEach(u => {
            profileMap[u.username] = u.profilePicUrl;
        });
        setPartnerProfiles(profileMap);
    }, [username]);

    const fetchUnread = useCallback(async () => {
        if (!username) return;
        const counts = await getUnreadCounts(username);
        setUnreadCounts(counts);
    }, [username]);

    const fetchMessages = useCallback(async () => {
        if (!activeChat) return;
        const msgs = await getMessages(username, activeChat);
        setChatMessages(msgs);

        await markMessagesAsRead(username, activeChat);
        setUnreadCounts(prev => ({ ...prev, [activeChat]: 0 }));
    }, [username, activeChat]);

    useEffect(() => {
        // Apply full-screen class to body for this page
        document.body.classList.add("full-screen-page");

        const init = async () => {
            const [, , profileRes] = await Promise.all([
                fetchConnections(),
                fetchUnread(),
                getCurrentUserProfile()
            ]);
            if (profileRes && profileRes.success) {
                setUserData(profileRes.data);
            }
            setLoading(false);
        };
        init();

        return () => {
            document.body.classList.remove("full-screen-page");
        };
    }, [fetchConnections, fetchUnread]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchUnread();
            fetchConnections();
        }, 5000);
        return () => clearInterval(interval);
    }, [fetchUnread, fetchConnections]);

    useEffect(() => {
        if (activeChat) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [activeChat, fetchMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages]);

    const handleStatusUpdate = async (connId, status) => {
        const res = await updateConnectionStatus(connId, status);
        if (res.success) {
            fetchConnections();
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat) return;

        const res = await sendMessage(username, activeChat, newMessage);
        if (res.success) {
            setNewMessage("");
            fetchMessages();
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const handleViewProfile = async (targetUser) => {
        setProfileLoading(true);
        const res = await getProfileAPI(targetUser);
        if (res.success) {
            setViewingProfile(res.data);
        } else {
            alert(res.msg);
        }
        setProfileLoading(false);
    };

    const renderProfileModal = () => {
        if (!viewingProfile) return null;

        const isFounder = viewingProfile.role?.toLowerCase() === 'founder';
        const isCoFounder = viewingProfile.role?.toLowerCase() === 'cofounder' || viewingProfile.role?.toLowerCase() === 'co-founder';

        return (
            <div className="modal-overlay" onClick={() => setViewingProfile(null)}>
                <div className="profile-modal-content" onClick={e => e.stopPropagation()}>
                    <button className="modal-close-btn" onClick={() => setViewingProfile(null)}>✕</button>

                    <div className="profile-modal-header">
                        <img
                            src={getDirectDriveLink(viewingProfile.profilePicUrl) || `https://ui-avatars.com/api/?name=${viewingProfile.username}&background=6366f1&color=fff&bold=true&size=200`}
                            alt="Profile"
                            className="modal-avatar"
                            referrerPolicy="no-referrer"
                        />
                        <div className="modal-header-info">
                            <span className="modal-role-badge">{viewingProfile.role}</span>
                            <h2>{viewingProfile.fullName || viewingProfile.username}</h2>
                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "15px" }}>
                                <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>📍 {viewingProfile.location || "Earth"}</span>
                                {viewingProfile.workStyle && <span style={{ color: "var(--accent-color)", fontSize: "0.9rem", fontWeight: "700" }}>🏠 {viewingProfile.workStyle}</span>}
                            </div>
                            <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
                                {viewingProfile.linkedin && (
                                    <a href={viewingProfile.linkedin} target="_blank" rel="noreferrer" style={{ color: "white", fontSize: "1.2rem", opacity: 0.8 }}>
                                        <i className="fab fa-linkedin"></i>
                                    </a>
                                )}
                                {viewingProfile.github && (
                                    <a href={viewingProfile.github} target="_blank" rel="noreferrer" style={{ color: "white", fontSize: "1.2rem", opacity: 0.8 }}>
                                        <i className="fab fa-github"></i>
                                    </a>
                                )}
                            </div>
                            {viewingProfile.startupId && (
                                <div style={{ padding: "10px 15px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10b981", borderRadius: "8px", color: "#10b981", fontWeight: "800", fontSize: "0.8rem", width: "fit-content", marginBottom: "20px" }}>
                                    🚀 IN A STARTUP
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-details-grid">
                        <div className="modal-detail-card">
                            <h4>About</h4>
                            <p>{viewingProfile.about || "This visionary hasn't added a bio yet."}</p>
                        </div>

                        <div className="modal-detail-card">
                            <h4>Industry & Domain</h4>
                            <p>{viewingProfile.domain || "Not specified"}</p>
                        </div>

                        {isFounder && (
                            <>
                                <div className="modal-detail-card" style={{ gridColumn: "1 / -1" }}>
                                    <h4>Startup Idea Description</h4>
                                    <p>{viewingProfile.startupIdea || "Idea details are private or not yet provided."}</p>
                                </div>
                                <div className="modal-detail-card">
                                    <h4>Company Name</h4>
                                    <p>{viewingProfile.companyName || "Stealth Startup"}</p>
                                </div>
                                <div className="modal-detail-card">
                                    <h4>Startup Stage</h4>
                                    <p>{viewingProfile.startupStage || "Ideation"}</p>
                                </div>
                                <div className="modal-detail-card">
                                    <h4>Looking For</h4>
                                    <p>{viewingProfile.lookingFor} {viewingProfile.otherLookingFor ? `- ${viewingProfile.otherLookingFor}` : ""}</p>
                                </div>
                                <div className="modal-detail-card">
                                    <h4>Required Skills</h4>
                                    <p>{viewingProfile.requiredSkills || "Passionate collaborators"}</p>
                                </div>
                            </>
                        )}

                        {isCoFounder && (
                            <>
                                <div className="modal-detail-card">
                                    <h4>Skills</h4>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                                        {Array.isArray(viewingProfile.skills) ? viewingProfile.skills.map((s, i) => (
                                            <span key={i} style={{ fontSize: "0.8rem", background: "rgba(99,102,241,0.1)", padding: "5px 10px", borderRadius: "5px", color: "white" }}>
                                                {s.name} {s.verified ? "✅" : ""}
                                            </span>
                                        )) : viewingProfile.skills}
                                    </div>
                                </div>
                                {viewingProfile.education && (
                                    <div className="modal-detail-card">
                                        <h4>Education</h4>
                                        <p>{viewingProfile.education.degree} from {viewingProfile.education.institution} ({viewingProfile.education.year})</p>
                                    </div>
                                )}
                                {viewingProfile.workExperience && (
                                    <div className="modal-detail-card" style={{ gridColumn: "1 / -1" }}>
                                        <h4>Work Experience</h4>
                                        <p><strong>{viewingProfile.workExperience.role}</strong> at {viewingProfile.workExperience.company}</p>
                                        <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "10px" }}>{viewingProfile.workExperience.description}</p>
                                    </div>
                                )}
                                {viewingProfile.projects && (
                                    <div className="modal-detail-card" style={{ gridColumn: "1 / -1" }}>
                                        <h4>Featured Project</h4>
                                        <p><strong>{viewingProfile.projects.title}</strong></p>
                                        <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "5px" }}>{viewingProfile.projects.description}</p>
                                        {viewingProfile.projects.link && <a href={viewingProfile.projects.link} target="_blank" rel="noreferrer" style={{ color: "var(--accent-color)", fontSize: "0.8rem" }}>Live Link ↗</a>}
                                    </div>
                                )}
                                {viewingProfile.equity && (
                                    <div className="modal-detail-card">
                                        <h4>{isFounder ? "Equity Offered" : "Equity Expectation"}</h4>
                                        <p style={{ color: "var(--accent-color)", fontWeight: "800" }}>{viewingProfile.equity}</p>
                                    </div>
                                )}
                                {viewingProfile.workStyle && (
                                    <div className="modal-detail-card">
                                        <h4>Work Style</h4>
                                        <p style={{ color: "var(--accent-color)", fontWeight: "800" }}>{viewingProfile.workStyle}</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const pendingRequests = connections.filter(c => c.to === username && c.status === "pending");
    const acceptedPartners = connections.filter(c => c.status === "accepted").map(c => c.from === username ? c.to : c.from);
    const displayPartners = Array.from(new Set([...acceptedPartners, ...allPartners])).filter(p => p !== username);

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
                <p style={{ fontSize: "1.2rem", color: "var(--accent-color)", fontWeight: "600", letterSpacing: "2px", zIndex: 10, textAlign: "center", padding: "0 20px" }}>SYNCING COMMUNICATIONS...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-wrapper" style={{ display: "flex", background: "var(--primary-bg)", minHeight: "100vh" }}>
            <button className="mobile-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? "✕" : "☰"}
            </button>

            <aside className={`sidebar ${isMenuOpen ? "mobile-open" : ""}`} style={{ position: "sticky", top: 0, height: "100vh" }}>
                <div className="sidebar-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>Cofounder.</div>

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
                    <li className="nav-item" onClick={() => { navigate("/welcome"); setIsMenuOpen(false); }}>
                        <span style={{ fontSize: "1.2rem" }}>🏠</span> Dashboard
                    </li>
                    <li className="nav-item" onClick={() => { navigate("/profile"); setIsMenuOpen(false); }}>
                        <span style={{ fontSize: "1.2rem" }}>👤</span> My Profile
                    </li>
                    <li className="nav-item" onClick={() => { navigate("/find"); setIsMenuOpen(false); }}>
                        <span style={{ fontSize: "1.2rem" }}>🔍</span> Find Partners
                    </li>
                    <li className="nav-item active" onClick={() => { navigate("/messages"); setIsMenuOpen(false); }}>
                        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                            <span>💬 Messages</span>
                            {Object.values(unreadCounts).reduce((a, b) => a + b, 0) > 0 && (
                                <span style={{ background: "#f43f5e", color: "white", fontSize: "0.7rem", padding: "2px 8px", borderRadius: "20px", fontWeight: "900", boxShadow: "0 0 10px rgba(244, 63, 94, 0.4)" }}>
                                    {Object.values(unreadCounts).reduce((a, b) => a + b, 0)}
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
                <div className="nav-item logout-item" onClick={handleLogout} style={{ marginTop: "auto" }}>
                    <span>🚪</span> Logout
                </div>
            </aside>

            {/* Backdrop for mobile menu */}
            {isMenuOpen && <div className="sidebar-backdrop" onClick={() => setIsMenuOpen(false)}></div>}

            <main className="main-content" style={{
                display: "flex",
                flexDirection: "column",
                height: "100vh",
                overflow: "hidden",
                padding: 0,
                maxWidth: "none",
                flexGrow: 1
            }}>
                {!activeChat && (
                    <header className="header-section" style={{ flexShrink: 0, padding: "40px 48px 20px" }}>
                        <div className="welcome-text">
                            <h1 style={{ fontSize: "2.5rem", fontWeight: "900", letterSpacing: "-1px" }}>Secure Networking</h1>
                            <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Connect with verified founders and build the future together.</p>
                        </div>
                    </header>
                )}

                <div className="profile-grid-layout" style={{
                    gridTemplateColumns: "1fr",
                    gap: activeChat ? "0" : "32px",
                    padding: activeChat ? "0" : "0 48px 48px",
                    flex: 1,
                    minHeight: 0,
                    display: "grid",
                    overflow: "hidden",
                    width: "100%"
                }}>

                    {/* Left: Connections List */}
                    {!activeChat && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "32px", overflowY: "auto", height: "100%", paddingRight: "8px" }}>

                            {pendingRequests.length > 0 && (
                                <section>
                                    <h3 style={{ fontSize: "0.8rem", color: "var(--accent-color)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "16px" }}>Inbound Requests</h3>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
                                        {pendingRequests.map((req) => (
                                            <div key={req.id} className="stat-card" style={{ padding: "24px", background: "rgba(255, 255, 255, 0.03)", margin: 0 }}>
                                                <div style={{ marginBottom: "20px" }}>
                                                    <strong style={{ fontSize: "1.1rem", color: "white", display: "block" }}>{req.from}</strong>
                                                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Discovery Network Connection</span>
                                                </div>
                                                <div style={{ display: "flex", gap: "12px" }}>
                                                    <button onClick={() => handleStatusUpdate(req.id, "accepted")} style={{ flex: 1, padding: "10px", background: "var(--success)", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "700", fontSize: "0.8rem" }}>ACCEPT</button>
                                                    <button onClick={() => handleStatusUpdate(req.id, "rejected")} style={{ flex: 1, padding: "10px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "12px", cursor: "pointer", fontWeight: "700", fontSize: "0.8rem" }}>DECLINE</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            <section style={{ flexGrow: 1 }}>
                                <h3 style={{ fontSize: "0.8rem", color: "var(--accent-color)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "16px" }}>Active Circles</h3>
                                {displayPartners.length > 0 ? (
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
                                        {displayPartners.map((partner) => {
                                            const isActive = activeChat === partner;
                                            const unreadCount = unreadCounts[partner] || 0;

                                            return (
                                                <div
                                                    key={partner}
                                                    className="stat-card"
                                                    onClick={() => setActiveChat(partner)}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        cursor: "pointer",
                                                        backgroundColor: isActive ? "rgba(99, 102, 241, 0.15)" : "rgba(255, 255, 255, 0.02)",
                                                        borderColor: isActive ? "var(--accent-color)" : "var(--border-glass)",
                                                        padding: "20px",
                                                        margin: 0
                                                    }}
                                                >
                                                    <div style={{ marginRight: "20px", position: "relative" }}>
                                                        <img
                                                            src={getDirectDriveLink(partnerProfiles[partner]) || `https://ui-avatars.com/api/?name=${partner}&background=6366f1&color=fff&bold=true&size=52`}
                                                            alt={partner}
                                                            style={{ width: "52px", height: "52px", borderRadius: "16px", objectFit: "cover", boxShadow: "0 8px 20px rgba(0,0,0,0.3)", border: "1px solid var(--border-glass)" }}
                                                            referrerPolicy="no-referrer"
                                                        />
                                                    </div>
                                                    <div style={{ flexGrow: 1 }}>
                                                        <strong style={{ display: "block", color: "white", fontSize: "1.05rem", marginBottom: "4px" }}>{partner} {partner === 'Admin' && <span style={{ fontSize: "0.6rem", background: "rgba(16, 185, 129, 0.2)", color: "#10b981", padding: "2px 6px", borderRadius: "4px", marginLeft: "5px", border: "1px solid #10b981" }}>SUPPORT</span>}</strong>
                                                        <span style={{ fontSize: "0.8rem", color: unreadCount > 0 ? "#fb7185" : "var(--text-muted)", fontWeight: unreadCount > 0 ? "800" : "400" }}>
                                                            {unreadCount > 0 ? "● NEW TRANSMISSION" : partner === 'Admin' ? "SYSTEM CHANNEL" : "ENCRYPTED CHANNEL"}
                                                        </span>
                                                    </div>
                                                    {unreadCount > 0 && (
                                                        <div style={{ background: "#f43f5e", color: "white", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: "900", boxShadow: "0 0 15px rgba(244, 63, 94, 0.5)" }}>
                                                            {unreadCount}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ padding: "40px 20px", textAlign: "center", background: "rgba(255, 255, 255, 0.02)", borderRadius: "24px", border: "1px dashed var(--border-glass)" }}>
                                        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No active transmissions yet.</p>
                                    </div>
                                )}
                            </section>
                        </div>
                    )}

                    {/* Right: Chat Window */}
                    {activeChat && (
                        <div className="stat-card" style={{
                            display: "flex",
                            flexDirection: "column",
                            height: "100%",
                            width: "100%",
                            overflow: "hidden",
                            padding: "0",
                            borderRadius: activeChat ? "0" : "32px",
                            border: activeChat ? "none" : "1px solid rgba(255, 255, 255, 0.05)",
                            boxShadow: activeChat ? "none" : "0 20px 40px rgba(0, 0, 0, 0.3)",
                            margin: 0
                        }}>
                            <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border-glass)", background: "rgba(255, 255, 255, 0.02)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 10px #10b981" }}></div>
                                    <h2
                                        style={{ fontSize: "1.8rem", margin: 0, fontWeight: "900", color: "white", letterSpacing: "-0.5px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px" }}
                                        onClick={() => handleViewProfile(activeChat)}
                                    >
                                        <img
                                            src={getDirectDriveLink(partnerProfiles[activeChat]) || `https://ui-avatars.com/api/?name=${activeChat}&background=6366f1&color=fff&bold=true&size=40`}
                                            alt={activeChat}
                                            style={{ width: "40px", height: "40px", borderRadius: "10px", objectFit: "cover" }}
                                            referrerPolicy="no-referrer"
                                        />
                                        {activeChat} {profileLoading && <span style={{ fontSize: "0.8rem", color: "var(--accent-color)", fontWeight: "400" }}>(loading...)</span>}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setActiveChat(null)}
                                    className="back-btn"
                                    style={{
                                        background: "rgba(255, 255, 255, 0.05)",
                                        border: "1px solid var(--border-glass)",
                                        color: "white",
                                        width: "24px",
                                        height: "24px",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        fontSize: "0.8rem",
                                        fontWeight: "900",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}
                                >
                                    <span>←</span>
                                </button>
                            </div>

                            <div style={{ flexGrow: 1, overflowY: "auto", padding: "32px", display: "flex", flexDirection: "column", gap: "16px", background: "transparent" }}>
                                {chatMessages.length > 0 ? (
                                    chatMessages.map((msg, idx) => {
                                        const isMe = msg.from === username;
                                        return (
                                            <div key={idx} style={{
                                                alignSelf: isMe ? "flex-end" : "flex-start",
                                                maxWidth: "70%",
                                                backgroundColor: isMe ? "var(--accent-color)" : "rgba(255, 255, 255, 0.1)",
                                                color: "white",
                                                padding: "16px 20px",
                                                borderRadius: "24px",
                                                borderBottomRightRadius: isMe ? "4px" : "24px",
                                                borderBottomLeftRadius: isMe ? "24px" : "4px",
                                                fontSize: "0.95rem",
                                                lineHeight: "1.6",
                                                boxShadow: isMe ? "0 10px 20px -5px rgba(99, 102, 241, 0.3)" : "none",
                                                border: isMe ? "none" : "1px solid var(--border-glass)"
                                            }}>
                                                {msg.text}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "100px", opacity: 0.5 }}>
                                        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>✨</div>
                                        <p>Starting an incredible partnership...</p>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <form onSubmit={handleSendMessage} style={{ padding: "32px", borderTop: "1px solid var(--border-glass)", display: "flex", flexDirection: "column", gap: "16px", background: "rgba(2, 6, 23, 0.4)" }}>
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Secure transmission..."
                                    style={{
                                        width: "100%",
                                        minHeight: "100px",
                                        padding: "20px 24px",
                                        borderRadius: "16px",
                                        border: "1px solid var(--border-glass)",
                                        outline: "none",
                                        color: "white",
                                        background: "rgba(255, 255, 255, 0.05)",
                                        fontSize: "1rem",
                                        transition: "all 0.3s",
                                        resize: "none",
                                        lineHeight: "1.5"
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e);
                                        }
                                    }}
                                />
                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        style={{ padding: "12px 32px", background: "var(--accent-color)", color: "white", border: "none", borderRadius: "16px", cursor: "pointer", fontWeight: "900", letterSpacing: "1px", fontSize: "0.8rem" }}
                                    >
                                        SEND TRANSMISSION
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
                {renderProfileModal()}
            </main>
        </div>
    );
}

export default Messages;
