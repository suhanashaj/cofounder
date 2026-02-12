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

  return (
    <div className="container">
      <div className="left">
        <h2>Welcome Back</h2>
        <p>Login to continue your journey.</p>
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
