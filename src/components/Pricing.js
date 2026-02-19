import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/pricing.css";

function Pricing() {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const tiers = [
        {
            name: "Free",
            price: "$0",
            period: "forever",
            tagline: "For early starters",
            features: [
                "Create basic profile",
                "Browse co-founders",
                "3 connection requests/week",
                "Community access"
            ],
            btnText: "Stay Free",
            highlight: false
        },
        {
            name: "Founder Pro",
            price: "$29",
            period: "per month",
            tagline: "Accelerate your search",
            features: [
                "Unlimited matches",
                "Priority visibility",
                "Advanced search filters",
                "Unlimited messaging",
                "Verified badge"
            ],
            btnText: "Go Pro",
            highlight: true
        },
        {
            name: "Enterprise",
            price: "Custom",
            period: "for teams",
            tagline: "Built for incubators",
            features: [
                "Bulk invites",
                "Dedicated manager",
                "Private network",
                "API access",
                "Advanced analytics"
            ],
            btnText: "Contact Us",
            highlight: false
        }
    ];

    return (
        <div className="pricing-page-wrapper">
            {/* Navbar */}
            <nav className="pricing-nav">
                <div className="nav-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>Cofounder.</div>
                <div className="nav-back">
                    <button className="btn-ghost" onClick={() => navigate("/")}>← Back to Home</button>
                </div>
            </nav>

            <main className="pricing-main-content">
                <header className="pricing-header">
                    <span className="pricing-tag">Pricing Plans</span>
                    <h1 className="pricing-title">Pricing</h1>
                    <div className="title-underline"></div>
                </header>

                <div className="pricing-intro-container">
                    <p className="pricing-intro-text">
                        The platform follows a <strong>founder-friendly pricing model</strong> to support users at every stage of their startup journey.
                    </p>
                </div>

                <div className="pricing-grid">
                    {tiers.map((tier, idx) => (
                        <div key={idx} className={`pricing-card ${tier.highlight ? 'highlighted' : ''}`}>
                            {tier.highlight && <div className="popular-tag">MOST POPULAR</div>}
                            <div className="card-top">
                                <h3>{tier.name}</h3>
                                <p className="tier-tagline">{tier.tagline}</p>
                                <div className="price-container">
                                    <span className="currency">$</span>
                                    <span className="amount">{tier.price.replace('$', '')}</span>
                                    <span className="period">/{tier.period}</span>
                                </div>
                            </div>
                            <ul className="tier-features">
                                {tier.features.map((f, i) => (
                                    <li key={i}>✓ {f}</li>
                                ))}
                            </ul>
                            <button className={`btn-tier ${tier.highlight ? 'primary' : 'ghost'}`} onClick={() => navigate("/signup")}>
                                {tier.btnText}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="pricing-details-section">
                    <section className="detail-block">
                        <div className="detail-icon">🌱</div>
                        <div className="detail-content">
                            <h3>Free for Everyone</h3>
                            <p>
                                A free plan allows new users to create profiles, browse potential co-founders,
                                and make limited connections. This ensures accessibility for students,
                                first-time founders, and early-stage entrepreneurs.
                            </p>
                        </div>
                    </section>

                    <section className="detail-block">
                        <div className="detail-icon">⚡</div>
                        <div className="detail-content">
                            <h3>Premium Power</h3>
                            <p>
                                Premium plans unlock advanced features such as unlimited matches,
                                priority profile visibility, advanced filters, instant messaging
                                without limits, and access to verified profiles. Pricing is
                                transparent, flexible, and designed to scale as the startup grows.
                            </p>
                        </div>
                    </section>
                </div>

                <div className="pricing-cta">
                    <h3>Find your founder today</h3>
                    <button className="btn-primary" onClick={() => navigate("/signup")}>Start Matching</button>
                </div>
            </main>

            <footer className="pricing-footer">
                <p>© 2026 Cofounder Matching Platform. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default Pricing;
