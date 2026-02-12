import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/landing.css";

function Landing() {
    const navigate = useNavigate();
    const isLoggedIn = localStorage.getItem("loggedInUser");

    return (
        <div className="landing-wrapper">
            {/* Navbar */}
            <nav className="landing-nav">
                <div className="nav-logo">Cofounder.</div>
                <div className="nav-auth-btns">
                    {isLoggedIn ? (
                        <button className="btn-primary" onClick={() => navigate("/welcome")}>Go to Dashboard</button>
                    ) : (
                        <>
                            <button className="btn-ghost" onClick={() => navigate("/login")}>Login</button>
                            <button className="btn-primary" onClick={() => navigate("/signup")}>Get Started</button>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <header className="hero-section">
                <div className="hero-content">
                    <span className="hero-tagline">🚀 Empowering the next generation of founders</span>
                    <h1 className="hero-title">Find the <span>perfect partner</span> for your startup journey.</h1>
                    <p className="hero-description">
                        Building a startup is hard. Finding a co-founder shouldn't be.
                        Join 10,000+ vetteed entrepreneurs matching on skills, vision, and domain expertise.
                    </p>
                    <div className="hero-cta">
                        <button className="btn-primary" onClick={() => navigate("/signup")}>Join Community</button>
                        <button className="btn-secondary" onClick={() => navigate("/find")}>Explore Experts</button>
                    </div>
                </div>
                <div className="hero-image">
                    {/* Using a high-quality placeholder since direct generation failed */}
                    <img
                        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1000"
                        alt="Collaboration"
                        className="hero-image-vibe"
                    />
                </div>
            </header>

            {/* Features Section */}
            <section className="features-section">
                <span className="section-label">Features</span>
                <h2 className="section-title">Built for Founders, by Founders</h2>

                <div className="features-grid">
                    <div className="feature-card">
                        <span className="feature-icon">🛡️</span>
                        <h3>Verified Identity</h3>
                        <p>Skip the noise. Every profile is manually vetted and verified to ensure you're talking to real innovators.</p>
                    </div>

                    <div className="feature-card">
                        <span className="feature-icon">🎯</span>
                        <h3>Smart Matching</h3>
                        <p>Our algorithm connects you based on complementary skills, domain passion, and shared project availability.</p>
                    </div>

                    <div className="feature-card">
                        <span className="feature-icon">💬</span>
                        <h3>Direct Access</h3>
                        <p>Seamlessly reach out to potential partners. Start chatting instantly once both sides show interest.</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: "60px 8%", borderTop: "1px solid #eee", textAlign: "center", color: "var(--text-muted)" }}>
                <p>© 2026 Cofounder Matching Platform. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default Landing;
