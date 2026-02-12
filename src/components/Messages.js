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

        // Mark as read when fetching
        await markMessagesAsRead(username, activeChat);
        // Optimistically clear unread count for this user
        setUnreadCounts(prev => ({ ...prev, [activeChat]: 0 }));
    }, [username, activeChat]);

    useEffect(() => {
        fetchConnections();
        fetchUnread();
    }, [fetchConnections, fetchUnread]);

    // Poll for unread messages globally (every 5s)
    useEffect(() => {
        const interval = setInterval(fetchUnread, 5000);
        return () => clearInterval(interval);
    }, [fetchUnread]);

    // Poll for active chat messages
    useEffect(() => {
        if (activeChat) {
            fetchMessages(); // Initial fetch
            const interval = setInterval(fetchMessages, 3000); // Poll every 3s
            return () => clearInterval(interval);
        }
    }, [activeChat, fetchMessages]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [chatMessages]);

    const handleStatusUpdate = async (connId, status) => {
        const res = await updateConnectionStatus(connId, status);
        if (res.success) {
            fetchConnections();
        } else {
            alert(res.msg);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat) return;

        const res = await sendMessage(username, activeChat, newMessage);
        if (res.success) {
            setNewMessage("");
            fetchMessages();
        } else {
            alert("Failed to send: " + res.msg);
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
                        {Object.values(unreadCounts).reduce((a, b) => a + b, 0) > 0 && (
                            <span style={{ marginLeft: "auto", background: "#ef4444", color: "white", fontSize: "0.7rem", padding: "2px 6px", borderRadius: "10px" }}>
                                {Object.values(unreadCounts).reduce((a, b) => a + b, 0)}
                            </span>
                        )}
                    </li>
                </ul>
                <div className="nav-item logout-item" onClick={handleLogout}>
                    <span>🚪</span> Logout
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content" style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", padding: 0 }}>
                <header className="header-section" style={{ flexShrink: 0, padding: "30px 40px 10px" }}>
                    <div className="welcome-text">
                        <h1>Connections & Messages</h1>
                    </div>
                </header>

                <div className="profile-grid-layout" style={{
                    gridTemplateColumns: "350px 1fr",
                    gap: "20px",
                    padding: "0 40px 20px",
                    flex: 1,
                    minHeight: 0,
                    display: "grid",
                    overflow: "hidden"
                }}>

                    {/* Left: Connections List */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px", overflowY: "auto", height: "100%", paddingRight: "5px" }}>

                        {/* Pending Requests */}
                        {pendingRequests.length > 0 && (
                            <section>
                                <h3 style={{ fontSize: "1rem", color: "var(--text-muted)", marginBottom: "10px" }}>Requests</h3>
                                {pendingRequests.map((req) => (
                                    <div key={req.id} className="stat-card" style={{ padding: "15px", marginBottom: "10px" }}>
                                        <div style={{ marginBottom: "10px" }}>
                                            <strong>{req.from}</strong>
                                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>wants to connect</span>
                                        </div>
                                        <div style={{ display: "flex", gap: "5px" }}>
                                            <button
                                                onClick={() => handleStatusUpdate(req.id, "accepted")}
                                                style={{ flex: 1, padding: "5px", background: "#10b981", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
                                            >Accept</button>
                                            <button
                                                onClick={() => handleStatusUpdate(req.id, "rejected")}
                                                style={{ flex: 1, padding: "5px", background: "#ef4444", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
                                            >Decline</button>
                                        </div>
                                    </div>
                                ))}
                            </section>
                        )}

                        {/* Matches List */}
                        <section style={{ flexGrow: 1 }}>
                            <h3 style={{ fontSize: "1rem", color: "var(--text-muted)", marginBottom: "10px" }}>Your Matches</h3>
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
                                                marginBottom: "10px",
                                                cursor: "pointer",
                                                backgroundColor: isActive ? "#eff6ff" : "white",
                                                border: isActive ? "1px solid #6366f1" : "1px solid #e2e8f0",
                                                position: "relative"
                                            }}
                                        >
                                            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#6366f1", color: "white", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "12px", fontWeight: "bold", fontSize: "1.2rem" }}>
                                                {partner[0].toUpperCase()}
                                            </div>
                                            <div style={{ flexGrow: 1 }}>
                                                <strong style={{ display: "block", color: isActive ? "#1e293b" : "#475569" }}>{partner}</strong>
                                                <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                                                    {unreadCount > 0 ? <span style={{ color: "#ef4444", fontWeight: "bold" }}>New Message!</span> : "Click to chat"}
                                                </span>
                                            </div>
                                            {unreadCount > 0 && (
                                                <div style={{
                                                    background: "#ef4444",
                                                    color: "white",
                                                    borderRadius: "50%",
                                                    width: "20px",
                                                    height: "20px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "0.75rem",
                                                    fontWeight: "bold"
                                                }}>
                                                    {unreadCount}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No matches yet.</p>
                            )}
                        </section>
                    </div>

                    {/* Right: Chat Window */}
                    <div className="stat-card" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", padding: "0" }}>
                        {activeChat ? (
                            <>
                                {/* Chat Header */}
                                <div style={{ padding: "15px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                                    <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Chat with {activeChat}</h2>
                                </div>

                                {/* Messages Area */}
                                <div style={{ flexGrow: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "10px", background: "#f8faff" }}>
                                    {chatMessages.length > 0 ? (
                                        chatMessages.map((msg, idx) => {
                                            const isMe = msg.from === username;
                                            return (
                                                <div key={idx} style={{
                                                    alignSelf: isMe ? "flex-end" : "flex-start",
                                                    maxWidth: "70%",
                                                    backgroundColor: isMe ? "#6366f1" : "white",
                                                    color: isMe ? "white" : "#1e293b",
                                                    padding: "10px 15px",
                                                    borderRadius: "12px",
                                                    borderBottomRightRadius: isMe ? "2px" : "12px",
                                                    borderBottomLeftRadius: isMe ? "12px" : "2px",
                                                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                                    fontSize: "0.95rem"
                                                }}>
                                                    {msg.text}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div style={{ textAlign: "center", color: "#94a3b8", marginTop: "40px" }}>
                                            Start the conversation! Say hi to {activeChat}. 👋
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <form onSubmit={handleSendMessage} style={{ padding: "15px", borderTop: "1px solid #e2e8f0", display: "flex", gap: "10px", background: "white" }}>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        style={{ flexGrow: 1, padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", color: "#000", background: "#fff" }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        style={{ padding: "0 20px", background: "#6366f1", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
                                    >
                                        Send
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", color: "#94a3b8" }}>
                                <span style={{ fontSize: "3rem", marginBottom: "15px" }}>💬</span>
                                <p>Select a match from the left to start chatting.</p>
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}


export default Messages;
