import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { logout } from "../utils/api";
import "../css/help-center.css";

function HelpCenter() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const username = sessionStorage.getItem("loggedInUser");
    const isLoggedIn = !!username;

    useEffect(() => {
        // Add full-screen class to body for this page only
        document.body.classList.add("full-screen-page");

        // Auto-fill email if logged in
        const userEmail = sessionStorage.getItem("userEmail");
        const userName = sessionStorage.getItem("loggedInUser");

        if (userEmail) {
            setFormData(prev => ({
                ...prev,
                email: userEmail,
                name: userName || ""
            }));
        }

        return () => {
            // Clean up class when leaving page
            document.body.classList.remove("full-screen-page");
        };
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const userId = sessionStorage.getItem("userEmail") || "anonymous";
            const username = sessionStorage.getItem("loggedInUser") || "anonymous";

            await addDoc(collection(db, "helpMessages"), {
                ...formData,
                userId: userId,
                username: username,
                timestamp: serverTimestamp(),
                status: "unread"
            });

            setSubmitted(true);
            setFormData({ name: "", email: "", subject: "", message: "" });
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const backPath = isLoggedIn ? "/welcome" : "/";
    const backLabel = isLoggedIn ? "Back to Welcome" : "Back to Home";

    const sidebar = (
        <>
            <button className="mobile-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? "✕" : "☰"}
            </button>
            <aside className={`sidebar ${isMenuOpen ? "mobile-open" : ""}`}>
                <div className="sidebar-logo" onClick={() => navigate("/welcome")} style={{ cursor: "pointer" }}>Cofounder.</div>
                <ul className="nav-menu">
                    <li className="nav-item" onClick={() => { navigate("/welcome"); setIsMenuOpen(false); }}>
                        <span>🏠</span> Dashboard
                    </li>
                    <li className="nav-item" onClick={() => { navigate("/profile"); setIsMenuOpen(false); }}>
                        <span>👤</span> My Profile
                    </li>
                    <li className="nav-item" onClick={() => { navigate("/find"); setIsMenuOpen(false); }}>
                        <span>🔍</span> Find Partners
                    </li>
                    <li className="nav-item" onClick={() => { navigate("/messages"); setIsMenuOpen(false); }}>
                        <span>💬</span> Messages
                    </li>
                    <li className="nav-item" onClick={() => { navigate("/inbox"); setIsMenuOpen(false); }}>
                        <span>📥</span> Inbox
                    </li>
                    <li className="nav-item active" onClick={() => { navigate("/help-center"); setIsMenuOpen(false); }}>
                        <span>❓</span> Help Center
                    </li>
                </ul>
                <div className="nav-item logout-item" onClick={handleLogout} style={{ marginTop: "auto" }}>
                    <span>🚪</span> Logout
                </div>
            </aside>
            {isMenuOpen && <div className="sidebar-backdrop" onClick={() => setIsMenuOpen(false)}></div>}
        </>
    );

    if (submitted) {
        return (
            <div className={isLoggedIn ? "dashboard-wrapper" : "help-center-wrapper"}>
                {isLoggedIn && sidebar}
                <main className={isLoggedIn ? "main-content" : "help-container"} style={isLoggedIn ? { padding: "40px" } : {}}>
                    <div className="success-view">
                        <div className="success-message">
                            <h3>🎉 Message Sent Successfully!</h3>
                            <p>Thank you for reaching out. Our team will get back to you shortly.</p>
                        </div>
                        <button className="send-btn" onClick={() => setSubmitted(false)}>Send Another Message</button>
                        {!isLoggedIn && <a href={backPath} onClick={(e) => { e.preventDefault(); navigate(backPath); }} className="back-link">{backLabel}</a>}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className={isLoggedIn ? "dashboard-wrapper" : "help-center-wrapper"}>
            {isLoggedIn && sidebar}
            <main className={isLoggedIn ? "main-content" : "help-container"} style={isLoggedIn ? { padding: "40px", overflowY: "auto" } : {}}>
                <div className="help-header">
                    <h1>Help Center</h1>
                    <p>How can we assist you today?</p>
                </div>

                <form className="contact-form" onSubmit={handleSubmit}>
                    <div className="form-grid" style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: "24px",
                        marginBottom: "24px"
                    }}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="John Doe"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Registered Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="john@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group full-width" style={{ marginBottom: "24px" }}>
                        <label>Subject</label>
                        <input
                            type="text"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            placeholder="What's this about?"
                            required
                        />
                    </div>

                    <div className="form-group full-width" style={{ marginBottom: "24px" }}>
                        <label>Message</label>
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            placeholder="Write your message here..."
                            required
                            style={{ minHeight: "200px" }}
                        ></textarea>
                    </div>

                    <button type="submit" className="send-btn" disabled={loading} style={{ width: isLoggedIn ? "auto" : "100%", padding: "16px 40px" }}>
                        {loading ? "Sending..." : "Send Message"}
                    </button>
                </form>

                {!isLoggedIn && (
                    <a href={backPath} onClick={(e) => { e.preventDefault(); navigate(backPath); }} className="back-link">
                        ← Back to Home
                    </a>
                )}
            </main>
        </div>
    );
}

export default HelpCenter;
