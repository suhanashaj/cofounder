import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getConnectionRequests, updateConnectionStatus, logout, sendMessage, getMessages, getUnreadCounts, markMessagesAsRead } from "../utils/api";
import "../css/dashboard.css";

function Messages() {
    const navigate = useNavigate();
    const username = localStorage.getItem("loggedInUser");
    const [connections, setConnections] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [unreadCounts, setUnreadCounts] = useState({});
    const messagesEndRef = useRef(null);
    const [loading, setLoading] = useState(true);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchConnections = useCallback(async () => {
        const data = await getConnectionRequests(username);
        setConnections(data);
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
        const init = async () => {
            await Promise.all([fetchConnections(), fetchUnread()]);
            setLoading(false);
        };
        init();
    }, [fetchConnections, fetchUnread]);

    useEffect(() => {
        const interval = setInterval(fetchUnread, 5000);
        return () => clearInterval(interval);
    }, [fetchUnread]);

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

    const pendingRequests = connections.filter(c => c.to === username && c.status === "pending");
    const acceptedMatches = connections.filter(c => c.status === "accepted");

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
        <div className="dashboard-wrapper">
            <aside className="sidebar">
                <div className="sidebar-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>Cofounder.</div>
                <ul className="nav-menu">
                    <li className="nav-item" onClick={() => navigate("/welcome")}>
                        <span style={{ fontSize: "1.2rem" }}>🏠</span> Dashboard
                    </li>
                    <li className="nav-item" onClick={() => navigate("/profile")}>
                        <span style={{ fontSize: "1.2rem" }}>👤</span> My Profile
                    </li>
                    <li className="nav-item" onClick={() => navigate("/find")}>
                        <span style={{ fontSize: "1.2rem" }}>🔍</span> Find Partners
                    </li>
                    <li className="nav-item active" onClick={() => navigate("/messages")}>
                        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                            <span>💬 Messages</span>
                            {Object.values(unreadCounts).reduce((a, b) => a + b, 0) > 0 && (
                                <span style={{ background: "#f43f5e", color: "white", fontSize: "0.7rem", padding: "2px 8px", borderRadius: "20px", fontWeight: "900", boxShadow: "0 0 10px rgba(244, 63, 94, 0.4)" }}>
                                    {Object.values(unreadCounts).reduce((a, b) => a + b, 0)}
                                </span>
                            )}
                        </div>
                    </li>
                </ul>
                <div className="nav-item logout-item" onClick={handleLogout} style={{ marginTop: "auto" }}>
                    <span>🚪</span> Logout
                </div>
            </aside>

            <main className="main-content" style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", padding: 0 }}>
                <header className="header-section" style={{ flexShrink: 0, padding: "40px 48px 20px" }}>
                    <div className="welcome-text">
                        <h1 style={{ fontSize: "2.5rem", fontWeight: "900", letterSpacing: "-1px" }}>Secure Networking</h1>
                        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Connect with verified founders and build the future together.</p>
                    </div>
                </header>

                <div className="profile-grid-layout" style={{
                    gridTemplateColumns: "380px 1fr",
                    gap: "32px",
                    padding: "0 48px 48px",
                    flex: 1,
                    minHeight: 0,
                    display: "grid",
                    overflow: "hidden"
                }}>

                    {/* Left: Connections List */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px", overflowY: "auto", height: "100%", paddingRight: "8px" }}>

                        {pendingRequests.length > 0 && (
                            <section>
                                <h3 style={{ fontSize: "0.8rem", color: "var(--accent-color)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "16px" }}>Inbound Requests</h3>
                                {pendingRequests.map((req) => (
                                    <div key={req.id} className="stat-card" style={{ padding: "24px", marginBottom: "16px", background: "rgba(255, 255, 255, 0.03)" }}>
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
                            </section>
                        )}

                        <section style={{ flexGrow: 1 }}>
                            <h3 style={{ fontSize: "0.8rem", color: "var(--accent-color)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "16px" }}>Active Circles</h3>
                            {acceptedMatches.length > 0 ? (
                                acceptedMatches.map((match) => {
                                    const partner = match.from === username ? match.to : match.from;
                                    const isActive = activeChat === partner;
                                    const unreadCount = unreadCounts[partner] || 0;

                                    return (
                                        <div
                                            key={match.id}
                                            className="stat-card"
                                            onClick={() => setActiveChat(partner)}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                marginBottom: "12px",
                                                cursor: "pointer",
                                                backgroundColor: isActive ? "rgba(99, 102, 241, 0.15)" : "rgba(255, 255, 255, 0.02)",
                                                borderColor: isActive ? "var(--accent-color)" : "var(--border-glass)",
                                                padding: "20px"
                                            }}
                                        >
                                            <div style={{ width: "52px", height: "52px", borderRadius: "16px", background: "linear-gradient(135deg, #6366f1, #a855f7)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "20px", fontWeight: "900", fontSize: "1.5rem", boxShadow: "0 8px 20px rgba(0,0,0,0.3)" }}>
                                                {partner[0].toUpperCase()}
                                            </div>
                                            <div style={{ flexGrow: 1 }}>
                                                <strong style={{ display: "block", color: "white", fontSize: "1.05rem", marginBottom: "4px" }}>{partner}</strong>
                                                <span style={{ fontSize: "0.8rem", color: unreadCount > 0 ? "#fb7185" : "var(--text-muted)", fontWeight: unreadCount > 0 ? "800" : "400" }}>
                                                    {unreadCount > 0 ? "● NEW TRANSMISSION" : "ENCRYPTED CHANNEL"}
                                                </span>
                                            </div>
                                            {unreadCount > 0 && (
                                                <div style={{ background: "#f43f5e", color: "white", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: "900", boxShadow: "0 0 15px rgba(244, 63, 94, 0.5)" }}>
                                                    {unreadCount}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ padding: "40px 20px", textAlign: "center", background: "rgba(255, 255, 255, 0.02)", borderRadius: "24px", border: "1px dashed var(--border-glass)" }}>
                                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No active transmissions yet.</p>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right: Chat Window */}
                    <div className="stat-card" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", padding: "0" }}>
                        {activeChat ? (
                            <>
                                <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border-glass)", background: "rgba(255, 255, 255, 0.02)", display: "flex", alignItems: "center", gap: "16px" }}>
                                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 10px #10b981" }}></div>
                                    <h2 style={{ fontSize: "1.2rem", margin: 0, fontWeight: "800", color: "white" }}>{activeChat}</h2>
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

                                <form onSubmit={handleSendMessage} style={{ padding: "32px", borderTop: "1px solid var(--border-glass)", display: "flex", gap: "16px", background: "rgba(2, 6, 23, 0.4)" }}>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Secure transmission..."
                                        style={{ flexGrow: 1, padding: "16px 24px", borderRadius: "16px", border: "1px solid var(--border-glass)", outline: "none", color: "white", background: "rgba(255, 255, 255, 0.05)", fontSize: "1rem", transition: "all 0.3s" }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        style={{ padding: "0 32px", background: "var(--accent-color)", color: "white", border: "none", borderRadius: "16px", cursor: "pointer", fontWeight: "900", letterSpacing: "1px", fontSize: "0.8rem" }}
                                    >
                                        SEND
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", color: "var(--text-muted)", opacity: 0.6 }}>
                                <div style={{ fontSize: "4rem", marginBottom: "24px", animation: "pulse 2s infinite" }}>🛰️</div>
                                <h3 style={{ color: "white", marginBottom: "8px" }}>COMMUNICATION HUB</h3>
                                <p>Select a transmission to decrypt and view.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Messages;
