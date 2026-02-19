import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/features.css";

function Features() {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const highlightFeatures = [
        { icon: "🛡️", title: "Verified Profiles", desc: "100% manually vetted founders to ensure authentic connections." },
        { icon: "🎯", title: "Skill Matching", desc: "Our AI finds partners whose skills complement your own perfectly." },
        { icon: "🚀", title: "Domain Focused", desc: "Filter by industries like Fintech, AI, SaaS, and Biotech." },
        { icon: "📊", title: "Experience Level", desc: "Find partners with specific years of startup or corporate background." },
        { icon: "🌍", title: "Global Search", desc: "Connect with founders across different continents and timezones." },
        { icon: "🔒", title: "Secure Chat", desc: "Encrypted messaging to discuss your next big idea safely." }
    ];

    return (
        <div className="features-page-wrapper">
            {/* Navbar */}
            <nav className="features-nav">
                <div className="nav-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>Cofounder.</div>
                <div className="nav-back">
                    <button className="btn-ghost" onClick={() => navigate("/")}>← Back to Home</button>
                </div>
            </nav>

            <main className="features-main-content">
                <header className="features-header">
                    <span className="features-tag">Platform Capability</span>
                    <h1 className="features-title">Features</h1>
                    <div className="title-underline"></div>
                </header>

                <div className="features-text-container">
                    <section className="feature-block">
                        <div className="feature-icon-wrapper">🤝</div>
                        <div className="feature-description">
                            <h3>Find Your Perfect Match</h3>
                            <p>
                                Our co-founder matching platform is designed to help founders find the right partner,
                                <strong> not just any partner</strong>. Users create comprehensive profiles that include their
                                skills (technical, business, marketing, design, etc.), years of experience,
                                startup domain interests, availability, and long-term goals.
                            </p>
                        </div>
                    </section>

                    <section className="feature-block">
                        <div className="feature-icon-wrapper">🧠</div>
                        <div className="feature-description">
                            <h3>Intelligent Discovery</h3>
                            <p>
                                The platform uses this information to provide <strong>intelligent matching suggestions</strong>,
                                allowing users to discover potential co-founders who complement their strengths
                                and align with their vision. Advanced search and filtering options help users
                                narrow down candidates based on specific requirements such as domain expertise,
                                location, commitment level, and previous startup experience.
                            </p>
                        </div>
                    </section>

                    <section className="feature-block">
                        <div className="feature-icon-wrapper">💬</div>
                        <div className="feature-description">
                            <h3>Secure Collaboration</h3>
                            <p>
                                Once a match is found, users can send connection requests and begin
                                <strong> secure in-app conversations</strong>. The built-in chat system enables founders
                                to discuss ideas, validate compatibility, and build trust before committing to a partnership.
                            </p>
                        </div>
                    </section>
                </div>

                {/* New Icons Section */}
                <section className="features-highlights-section">
                    <div className="highlights-header">
                        <h2>Exploration Toolkit</h2>
                        <p>Everything you need to build the next unicorn</p>
                    </div>
                    <div className="highlights-grid">
                        {highlightFeatures.map((f, i) => (
                            <div key={i} className="highlight-card">
                                <div className="highlight-icon">{f.icon}</div>
                                <h4>{f.title}</h4>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="features-cta">
                    <h3>Ready to find your partner in crime?</h3>
                    <button className="btn-primary" onClick={() => navigate("/signup")}>Get Started for Free</button>
                </div>
            </main>

            <footer className="features-footer">
                <p>© 2026 Cofounder Matching Platform. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default Features;
