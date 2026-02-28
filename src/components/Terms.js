import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/landing.css";

function Terms() {
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
                        Terms of <span>Service</span>
                    </h1>
                    <p className="hero-description">
                        Please read these terms carefully before using Cofounder. By using our platform, you agree to these terms.
                    </p>
                </div>
            </header>

            <section className="features-section" style={{ paddingTop: "20px" }}>
                <div style={{ maxWidth: "900px", margin: "0 auto", color: "var(--text-muted)", lineHeight: "1.8", fontSize: "1.1rem" }}>
                    <h2 style={{ color: "white", marginBottom: "20px" }}>1. Acceptance of Terms</h2>
                    <p style={{ marginBottom: "30px" }}>
                        By accessing or using the Cofounder. platform, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our services.
                    </p>

                    <h2 style={{ color: "white", marginBottom: "20px" }}>2. Use of Services</h2>
                    <p style={{ marginBottom: "30px" }}>
                        You are responsible for your use of the platform and any content you provide. You must be at least 18 years old to use Cofounder. You agree to provide accurate and complete information and to keep it up to date.
                    </p>

                    <h2 style={{ color: "white", marginBottom: "20px" }}>3. Prohibited Conduct</h2>
                    <p style={{ marginBottom: "30px" }}>
                        You agree not to use the platform for any illegal purpose or in any way that violates these terms. This includes, but is not limited to, harassment, spamming, providing false information, or trying to interfere with the operation of the platform.
                    </p>

                    <h2 style={{ color: "white", marginBottom: "20px" }}>4. Intellectual Property</h2>
                    <p style={{ marginBottom: "30px" }}>
                        Cofounder. and its logos, content, and services are the property of Cofounder Matching Platform. You are granted a limited, non-exclusive license to use the platform for its intended purpose. You may not copy or use any part of the platform without our permission.
                    </p>

                    <h2 style={{ color: "white", marginBottom: "20px" }}>5. Termination</h2>
                    <p style={{ marginBottom: "30px" }}>
                        We reserve the right to suspend or terminate your account at any time, with or without cause, if you violate these terms or engage in any conduct that we deem inappropriate.
                    </p>

                    <h2 style={{ color: "white", marginBottom: "20px" }}>6. Limitation of Liability</h2>
                    <p style={{ marginBottom: "30px" }}>
                        We provide our services "as is" and without any warranty. We are not liable for any damages that may result from your use of the platform, including any interactions or agreements you make with other users found through Cofounder.
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

export default Terms;
