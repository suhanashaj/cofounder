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
                    <h1 className="hero-title">
                        Click to make the most out of <span>your startup journey</span>
                    </h1>
                    <p className="hero-description">
                        Building a startup is hard. Finding a co-founder shouldn't be.
                        Join 10,000+ vetted entrepreneurs matching on skills, vision, and domain expertise.
                    </p>
                    <div className="hero-cta">
                        <button className="btn-primary" onClick={() => navigate("/signup")}>Start Free Account</button>
                        <button className="btn-secondary" onClick={() => navigate("/find")}>Browse Experts</button>
                    </div>
                </div>
                <div className="hero-image">
                    <div className="hero-visual-container">
                        {/* Main hero image */}
                        <img
                            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1000"
                            alt="Collaboration"
                            className="hero-main-image"
                        />
                        {/* Floating feature cards */}
                        <div className="floating-card card-1">
                            <div className="card-icon">🎯</div>
                            <div className="card-text">
                                <strong>Smart Matching</strong>
                                <p>AI-powered connections</p>
                            </div>
                        </div>
                        <div className="floating-card card-2">
                            <div className="card-icon">🛡️</div>
                            <div className="card-text">
                                <strong>Verified Profiles</strong>
                                <p>100% authenticated</p>
                            </div>
                        </div>
                        <div className="floating-card card-3">
                            <div className="card-icon">💬</div>
                            <div className="card-text">
                                <strong>Direct Chat</strong>
                                <p>Instant messaging</p>
                            </div>
                        </div>
                        <div className="hero-glow"></div>
                    </div>
                </div>
            </header>

            {/* Speed Up Workflow Section */}
            <section className="workflow-section">
                <div className="workflow-content">
                    <span className="section-label">Features</span>
                    <h2 className="workflow-title">Speed up your co-founder search with one powerful tool</h2>
                    <p className="workflow-description">
                        Our platform streamlines every step of finding and connecting with the perfect co-founder,
                        from discovery to collaboration.
                    </p>
                    <button className="btn-primary" onClick={() => navigate("/signup")}>Get Started</button>
                    <button className="btn-ghost" style={{ marginLeft: "20px" }}>Browse All Features →</button>
                </div>
            </section>

            {/* Features Grid */}
            <section className="features-section">
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

            {/* Create and Edit Section */}
            <section className="create-section">
                <div className="create-visual">
                    <div className="visual-mockup">
                        <div className="mockup-header">
                            <div className="mockup-dots">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                        <div className="mockup-content">
                            <div className="profile-preview">
                                <div className="preview-avatar"></div>
                                <div className="preview-info">
                                    <div className="preview-line long"></div>
                                    <div className="preview-line short"></div>
                                </div>
                            </div>
                            <div className="skill-tags">
                                <span className="tag">React</span>
                                <span className="tag">Python</span>
                                <span className="tag">AI/ML</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="create-content">
                    <h2>Create and edit your profile as easy as 1, 2 & 3</h2>
                    <p>
                        Build a compelling founder profile in minutes. Showcase your skills, experience,
                        and startup vision to attract the perfect co-founder match.
                    </p>
                    <ul className="feature-list">
                        <li>✓ Professional profile templates</li>
                        <li>✓ Skill & domain matching</li>
                        <li>✓ Portfolio integration</li>
                        <li>✓ Real-time updates</li>
                    </ul>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <h3>Cofounder.</h3>
                        <p>Connecting visionaries to build the future together.</p>
                    </div>
                    <div className="footer-links">
                        <div className="footer-column">
                            <h4>Product</h4>
                            <a href="#features">Features</a>
                            <a href="#pricing">Pricing</a>
                            <a href="#about">About</a>
                        </div>
                        <div className="footer-column">
                            <h4>Resources</h4>
                            <a href="#blog">Blog</a>
                            <a href="#help">Help Center</a>
                            <a href="#contact">Contact</a>
                        </div>
                        <div className="footer-column">
                            <h4>Legal</h4>
                            <a href="#privacy">Privacy</a>
                            <a href="#terms">Terms</a>
                            <a href="#security">Security</a>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2026 Cofounder Matching Platform. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

export default Landing;
