import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPasswordAPI } from "../utils/api";
import "../css/style.css";
import "../css/auth.css";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            setError("Please enter your email address.");
            return;
        }
        setError("");
        setMessage("");
        setLoading(true);

        try {
            const res = await forgotPasswordAPI(email);
            if (res.success) {
                setMessage(res.msg);
            } else {
                setError(res.msg);
            }
        } catch (err) {
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container login-page-container">
            <div className="left">
                <div className="auth-image-container">
                    <img
                        src="https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&q=80&w=800"
                        alt="Security"
                        className="auth-image"
                    />
                    <div className="auth-overlay">
                        <h2>Account Recovery</h2>
                        <p>Enter your email to reset your password.</p>
                    </div>
                </div>
            </div>
            <div className="right">
                <h2>Forgot Password</h2>
                <form onSubmit={handleSubmit}>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", marginBottom: "20px" }}>
                        We'll send a password reset link to your email address.
                    </p>
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    {error && <p style={{ color: "#ffb3b3", fontSize: "0.9rem", marginBottom: "15px" }}>{error}</p>}
                    {message && <p style={{ color: "#4CAF50", fontSize: "0.9rem", marginBottom: "15px" }}>{message}</p>}

                    <button type="submit" disabled={loading}>
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>
                <button
                    className="text-link"
                    onClick={() => navigate("/login")}
                    style={{ width: "100%", marginTop: "20px", background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: "0.9rem" }}
                >
                    ← Back to Login
                </button>
            </div>
        </div>
    );
}

export default ForgotPassword;
