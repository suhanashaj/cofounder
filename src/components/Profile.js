import React, { useState, useEffect } from "react";
import { saveProfileAPI, getProfileAPI } from "../utils/api";
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
            // Ensure we don't overwrite local certificate state with null from db if editing
            certificate: prev.certificate
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfile((prev) => ({ ...prev, certificate: reader.result }));
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
    <div className="profile-body">
      <div className="profile-top">
        <h2>Identifying Suitable Co-Founder</h2>
        <button className="back-link" onClick={() => navigate("/welcome")}>Back</button>
      </div>

      <div className="profile-container">
        {/* LEFT PANEL */}
        <div className="profile-left">
          <img src="https://via.placeholder.com/140" className="avatar" alt="avatar" />
          <input type="file" onChange={handleFileChange} />
          <label>Education Certificate</label>
          <input type="file" onChange={handleFileChange} />
          <p className="verify pending">Verification: Pending</p>

          <h4>Change Password</h4>
          <input type="password" placeholder="Old Password" />
          <input type="password" placeholder="New Password" />
          <button>Change</button>
        </div>

        {/* RIGHT PANEL */}
        <div className="profile-right">
          <h3>Profile Information</h3>
          <div className="profile-grid">
            <div className="field-group">
              <label>Username (Fixed)</label>
              <input name="username" value={username} readOnly style={{ background: "#eee", cursor: "not-allowed" }} />
            </div>
            <div className="field-group">
              <label>Full Name</label>
              <input name="fullName" placeholder="Full Name" value={profile.fullName} onChange={handleChange} />
            </div>
            <div className="field-group">
              <label>Role (Fixed)</label>
              <input name="role" value={profile.role} readOnly style={{ background: "#eee", cursor: "not-allowed" }} />
            </div>
            <div className="field-group">
              <label>Skills</label>
              <input name="skills" placeholder="Skills (React, Node)" value={profile.skills} onChange={handleChange} />
            </div>
            <div className="field-group">
              <label>Domain</label>
              <input name="domain" placeholder="Domain" value={profile.domain} onChange={handleChange} />
            </div>
            <div className="field-group">
              <label>Experience</label>
              <input name="experience" type="number" placeholder="Experience (Years)" value={profile.experience} onChange={handleChange} />
            </div>
            <div className="field-group">
              <label>Location</label>
              <input name="location" placeholder="Location" value={profile.location} onChange={handleChange} />
            </div>
            <div className="field-group">
              <label>Availability</label>
              <input name="availability" placeholder="Availability" value={profile.availability} onChange={handleChange} />
            </div>
          </div>

          <h3>Contact Info</h3>
          <div className="profile-grid">
            <div className="field-group">
              <label>Email (Fixed)</label>
              <input name="email" type="email" value={profile.email} readOnly style={{ background: "#eee", cursor: "not-allowed" }} />
            </div>
            <div className="field-group">
              <label>WhatsApp</label>
              <input name="whatsapp" placeholder="WhatsApp" value={profile.whatsapp} onChange={handleChange} />
            </div>
            <div className="field-group">
              <label>LinkedIn</label>
              <input name="linkedin" placeholder="LinkedIn" value={profile.linkedin} onChange={handleChange} />
            </div>
            <div className="field-group">
              <label>GitHub</label>
              <input name="github" placeholder="GitHub" value={profile.github} onChange={handleChange} />
            </div>
          </div>

          <h3>About You</h3>
          <textarea name="about" placeholder="Describe yourself & your startup idea" value={profile.about} onChange={handleChange}></textarea>

          <button className="save-btn" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
