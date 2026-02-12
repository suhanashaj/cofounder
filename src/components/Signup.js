import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup } from "../utils/api";

function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      const res = await signup(username, email, password);
      console.log("Signup API response:", res);
      if (res.success) {
        alert("Signup successful. Please login.");
        navigate("/login");
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

  return (
    <div className="container">
      <div className="left">
        <h2>Join Us Today,</h2>
        <p>Create your account and start your journey.</p>
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
