import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/landing.css";

function Privacy() {
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
                        Privacy <span>Policy</span>
                    </h1>
                    <p className="hero-description">
                        At Cofounder., we take your privacy seriously. This policy explains how we collect, use, and protect your personal information.
                    </p>
                </div>
            </header>

            <section className="features-section" style={{ paddingTop: "20px" }}>
                <div style={{ maxWidth: "900px", margin: "0 auto", color: "var(--text-muted)", lineHeight: "1.8", fontSize: "1.1rem" }}>
                    <h2 style={{ color: "white", marginBottom: "20px" }}>1. Information We Collect</h2>
                    <p style={{ marginBottom: "30px" }}>
                        We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with other users. This includes your name, email address, professional background, skills, and any other information you choose to provide.
                    </p>

                    <h2 style={{ color: "white", marginBottom: "20px" }}>2. How We Use Your Information</h2>
                    <p style={{ marginBottom: "30px" }}>
                        We use the information we collect to provide, maintain, and improve our services, including matching you with potential co-founders, facilitating communication, and personalizing your experience. We also use it for security purposes and to communicate with you about your account and our services.
                    </p>

                    <h2 style={{ color: "white", marginBottom: "20px" }}>3. Sharing of Information</h2>
                    <p style={{ marginBottom: "30px" }}>
                        We do not sell your personal information. We may share your information with other users as part of the normal operation of the platform (e.g., your profile information). We may also share information with third-party service providers who perform services on our behalf, or when required by law.
                    </p>

                    <h2 style={{ color: "white", marginBottom: "20px" }}>4. Data Security</h2>
                    <p style={{ marginBottom: "30px" }}>
                        We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction. However, no data transmission over the internet or storage system can be guaranteed to be 100% secure.
                    </p>

                    <h2 style={{ color: "white", marginBottom: "20px" }}>5. Your Rights</h2>
                    <p style={{ marginBottom: "30px" }}>
                        You have the right to access, update, or delete your personal information at any time through your account settings. You can also contact us if you have any questions or concerns about our privacy practices.
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

export default Privacy;
