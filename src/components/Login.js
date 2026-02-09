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
      const data = await login(email, password);
      if (!data.success) {
        setError(data.msg || "Login failed");
        if (data.msg && data.msg.includes("verify your email")) {
          setShowResend(true);
        }
      } else {
        localStorage.setItem("loggedInUser", data.username || email);
        localStorage.setItem("userEmail", email);
        email === "appadmin@gmail.com" ? navigate("/admin") : navigate("/welcome");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
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
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && (
          <div style={{ margin: "10px 0" }}>
            <p style={{ color: "#ffb3b3", fontSize: "0.9rem" }}>{error}</p>
            {showResend && (
              <button
                onClick={handleResend}
                className="text-link"
                style={{ background: "none", border: "none", color: "#4CAF50", textDecoration: "underline", cursor: "pointer", padding: "0", fontSize: "0.85rem", marginTop: "5px" }}
              >
                Resend verification link
              </button>
            )}
          </div>
        )}
        <button onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
        <button className="secondary-btn" onClick={() => navigate("/signup")} disabled={loading}>Signup</button>
      </div>
    </div>
  );
}

export default Login;
