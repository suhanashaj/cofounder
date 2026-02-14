import React, { useState, useEffect } from "react";
import { saveProfileAPI, getProfileAPI, getCurrentUserProfile, logout } from "../utils/api";
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

  const professionalAvatars = [
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop"
  ];

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await getCurrentUserProfile();
      if (res.success) {
        setProfile(prev => ({
          ...prev,
          ...res.data,
          certificate: prev.certificate,
          profilePic: prev.profilePic
        }));
      }
      setInitialLoading(false);
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
        setProfile((prev) => ({ ...prev, [field]: reader.result, profilePicUrl: "" }));
      };
      reader.readAsDataURL(file);
    }
  };

  const selectAvatar = (url) => {
    setProfile(prev => ({ ...prev, profilePic: null, profilePicUrl: url }));
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

  if (initialLoading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        background: "var(--primary-bg)",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999,
        overflow: "hidden"
      }}>
        <div className="loader-aura"></div>
        <p style={{ fontSize: "1.2rem", color: "var(--accent-color)", fontWeight: "800", letterSpacing: "4px", zIndex: 10, animation: "pulse 2s infinite", textAlign: "center", padding: "0 20px" }}>
          PREPARING PROFILE CORE...
        </p>
      </div>
    );
  }

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
              <div className="profile-avatar-container" style={{ position: "relative" }}>
                <img
                  src={profile.profilePic || profile.profilePicUrl || `https://ui-avatars.com/api/?name=${username}&background=6366f1&color=fff&bold=true&size=128`}
                  className="profile-avatar-img"
                  alt="Avatar"
                />
                {/* Show AVATAR watermark if using pre-selected avatar */}
                {profile.profilePicUrl && professionalAvatars.includes(profile.profilePicUrl) && (
                  <div style={{
                    position: "absolute",
                    bottom: "8px",
                    right: "8px",
                    background: "rgba(0, 0, 0, 0.75)",
                    color: "white",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "0.65rem",
                    fontWeight: "800",
                    letterSpacing: "1px",
                    backdropFilter: "blur(4px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)"
                  }}>
                    AVATAR
                  </div>
                )}
              </div>
              <h3>{profile.fullName || username}</h3>
              <p style={{ color: "var(--text-muted)", marginBottom: "15px" }}>{profile.role || "Founder"}</p>

              <div className={`status-badge ${profile.verified ? "verified" : "pending"}`}>
                {profile.verified ? "✅ Verified" : "⏳ Verification Pending"}
              </div>

              <div style={{ marginTop: "30px", width: "100%" }}>
                <h4 style={{ fontSize: "0.8rem", color: "var(--accent-color)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "15px", textAlign: "left" }}>Professional Avatars</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "20px" }}>
                  {professionalAvatars.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => selectAvatar(url)}
                      style={{
                        width: "100%",
                        paddingBottom: "100%",
                        borderRadius: "12px",
                        backgroundImage: `url(${url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        cursor: "pointer",
                        border: profile.profilePicUrl === url ? "3px solid var(--accent-color)" : "2px solid transparent",
                        boxShadow: profile.profilePicUrl === url ? "0 0 15px var(--accent-glow)" : "none",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        transform: profile.profilePicUrl === url ? "scale(0.95)" : "none",
                        opacity: profile.profilePicUrl === url ? 1 : 0.6
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.transform = "scale(1.05)"; }}
                      onMouseLeave={(e) => { if (profile.profilePicUrl !== url) { e.currentTarget.style.opacity = 0.6; e.currentTarget.style.transform = "none"; } }}
                    />
                  ))}
                </div>

                {/* Upload Your Own Photo Option */}
                <label
                  htmlFor="customProfilePicInput"
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "12px 20px",
                    background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))",
                    border: "2px dashed var(--accent-color)",
                    borderRadius: "12px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.3s",
                    marginBottom: "20px",
                    fontWeight: "700",
                    fontSize: "0.85rem",
                    color: "var(--accent-color)",
                    textTransform: "uppercase",
                    letterSpacing: "1px"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))";
                    e.currentTarget.style.transform = "scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  📷 Upload Your Photo
                  <input
                    id="customProfilePicInput"
                    type="file"
                    onChange={(e) => handleFileChange(e, "profilePic")}
                    style={{ display: "none" }}
                    accept="image/*"
                  />
                </label>

                <h4 style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px", textAlign: "left" }}>Documents</h4>
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
