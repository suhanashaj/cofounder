import React, { useState, useEffect } from "react";
import { saveProfileAPI, getProfileAPI, logout } from "../utils/api";
import { useNavigate } from "react-router-dom";

function Profile() {
  const navigate = useNavigate();
  const username = localStorage.getItem("loggedInUser");

  const [profile, setProfile] = useState({
    skills: "",
    domain: "",
    experience: "",
    availability: "",
    certificate: null,
    certificateUrl: "",
    profilePic: null,
    profilePicUrl: "",
    fullName: "",
    role: "",
    location: "",
    email: "",
    whatsapp: "",
    linkedin: "",
    github: "",
    about: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (username) {
        const res = await getProfileAPI(username);
        if (res.success) {
          setProfile(prev => ({
            ...prev,
            ...res.data,
            // Keep local base64 previews if they exist
            certificate: prev.certificate,
            profilePic: prev.profilePic
          }));
        }
      }
    };
    fetchProfile();
  }, [username]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfile((prev) => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!username) {
      alert("User session not found. Please login again.");
      return;
    }
    setLoading(true);
    try {
      const data = await saveProfileAPI(username, profile);
      alert(data.msg);
    } catch (err) {
      alert("Error saving profile: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page-wrapper">
      {/* Sidebar - Consistent with Dashboard */}
      <aside className="sidebar">
        <div className="sidebar-logo">Cofounder.</div>
        <ul className="nav-menu">
          <li className="nav-item" onClick={() => navigate("/welcome")}>
            <span>🏠</span> Dashboard
          </li>
          <li className="nav-item active" onClick={() => navigate("/profile")}>
            <span>👤</span> My Profile
          </li>
          <li className="nav-item" onClick={() => navigate("/find")}>
            <span>🔍</span> Find Partners
          </li>
          <li className="nav-item" onClick={() => navigate("/messages")}>
            <span>💬</span> Messages
          </li>
        </ul>
        <div className="nav-item logout-item" onClick={async () => { await logout(); navigate("/login"); }}>
          <span>🚪</span> Logout
        </div>
      </aside>

      {/* Main Content */}
      <main className="profile-main-content">
        <header className="header-section">
          <div className="welcome-text">
            <h1>My Profile</h1>
            <p>Keep your information updated to find the best co-founder matches.</p>
          </div>
          <button className="action-btn" onClick={() => navigate("/welcome")} style={{ background: "white", color: "var(--accent-color)" }}>
            Back to Dashboard
          </button>
        </header>

        <div className="profile-grid-layout">
          {/* Left: Avatar and Certificate */}
          <div className="profile-left-col">
            <div className="profile-card profile-sidebar-card">
              <div className="profile-avatar-container">
                <img
                  src={profile.profilePic || profile.profilePicUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + username}
                  className="profile-avatar-img"
                  alt="Avatar"
                />
                <label className="avatar-edit-icon" htmlFor="profilePicInput">
                  📷
                </label>
                <input
                  id="profilePicInput"
                  type="file"
                  onChange={(e) => handleFileChange(e, "profilePic")}
                  style={{ display: "none" }}
                  accept="image/*"
                />
              </div>
              <h3>{profile.fullName || username}</h3>
              <p style={{ color: "var(--text-muted)", marginBottom: "15px" }}>{profile.role || "Founder"}</p>

              <div className={`status-badge ${profile.verified ? "verified" : "pending"}`}>
                {profile.verified ? "✅ Verified" : "⏳ Verification Pending"}
              </div>

              <div style={{ marginTop: "30px", width: "100%" }}>
                <h4 style={{ fontSize: "0.9rem", marginBottom: "10px", textAlign: "left" }}>Documents</h4>
                <label className="file-upload-label" style={{ width: "100%", textAlign: "center" }}>
                  Upload Certificate
                  <input type="file" onChange={(e) => handleFileChange(e, "certificate")} style={{ display: "none" }} />
                </label>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "8px" }}>
                  PDF or Images only
                </p>
              </div>
            </div>

            <div className="profile-card">
              <h4 style={{ marginBottom: "15px" }}>Security</h4>
              <div className="form-group">
                <label>Change Password</label>
                <input type="password" placeholder="Current Password" style={{ marginBottom: "10px" }} />
                <input type="password" placeholder="New Password" />
                <button className="action-btn" style={{ marginTop: "10px", width: "100%" }}>Update Password</button>
              </div>
            </div>
          </div>

          {/* Right: Detailed Info */}
          <div className="profile-right-col">
            <div className="profile-card profile-info-section">
              <h3>Personal Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Username</label>
                  <input value={username} readOnly />
                </div>
                <div className="form-group">
                  <label>Full Name</label>
                  <input name="fullName" placeholder="Enter full name" value={profile.fullName} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <input value={profile.role} readOnly />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input name="location" placeholder="City, Country" value={profile.location} onChange={handleChange} />
                </div>
              </div>

              <h3>Professional Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Skills</label>
                  <input name="skills" placeholder="e.g. React, Python, Marketing" value={profile.skills} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Domain</label>
                  <input name="domain" placeholder="e.g. Fintech, Edtech" value={profile.domain} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Experience (Years)</label>
                  <input name="experience" type="number" value={profile.experience} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Availability</label>
                  <select name="availability" value={profile.availability} onChange={handleChange}>
                    <option value="">Select...</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Weekends">Weekends</option>
                  </select>
                </div>
              </div>

              <h3>Contact & Social</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Email Address</label>
                  <input value={profile.email} readOnly />
                </div>
                <div className="form-group">
                  <label>WhatsApp</label>
                  <input name="whatsapp" placeholder="Include country code" value={profile.whatsapp} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>LinkedIn URL</label>
                  <input name="linkedin" placeholder="linkedin.com/in/..." value={profile.linkedin} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>GitHub/Portfolio</label>
                  <input name="github" placeholder="github.com/..." value={profile.github} onChange={handleChange} />
                </div>
              </div>

              <h3>About Me</h3>
              <div className="form-group full-width">
                <label>Bio & Startup Vision</label>
                <textarea
                  name="about"
                  placeholder="Tell us about yourself and what you're looking for..."
                  value={profile.about}
                  onChange={handleChange}
                  rows="4"
                ></textarea>
              </div>

              <div style={{ marginTop: "30px", display: "flex", justifyContent: "flex-end" }}>
                <button className="profile-save-btn" onClick={handleSave} disabled={loading}>
                  {loading ? "Saving Changes..." : "Save Profile Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;
