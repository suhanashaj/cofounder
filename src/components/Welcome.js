import React from "react";
import { useNavigate } from "react-router-dom";

function Welcome() {
  const navigate = useNavigate();
  const user = localStorage.getItem("loggedInUser");

  return (
    <body className="welcome-body">
      <nav className="navbar">
        <ul className="nav-links">
          <li onClick={() => navigate("/welcome")}>HOME</li>
          <li onClick={() => navigate("/profile")}>PROFILE</li>
          <li onClick={() => navigate("/find")}>FIND CO-FOUNDER</li>
          <li onClick={() => { localStorage.removeItem("loggedInUser"); navigate("/login"); }}>LOGOUT</li>
        </ul>
      </nav>
      <section className="hero">
        <h1 id="welcomeMsg">WELCOME, {user?.toUpperCase()}</h1>
        <p>Identifying Suitable Cofounder</p>
        <button className="hero-btn" onClick={() => navigate("/profile")}>Edit Profile</button>
      </section>
    </body>
  );
}

export default Welcome;
