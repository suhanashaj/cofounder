import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signup, updateVerificationStatus } from "../utils/api";
import { auth } from "../firebase";

function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Founder");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verifiedSuccess, setVerifiedSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (success && !verifiedSuccess) {
      console.log("Starting verification check...");
      interval = setInterval(async () => {
        try {
          if (auth.currentUser) {
            await auth.currentUser.reload();
            console.log("Verification status:", auth.currentUser.emailVerified);
            if (auth.currentUser.emailVerified) {
              clearInterval(interval);
              const res = await updateVerificationStatus(auth.currentUser.uid);
              if (res.success) {
                setVerifiedSuccess("Verification success! Redirecting now...");
                localStorage.setItem("loggedInUser", username);
                localStorage.setItem("userEmail", email);
                setTimeout(() => navigate("/welcome"), 2000);
              }
            }
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 3000); // Check every 3 seconds
    }
    return () => clearInterval(interval);
  }, [success, verifiedSuccess, navigate, username, email]);

  const handleSignup = async () => {
    if (!username || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await signup(username, email, password, role);
      if (res.success) {
        setSuccess(res.msg);
      } else {
        setError(res.msg || "Signup failed");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="left">
        <h2>Join Us Today,</h2>
        <p>Create your account and start your journey.</p>
      </div>
      <div className="right">
        <h2>Signup</h2>
        {!success ? (
          <>
            <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              style={{ width: "100%", padding: "10px", margin: "10px 0", borderRadius: "5px", border: "1px solid #ccc" }}
            >
              <option value="Founder">Founder</option>
              <option value="Co-Founder">Co-Founder</option>
            </select>
            {error && <p style={{ color: "#ffb3b3", fontSize: "0.9rem", margin: "10px 0" }}>{error}</p>}
            <button onClick={handleSignup} disabled={loading}>
              {loading ? "Creating account..." : "Signup"}
            </button>
            <button className="secondary-btn" onClick={() => navigate("/login")} disabled={loading}>Back to Login</button>
          </>
        ) : (
          <div className="success-container">
            {!verifiedSuccess ? (
              <>
                <p style={{ color: "#d1ffd1", background: "rgba(0, 128, 0, 0.2)", padding: "15px", borderRadius: "8px", border: "1px solid #4CAF50" }}>
                  {success}! <br />
                  <small>Please check your inbox and click the link.</small>
                </p>
                <p style={{ fontSize: "0.85rem", color: "#ccc", marginTop: "15px" }}>
                  <strong>Waiting for verification...</strong><br />
                  We will automatically log you in once you verify.
                </p>
              </>
            ) : (
              <div className="verified-animation">
                <p style={{ color: "#d1ffd1", background: "rgba(0, 128, 0, 0.2)", padding: "20px", borderRadius: "8px", border: "1px solid #4CAF50", fontWeight: "bold", fontSize: "1.1rem" }}>
                  ✅ {verifiedSuccess}
                </p>
              </div>
            )}
            <button style={{ marginTop: "20px" }} onClick={() => navigate("/login")}>Go to Login Now</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Signup;
