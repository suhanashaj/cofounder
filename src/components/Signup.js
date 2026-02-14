import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signup } from "../utils/api";
import { auth } from "../firebase";

function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Founder");
  const [error, setError] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      const res = await signup(username, email, password, role);
      console.log("Signup API response:", res);
      if (res.success) {
        setVerificationSent(true);
      } else {
        setError(res.msg || "Signup failed");
        alert(res.msg || "Signup failed");
      }
    } catch (err) {
      console.error("handleSignup error:", err);
      setError(err.message || String(err));
      alert(err.message || "Signup error");
    }
  };

  useEffect(() => {
    let interval;
    if (verificationSent) {
      interval = setInterval(async () => {
        if (auth.currentUser) {
          await auth.currentUser.reload();
          if (auth.currentUser.emailVerified) {
            clearInterval(interval);
            alert("Email verified! Redirecting to login.");
            navigate("/login");
          }
        }
      }, 3000); // Check every 3 seconds
    }
    return () => clearInterval(interval);
  }, [verificationSent, navigate]);

  if (verificationSent) {
    return (
      <div className="dashboard-wrapper" style={{ justifyContent: "center", alignItems: "center", padding: "40px" }}>
        <div className="stat-card" style={{ maxWidth: "600px", textAlign: "center", padding: "60px 40px" }}>
          <div style={{ fontSize: "4rem", marginBottom: "32px", animation: "pulse 2s infinite" }}>📧</div>
          <h2 style={{ fontSize: "2rem", fontWeight: "900", color: "white", marginBottom: "16px" }}>Verify Your Vision</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", lineHeight: "1.6" }}>
            We have sent a verification secure link to <strong style={{ color: "white" }}>{email}</strong>.
          </p>
          <div style={{ marginTop: "40px", padding: "24px", background: "rgba(99, 102, 241, 0.05)", borderRadius: "20px", border: "1px solid var(--border-glass)" }}>
            <p style={{ margin: 0, color: "var(--accent-color)", fontWeight: "600", fontSize: "0.9rem" }}>
              Awaiting confirmation from your mail server...
            </p>
          </div>
          <div style={{ marginTop: "40px" }}>
            <button className="secondary-btn" onClick={() => navigate("/login")}>
              RETURN TO LOGIN
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="left">
        <div className="auth-image-container">
          <img
            src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=800"
            alt="Startup Team"
            className="auth-image"
          />
          <div className="auth-overlay">
            <h2>Join Us Today,</h2>
            <p>Create your account and start your journey.</p>
          </div>
        </div>
      </div>
      <div className="right">
        <h2>Signup</h2>
        <form onSubmit={(e) => { e.preventDefault(); handleSignup(); }} autoComplete="off">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            name="new-username"
            autoComplete="off"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            name="new-email"
            autoComplete="off"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            name="new-password"
            autoComplete="new-password"
          />
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            style={{ width: "100%", padding: "10px", margin: "10px 0", borderRadius: "5px", border: "1px solid #ddd" }}
          >
            <option value="Founder">Founder</option>
            <option value="Cofounder">Cofounder</option>
          </select>
          <p style={{ color: "#ffb3b3" }}>{error}</p>
          <button type="submit">Signup</button>
        </form>
        <button className="secondary-btn" onClick={() => navigate("/login")}>Back to Login</button>
        <button className="text-link" onClick={() => navigate("/")} style={{ width: "100%", marginTop: "15px", background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: "0.9rem" }}>← Back to Home</button>
      </div>
    </div>
  );
}

export default Signup;
