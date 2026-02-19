import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/about.css";

function About() {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const values = [
        { icon: "🤝", title: "Complementary Skills", desc: "We believe the best teams combine technical prowess with business acumen." },
        { icon: "💎", title: "Shared Values", desc: "Alignment in core values is the foundation of long-term startup success." },
        { icon: "🎯", title: "Aligned Goals", desc: "Connecting visionaries who want to solve the same problems." }
    ];

    return (
        <div className="about-page-wrapper">
            {/* Navbar */}
            <nav className="about-nav">
                <div className="nav-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>Cofounder.</div>
                <div className="nav-back">
                    <button className="btn-ghost" onClick={() => navigate("/")}>← Back to Home</button>
                </div>
            </nav>

            <main className="about-main-content">
                <header className="about-header">
                    <span className="about-tag">Who We Are</span>
                    <h1 className="about-title">About Us</h1>
                    <div className="title-underline"></div>
                </header>

                <div className="about-hero-section">
                    <div className="about-mission-card">
                        <h2>Our Mission</h2>
                        <p>
                            Our mission is to <strong>reduce startup failure</strong> caused by poor team formation.
                            Many startups fail not because of ideas, but because founders choose incompatible partners.
                            We aim to solve this by providing a structured, data-driven approach to co-founder discovery.
                        </p>
                    </div>
                </div>

                <div className="about-vision-section">
                    <div className="vision-content">
                        <h3>Our Philosophy</h3>
                        <p>
                            We believe successful startups are built by teams with <strong>complementary skills,
                                shared values, and aligned goals</strong>. Our platform creates a trusted environment
                            where founders can connect meaningfully, communicate openly, and build
                            long-term partnerships.
                        </p>
                    </div>
                </div>

                <div className="values-grid">
                    {values.map((v, i) => (
                        <div key={i} className="value-card">
                            <div className="value-icon">{v.icon}</div>
                            <h4>{v.title}</h4>
                            <p>{v.desc}</p>
                        </div>
                    ))}
                </div>

                <section className="about-story">
                    <div className="story-content">
                        <h2>Why we started</h2>
                        <p>
                            Starting a company is one of the hardest things a person can do.
                            Doing it alone is even harder. We saw thousands of brilliant minds
                            stuck in the discovery phase because they couldn't find "the one"
                            to build with.
                        </p>
                        <p>
                            Cofounder. was born to bridge that gap and ensure no great idea
                            dies because of a missing teammate.
                        </p>
                    </div>
                </section>

                <div className="about-cta">
                    <h3>Be part of the next big thing</h3>
                    <button className="btn-primary" onClick={() => navigate("/signup")}>Join the Community</button>
                </div>
            </main>

            <footer className="about-footer">
                <p>© 2026 Cofounder Matching Platform. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default About;
