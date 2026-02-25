import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPasswordAPI } from "../utils/api";
import "../css/style.css";
import "../css/auth.css";

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const oobCode = searchParams.get("oobCode");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!oobCode) {
            setError("Invalid or missing reset code. Please request a new password reset link.");
        }
    }, [oobCode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            setError("Password should be at least 6 characters long.");
            return;
        }

        setError("");
        setMessage("");
        setLoading(true);

        try {
            const res = await resetPasswordAPI(oobCode, password);
            if (res.success) {
                setMessage(res.msg);
                setTimeout(() => {
                    navigate("/login");
                }, 3000);
            } else {
                setError(res.msg);
            }
        } catch (err) {
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    if (!oobCode && error) {
        return (
            <div className="container login-page-container">
                <div className="right" style={{ textAlign: "center", width: "100%" }}>
                    <h2>Reset Password</h2>
                    <p style={{ color: "#ffb3b3", marginBottom: "20px" }}>{error}</p>
                    <button onClick={() => navigate("/forgot-password")}>Request New Link</button>
                </div>
            </div>
        );
    }

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
                        <h2>New Credentials</h2>
                        <p>Secure your account with a new password.</p>
                    </div>
                </div>
            </div>
            <div className="right">
                <h2>Reset Password</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        placeholder="New Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                    />
                    <input
                        type="password"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                    />
                    {error && <p style={{ color: "#ffb3b3", fontSize: "0.9rem", marginBottom: "15px" }}>{error}</p>}
                    {message && <p style={{ color: "#4CAF50", fontSize: "0.9rem", marginBottom: "15px" }}>{message}</p>}

                    <button type="submit" disabled={loading || !oobCode}>
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ResetPassword;
