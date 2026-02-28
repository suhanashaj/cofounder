import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import "../css/landing.css";

function Contact() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: "", email: "", message: "" });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await addDoc(collection(db, "helpMessages"), {
                ...formData,
                subject: "Contact Us Inquiry",
                timestamp: serverTimestamp(),
                status: "unread",
                source: "landing_contact"
            });

            setSubmitted(true);
            setTimeout(() => navigate("/"), 3000);
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="landing-wrapper">
            <nav className="landing-nav">
                <div className="nav-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>Cofounder.</div>
                <div className="nav-auth-btns">
                    <button className="btn-ghost" onClick={() => navigate("/")}>Home</button>
                    <button className="btn-primary" onClick={() => navigate("/signup")}>Get Started</button>
                </div>
            </nav>

            <header className="hero-section" style={{ padding: "100px 8% 40px", minHeight: "auto" }}>
                <div className="hero-content">
                    <span className="hero-tagline">We'd love to hear from you</span>
                    <h1 className="hero-title" style={{ fontSize: "3.5rem" }}>
                        Contact <span>Us</span>
                    </h1>
                    <p className="hero-description">
                        Have questions or suggestions? We're here to help you on your founder journey.
                    </p>
                </div>
            </header>

            <section className="features-section" style={{ paddingTop: "20px" }}>
                <div style={{ maxWidth: "600px", margin: "0 auto", color: "var(--text-muted)", fontSize: "1.1rem" }}>
                    {submitted ? (
                        <div style={{ textAlign: "center", padding: "60px", background: "rgba(15, 23, 42, 0.4)", borderRadius: "32px", border: "1px solid var(--border-glass)" }}>
                            <span style={{ fontSize: "4rem", marginBottom: "20px", display: "block" }}>✅</span>
                            <h2 style={{ color: "white", marginBottom: "15px" }}>Message Sent!</h2>
                            <p>Thank you for reaching out. We'll get back to you shortly.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ background: "rgba(15, 23, 42, 0.4)", padding: "40px", borderRadius: "32px", border: "1px solid var(--border-glass)" }}>
                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", color: "white", marginBottom: "8px", fontWeight: "600" }}>Name</label>
                                <input
                                    type="text"
                                    required
                                    style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "rgba(0, 0, 0, 0.2)", border: "1px solid var(--border-glass)", color: "white", outline: "none" }}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", color: "white", marginBottom: "8px", fontWeight: "600" }}>Email</label>
                                <input
                                    type="email"
                                    required
                                    style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "rgba(0, 0, 0, 0.2)", border: "1px solid var(--border-glass)", color: "white", outline: "none" }}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div style={{ marginBottom: "30px" }}>
                                <label style={{ display: "block", color: "white", marginBottom: "8px", fontWeight: "600" }}>Message</label>
                                <textarea
                                    required
                                    rows="5"
                                    style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "rgba(0, 0, 0, 0.2)", border: "1px solid var(--border-glass)", color: "white", outline: "none", resize: "none" }}
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={loading}>
                                {loading ? "Sending..." : "Send Message"}
                            </button>
                        </form>
                    )}
                </div>
            </section>

            <footer className="landing-footer" style={{ marginTop: "40px" }}>
                <div className="footer-bottom">
                    <p>© 2026 Cofounder Matching Platform. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

export default Contact;
