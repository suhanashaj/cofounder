import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, resendVerification } from "../utils/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setError("");
    setLoading(true);
    setShowResend(false);

    try {
      console.log("Login: Starting login for", email);
      const data = await login(email, password);

      if (!data.success) {
        console.error("Login: Failed", data.msg);
        setError(data.msg || "Login failed");
        if (data.msg && data.msg.includes("verify your email")) {
          setShowResend(true);
        }
        setLoading(false); // Only reset loading on failure
      } else {
        console.log("Login: Success, setting storage and navigating...");
        localStorage.setItem("loggedInUser", data.username || email);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userRole", data.role || "user");

        const normalizedEmail = email.toLowerCase();
        const isAdmin = data.role === "admin" || normalizedEmail === "appadmin@gmail.com" || normalizedEmail === "admin@example.com";

        const target = isAdmin ? "/admin" : "/welcome";
        console.log("Login: Success! Hard redirecting to", target);

        // Using window.location.href forces a clean react state load
        // which is the most reliable way to avoid 'lag' in redirection logic
        window.location.href = target;
      }
    } catch (err) {
      console.error("Login: Unexpected error", err);
      setError("An unexpected error occurred: " + err.message);
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const res = await resendVerification();
    alert(res.msg);
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        background: "#020617",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999,
        overflow: "hidden"
      }}>
        <div className="loader-aura"></div>
        <div style={{ zIndex: 10, textAlign: "center", padding: "0 20px" }}>
          <p style={{ fontSize: "1.2rem", color: "var(--accent-color)", fontWeight: "800", letterSpacing: "6px", animation: "pulse 2s infinite", margin: 0 }}>
            AUTHENTICATING
          </p>
          <p style={{ fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.4)", marginTop: "12px", letterSpacing: "2px" }}>
            ESTABLISHING SECURE SESSION
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="left">
        <div className="auth-image-container">
          <img
            src="https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&q=80&w=800"
            alt="Business Meeting"
            className="auth-image"
          />
          <div className="auth-overlay">
            <h2>Welcome Back</h2>
            <p>Login to continue your journey.</p>
          </div>
        </div>
      </div>
      <div className="right">
        <h2>Login</h2>
        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} autoComplete="on">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            name="email"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
            name="password-input-field"
          />
          {error && (
            <div style={{ margin: "10px 0" }}>
              <p style={{ color: "#ffb3b3", fontSize: "0.9rem" }}>{error}</p>
              {showResend && (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-link"
                  style={{ background: "none", border: "none", color: "#4CAF50", textDecoration: "underline", cursor: "pointer", padding: "0", fontSize: "0.85rem", marginTop: "5px" }}
                >
                  Resend verification link
                </button>
              )}
            </div>
          )}
          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <button className="secondary-btn" onClick={() => navigate("/signup")} disabled={loading} style={{ width: "100%", marginTop: "10px" }}>Signup</button>
        <button className="text-link" onClick={() => navigate("/")} style={{ width: "100%", marginTop: "15px", background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: "0.9rem" }}>← Back to Home</button>
      </div>
    </div>
  );
}

export default Login;
