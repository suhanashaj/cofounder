import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/landing.css";

function Security() {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

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
                    <span className="hero-tagline">Last updated: February 28, 2026</span>
                    <h1 className="hero-title" style={{ fontSize: "3.5rem" }}>
                        Security <span>Framework</span>
                    </h1>
                    <p className="hero-description">
                        Security is at the heart of our platform. We use industry-leading tools and practices to keep your data safe.
                    </p>
                </div>
            </header>

            <section className="features-section" style={{ paddingTop: "20px" }}>
                <div style={{ maxWidth: "900px", margin: "0 auto", color: "var(--text-muted)", lineHeight: "1.8", fontSize: "1.1rem" }}>
                    <div className="features-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "40px" }}>
                        <div className="feature-card" style={{ padding: "30px" }}>
                            <span className="feature-icon">🔒</span>
                            <h3>Data Encryption</h3>
                            <p>We use SSL/TLS encryption for all data in transit and industry-standard encryption for data at rest.</p>
                        </div>
                        <div className="feature-card" style={{ padding: "30px" }}>
                            <span className="feature-icon">🛡️</span>
                            <h3>Secure Infrastructure</h3>
                            <p>Our infrastructure is hosted on secure, world-class cloud providers with multi-layer security controls.</p>
                        </div>
                        <div className="feature-card" style={{ padding: "30px" }}>
                            <span className="feature-icon">👤</span>
                            <h3>Identity Protection</h3>
                            <p>We use secure authentication methods and vetted profiles to ensure only real founders can access the platform.</p>
                        </div>
                        <div className="feature-card" style={{ padding: "30px" }}>
                            <span className="feature-icon">🔍</span>
                            <h3>Regular Audits</h3>
                            <p>We conduct regular security audits and vulnerability scans to maintain the security of our platform.</p>
                        </div>
                    </div>

                    <h2 style={{ color: "white", marginBottom: "20px" }}>How You Can Help</h2>
                    <ul style={{ marginBottom: "30px", paddingLeft: "20px" }}>
                        <li style={{ marginBottom: "10px" }}>Use a strong, unique password for your account.</li>
                        <li style={{ marginBottom: "10px" }}>Be cautious about sharing sensitive information with people you haven't yet verified.</li>
                        <li style={{ marginBottom: "10px" }}>Report any suspicious behavior to our support team immediately.</li>
                    </ul>

                    <h2 style={{ color: "white", marginBottom: "20px" }}>Reporting Security Issues</h2>
                    <p style={{ marginBottom: "30px" }}>
                        If you believe you've found a security vulnerability on Cofounder., please report it by contacting us at security@cofoundermatching.com. We take all security reports seriously and will investigate promptly.
                    </p>
                </div>
            </section>

            <footer className="landing-footer">
                <div className="footer-bottom">
                    <p>© 2026 Cofounder Matching Platform. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

export default Security;
