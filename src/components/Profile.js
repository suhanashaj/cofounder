import React, { useState, useEffect } from "react";
import { saveProfileAPI, getCurrentUserProfile, logout, changePasswordAPI } from "../utils/api";
import { useNavigate } from "react-router-dom";

function Profile() {
  const navigate = useNavigate();
  const username = sessionStorage.getItem("loggedInUser");

  const [profile, setProfile] = useState({
    skills: [],
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
    skillsCertificate: null,
    skillsCertificateUrl: "",
    skillsCertificateStatus: "",
    verifiedSkills: [],
    // CV Specific Sections
    education: { degree: "", institution: "", year: "" },
    workExperience: { company: "", role: "", duration: "", description: "" },
    isFresher: false,
    projects: { title: "", link: "", description: "" },
    cvFile: null,
    cvUrl: "",
    // Founder Specific Fields
    companyName: "",
    startupIdea: "",
    startupStage: "",
    pitchVideoFile: null,
    pitchVideoUrl: "",
    lookingFor: "",
    otherLookingFor: "",
    requiredSkills: "",
  });
  const [skillInput, setSkillInput] = useState("");

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [errors, setErrors] = useState({});

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // Apply full-screen class to body for this page
    document.body.classList.add("full-screen-page");

    const fetchProfile = async () => {
      try {
        const res = await getCurrentUserProfile();
        if (res.success) {
          // Handle migration from string to array if necessary
          let skillsData = res.data.skills;
          if (typeof skillsData === 'string') {
            skillsData = skillsData.split(',').map(s => s.trim()).filter(s => s).map(s => ({
              name: s,
              status: 'unverified'
            }));
          } else if (!skillsData) {
            skillsData = [];
          }

          setProfile(prev => ({
            ...prev,
            ...res.data,
            skills: skillsData,
            education: Array.isArray(res.data.education) ? (res.data.education[0] || { degree: "", institution: "", year: "" }) : (res.data.education || { degree: "", institution: "", year: "" }),
            workExperience: Array.isArray(res.data.workExperience) ? (res.data.workExperience[0] || { company: "", role: "", duration: "", description: "" }) : (res.data.workExperience || { company: "", role: "", duration: "", description: "" }),
            isFresher: res.data.isFresher || false,
            projects: Array.isArray(res.data.projects) ? (res.data.projects[0] || { title: "", link: "", description: "" }) : (res.data.projects || { title: "", link: "", description: "" }),
            cvUrl: res.data.cvUrl || "",
            certificate: prev.certificate,
            profilePic: prev.profilePic,
            skillsCertificate: prev.skillsCertificate,
            verifiedSkills: res.data.verifiedSkills || [],
            // Founder fields
            companyName: res.data.companyName || "",
            startupIdea: res.data.startupIdea || "",
            startupStage: res.data.startupStage || "",
            pitchVideoUrl: res.data.pitchVideoUrl || "",
            lookingFor: res.data.lookingFor || "",
            otherLookingFor: res.data.otherLookingFor || "",
            requiredSkills: res.data.requiredSkills || "",
          }));
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    // Set a maximum loading time of 3 seconds
    const loadingTimeout = setTimeout(() => {
      setInitialLoading(false);
    }, 3000);

    fetchProfile();

    return () => {
      clearTimeout(loadingTimeout);
      document.body.classList.remove("full-screen-page");
    };
  }, [username]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      // Store the actual file object for uploading
      setProfile((prev) => ({ ...prev, [field]: file }));

      // For previewing
      const reader = new FileReader();
      reader.onload = () => {
        if (field === 'profilePic') {
          // Update preview URL for profile pic
          setProfile(prev => ({ ...prev, profilePicUrl: reader.result }));
        } else if (field === 'certificate') {
          // Update preview URL for certificate (if there was a preview field)
          setProfile(prev => ({ ...prev, certificateUrl: reader.result }));
        } else if (field === 'skillsCertificate') {
          setProfile(prev => ({ ...prev, skillsCertificateUrl: reader.result }));
        }

        // Clear error for the field
        if (errors[field]) {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };


  const addSkill = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault();
      const newSkill = skillInput.trim();
      if (newSkill && !profile.skills.find(s => s.name.toLowerCase() === newSkill.toLowerCase())) {
        setProfile(prev => ({
          ...prev,
          skills: [...prev.skills, { name: newSkill, status: 'unverified', verified: false }]
        }));
        setSkillInput("");
      }
    }
  };

  const removeSkill = (index) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const handleSkillFileChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const updatedSkills = [...profile.skills];
      updatedSkills[index] = {
        ...updatedSkills[index],
        certificateFile: file,
        status: 'pending' // Visual indicator it's ready to upload
      };
      setProfile(prev => ({ ...prev, skills: updatedSkills }));
    }
  };

  const handleEducationUpdate = (field, value) => {
    setProfile(prev => ({
      ...prev,
      education: { ...prev.education, [field]: value }
    }));

    // Clear error for the field being edited
    const errorKey = field === 'degree' ? 'educationDegree' : field === 'institution' ? 'educationInstitution' : null;
    if (errorKey && errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const handleExperienceUpdate = (field, value) => {
    setProfile(prev => ({
      ...prev,
      workExperience: { ...prev.workExperience, [field]: value }
    }));
  };

  const handleProjectUpdate = (field, value) => {
    setProfile(prev => ({
      ...prev,
      projects: { ...prev.projects, [field]: value }
    }));
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfile(prev => ({ ...prev, pitchVideoFile: file }));
    }
  };

  const [passwordData, setPasswordData] = useState({ current: "", new: "" });

  const handlePasswordUpdate = async () => {
    if (!passwordData.current || !passwordData.new) {
      alert("Please enter current and new password");
      return;
    }

    // Set loading for feedback
    setLoading(true);
    try {
      const res = await changePasswordAPI(passwordData.current, passwordData.new);
      alert(res.msg);
      if (res.success) {
        setPasswordData({ current: "", new: "" });
      }
    } catch (err) {
      alert("Error updating password: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!username) {
      alert("User session not found. Please login again.");
      return;
    }

    // Mandatory fields validation for both
    const newErrors = {};
    const isCoFounder = profile.role?.toLowerCase() === "co-founder" || profile.role?.toLowerCase() === "cofounder";
    const isFounder = profile.role?.toLowerCase() === "founder";

    if (!profile.fullName || profile.fullName.trim() === "") {
      newErrors.fullName = "Full Name is mandatory";
    }

    if (!profile.domain || profile.domain.trim() === "") {
      newErrors.domain = "Domain is mandatory";
    }

    if (!profile.location || profile.location.trim() === "") {
      newErrors.location = "Location is mandatory";
    }

    if (!profile.availability || profile.availability === "") {
      newErrors.availability = "Availability is mandatory";
    }

    // Role-specific validation
    if (isCoFounder) {
      if (profile.skills.length === 0) {
        newErrors.skills = "At least one skill is mandatory";
      }
      if (!profile.education?.degree || profile.education.degree.trim() === "") {
        newErrors.educationDegree = "Degree is mandatory";
      }
      if (!profile.education?.institution || profile.education.institution.trim() === "") {
        newErrors.educationInstitution = "Institution is mandatory";
      }
    }

    if (isFounder) {
      if (!profile.startupIdea || profile.startupIdea.trim() === "") {
        newErrors.startupIdea = "Startup Idea Description is mandatory";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert("Please fill in all mandatory fields (marked with *)");
      return;
    }

    setLoading(true);
    try {
      const data = await saveProfileAPI(username, profile);
      alert(data.msg);
      // Sync sessionStorage if profile pic was updated
      if (data.updatedProfilePicUrl) {
        setProfile(prev => ({ ...prev, profilePicUrl: data.updatedProfilePicUrl }));
        sessionStorage.setItem("userProfilePic", data.updatedProfilePicUrl);
      } else if (profile.profilePicUrl) {
        sessionStorage.setItem("userProfilePic", profile.profilePicUrl);
      }
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
      {/* Mobile Toggle */}
      <button className="mobile-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        {isMenuOpen ? "✕" : "☰"}
      </button>

      {/* Sidebar - Consistent with Dashboard */}
      <aside className={`sidebar ${isMenuOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-logo">Cofounder.</div>

        {/* Sidebar Mini Profile */}
        <div className="sidebar-user-preview" style={{ padding: "20px", borderBottom: "1px solid var(--border-glass)", marginBottom: "10px", textAlign: "center" }}>
          <img
            src={profile?.profilePicUrl || `https://ui-avatars.com/api/?name=${username}&background=6366f1&color=fff&bold=true&size=64`}
            alt="User"
            style={{ width: "64px", height: "64px", borderRadius: "50%", border: "2px solid var(--accent-color)", objectFit: "cover", marginBottom: "10px" }}
          />
          <div style={{ fontSize: "0.9rem", fontWeight: "700" }}>{profile?.fullName || username}</div>
        </div>

        <ul className="nav-menu">
          <li className="nav-item" onClick={() => { navigate("/welcome"); setIsMenuOpen(false); }}>
            <span>🏠</span> Dashboard
          </li>
          <li className="nav-item active" onClick={() => { navigate("/profile"); setIsMenuOpen(false); }}>
            <span>👤</span> My Profile
          </li>
          <li className="nav-item" onClick={() => { navigate("/find"); setIsMenuOpen(false); }}>
            <span>🔍</span> Find Partners
          </li>
          <li className="nav-item" onClick={() => { navigate("/messages"); setIsMenuOpen(false); }}>
            <span>💬</span> Messages
          </li>
          <li className="nav-item" onClick={() => { navigate("/inbox"); setIsMenuOpen(false); }}>
            <span>📥</span> Inbox
          </li>
          <li className="nav-item" onClick={() => { navigate("/help-center"); setIsMenuOpen(false); }}>
            <span>❓</span> Help Center
          </li>
        </ul>
        <div className="nav-item logout-item" onClick={async () => { await logout(); navigate("/login"); }}>
          <span>🚪</span> Logout
        </div>
      </aside>

      {/* Backdrop for mobile menu */}
      {isMenuOpen && <div className="sidebar-backdrop" onClick={() => setIsMenuOpen(false)}></div>}

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
                  src={profile.profilePicUrl || `https://ui-avatars.com/api/?name=${username}&background=6366f1&color=fff&bold=true&size=128`}
                  className="profile-avatar-img"
                  alt="Avatar"
                />
              </div>
              <h3>{profile.fullName || username}</h3>
              <p style={{ color: "var(--text-muted)", marginBottom: "15px" }}>{profile.role || "Founder"}</p>

              <div className={`status-badge ${profile.verified ? "verified" : "pending"}`}>
                {profile.verified ? "✅ Verified" : "⏳ Verification Pending"}
              </div>

              <div style={{ marginTop: "30px", width: "100%" }}>

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

                {/* Verification Document (Only for Co-Founders) */}
                {(profile.role?.toLowerCase() === "co-founder" || profile.role?.toLowerCase() === "cofounder") && (
                  <>
                    <h4 style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "15px", textAlign: "left" }}>
                      Verification Document
                    </h4>

                    {/* Certificate Preview/Status Area */}
                    {(profile.certificate || profile.certificateUrl) && (
                      <div style={{
                        marginBottom: "15px",
                        padding: "15px",
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid var(--border-glass)",
                        borderRadius: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                      }}>
                        <div style={{
                          width: "50px",
                          height: "50px",
                          background: "rgba(99, 102, 241, 0.1)",
                          borderRadius: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.5rem"
                        }}>
                          {profile.certificateUrl?.toLowerCase().endsWith('.pdf') || (profile.certificate instanceof File && profile.certificate.type === 'application/pdf') ? '📄' : '🖼️'}
                        </div>
                        <div style={{ textAlign: "left" }}>
                          <p style={{ fontSize: "0.85rem", fontWeight: "700", marginBottom: "2px" }}>
                            {profile.certificateUrl ? "Certificate Uploaded" : "New Document Ready"}
                          </p>
                          <a
                            href={profile.certificateUrl || "#"}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: "0.75rem", color: "var(--accent-color)", textDecoration: "none", fontWeight: "600" }}
                            onClick={(e) => !profile.certificateUrl && e.preventDefault()}
                          >
                            {profile.certificateUrl ? "View Document ↗" : "Preview Pending Save"}
                          </a>
                        </div>
                      </div>
                    )}

                    <label
                      className="file-upload-label"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        width: "100%",
                        padding: "14px",
                        background: "var(--primary-bg)",
                        border: "1px solid var(--border-glass)",
                        borderRadius: "14px",
                        cursor: "pointer",
                        transition: "all 0.3s",
                        fontSize: "0.9rem",
                        fontWeight: "600"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-color)"; e.currentTarget.style.background = "rgba(99, 102, 241, 0.05)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-glass)"; e.currentTarget.style.background = "var(--primary-bg)"; }}
                    >
                      <span>📤</span> {profile.certificateUrl ? "Replace Certificate" : "Upload Certificate"}
                      <input
                        type="file"
                        onChange={(e) => handleFileChange(e, "certificate")}
                        style={{ display: "none" }}
                        accept=".pdf,image/*"
                      />
                    </label>
                    <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "10px", fontStyle: "italic" }}>
                      Upload a PDF or Image of your professional certificate for verification.
                    </p>
                  </>
                )}

                {/* CV UPLOAD SECTION (Only for Co-Founders) */}
                {(profile.role?.toLowerCase() === "co-founder" || profile.role?.toLowerCase() === "cofounder") && (
                  <>
                    <h4 style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", margin: "25px 0 15px", textAlign: "left" }}>
                      CV / Resume (Optional)
                    </h4>

                    {profile.cvUrl && (
                      <div style={{
                        marginBottom: "15px",
                        padding: "12px",
                        background: "rgba(16, 185, 129, 0.05)",
                        border: "1px solid rgba(16, 185, 129, 0.2)",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px"
                      }}>
                        <span style={{ fontSize: "1.2rem" }}>📄</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: "0.75rem", fontWeight: "700", margin: 0, color: "white" }}>CV Uploaded</p>
                          <a href={profile.cvUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.7rem", color: "#10b981", textDecoration: "none", fontWeight: "600" }}>View CV ↗</a>
                        </div>
                      </div>
                    )}

                    <label
                      className="file-upload-label"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        width: "100%",
                        padding: "12px",
                        background: "var(--primary-bg)",
                        border: "1px solid var(--border-glass)",
                        borderRadius: "12px",
                        cursor: "pointer",
                        transition: "all 0.3s",
                        fontSize: "0.85rem",
                        fontWeight: "600"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-color)"; e.currentTarget.style.background = "rgba(99, 102, 241, 0.05)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-glass)"; e.currentTarget.style.background = "var(--primary-bg)"; }}
                    >
                      <span>📎</span> {profile.cvFile ? (profile.cvFile.name.length > 20 ? profile.cvFile.name.substring(0, 20) + "..." : profile.cvFile.name) : (profile.cvUrl ? "Replace CV" : "Upload CV")}
                      <input
                        type="file"
                        onChange={(e) => handleFileChange(e, "cvFile")}
                        style={{ display: "none" }}
                        accept=".pdf,.doc,.docx"
                      />
                    </label>
                  </>
                )}
              </div>
            </div>

            <div className="profile-card">
              <h4 style={{ marginBottom: "15px" }}>Security</h4>
              <div className="form-group">
                <label>Change Password</label>
                <input
                  type="password"
                  placeholder="Current Password"
                  style={{ marginBottom: "10px" }}
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                />
                <button className="action-btn" style={{ marginTop: "10px", width: "100%" }} onClick={handlePasswordUpdate}>Update Password</button>
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
                  <label>Full Name <span className="required-star">*</span></label>
                  <input
                    name="fullName"
                    placeholder="Enter full name"
                    value={profile.fullName}
                    onChange={handleChange}
                    className={errors.fullName ? "input-error" : ""}
                  />
                  {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <input value={profile.role} readOnly />
                </div>
                <div className="form-group">
                  <label>Location <span className="required-star">*</span></label>
                  <input
                    name="location"
                    placeholder="City, Country"
                    value={profile.location}
                    onChange={handleChange}
                    className={errors.location ? "input-error" : ""}
                  />
                  {errors.location && <span className="error-message">{errors.location}</span>}
                </div>
              </div>

              <h3>Professional Details</h3>
              <div className="form-grid">
                {(profile.role?.toLowerCase() === "co-founder" || profile.role?.toLowerCase() === "cofounder") ? (
                  <>
                    <div className="form-group full-width">
                      <label>Skills <span className="required-star">*</span></label>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "15px", marginTop: "10px" }}>
                        <input
                          placeholder="Add a skill (e.g. React, Python)"
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={addSkill}
                          className={errors.skills ? "input-error" : ""}
                          style={{
                            flex: 12, padding: "20px 25px", fontSize: "1.25rem",
                            background: "rgba(255, 255, 255, 0.05)", color: "white",
                            minHeight: "64px", border: "1px solid var(--border-glass)", width: "100%"
                          }}
                        />
                        <button onClick={addSkill} style={{
                          flex: 1, background: "var(--accent-color)", border: "none", color: "white", padding: "0 15px",
                          borderRadius: "12px", fontSize: "0.8rem", cursor: "pointer", fontWeight: "800", height: "64px"
                        }}>ADD</button>
                      </div>
                      {errors.skills && <span className="error-message" style={{ display: "block", marginBottom: "10px" }}>{errors.skills}</span>}
                      <div className="skills-verification-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "15px" }}>
                        {profile.skills.map((skill, index) => (
                          <div key={index} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-glass)", borderRadius: "16px", padding: "15px", display: "flex", flexDirection: "column", gap: "10px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontWeight: "700", color: "white" }}>{skill.name} {skill.verified ? "✅" : skill.status === 'pending' ? "⏳" : ""}</span>
                              <button onClick={() => removeSkill(index)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1.2rem" }}>×</button>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <label style={{ fontSize: "0.75rem", padding: "8px 12px", border: "1px dashed var(--accent-color)", borderRadius: "8px", cursor: "pointer", color: "var(--accent-color)", fontWeight: "600", flex: 1, textAlign: "center" }}>
                                {skill.certificateUrl ? "Update Proof" : skill.certificateFile ? "File Ready" : "📜 Upload Proof"}
                                <input type="file" style={{ display: "none" }} onChange={(e) => handleSkillFileChange(e, index)} accept=".pdf,image/*" />
                              </label>
                              {skill.certificateUrl && <a href={skill.certificateUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent-color)", textDecoration: "none", fontSize: "0.75rem" }}>View ↗</a>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Industry Domain <span className="required-star">*</span></label>
                      <input name="domain" placeholder="e.g. Fintech, Edtech" value={profile.domain} onChange={handleChange} className={errors.domain ? "input-error" : ""} />
                      {errors.domain && <span className="error-message">{errors.domain}</span>}
                    </div>
                    <div className="form-group">
                      <label>Experience (Years)</label>
                      <input name="experience" type="number" value={profile.experience} onChange={handleChange} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label>Company Name</label>
                      <input name="companyName" value={profile.companyName} onChange={handleChange} placeholder="startup name (if any)" />
                    </div>
                    <div className="form-group">
                      <label>Industry / Domain <span className="required-star">*</span></label>
                      <input name="domain" value={profile.domain} onChange={handleChange} placeholder="e.g. Fintech, Edtech" className={errors.domain ? "input-error" : ""} />
                      {errors.domain && <span className="error-message">{errors.domain}</span>}
                    </div>
                    <div className="form-group full-width">
                      <label>Startup Idea Description <span className="required-star">*</span></label>
                      <textarea name="startupIdea" value={profile.startupIdea} onChange={handleChange} placeholder="What vision are you building?" rows="4" className={errors.startupIdea ? "input-error" : ""} />
                    </div>
                    <div className="form-group">
                      <label>Stage of Startup</label>
                      <select name="startupStage" value={profile.startupStage} onChange={handleChange}>
                        <option value="">Select Stage...</option>
                        <option value="Idea">Idea Phase</option>
                        <option value="MVP">MVP Ready</option>
                        <option value="Revenue">Early Revenue</option>
                        <option value="Scaling">Scaling</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Type of Co-founder Looking For</label>
                      <select name="lookingFor" value={profile.lookingFor} onChange={handleChange}>
                        <option value="">Select Type...</option>
                        <option value="Technical">Technical</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Finance">Finance</option>
                        <option value="Operations">Operations</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    {profile.lookingFor === 'Other' && (
                      <div className="form-group">
                        <label>Specify Role</label>
                        <input name="otherLookingFor" value={profile.otherLookingFor} onChange={handleChange} placeholder="e.g. Legal Advisor" />
                      </div>
                    )}
                    <div className="form-group">
                      <label>Skills Required (from Co-founder)</label>
                      <input name="requiredSkills" value={profile.requiredSkills} onChange={handleChange} placeholder="e.g. React, UX, Sales" />
                    </div>
                    <div className="form-group">
                      <label>Pitch Video</label>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <label style={{ flex: 1, padding: "12px", border: "1px dashed var(--border-glass)", borderRadius: "12px", textAlign: "center", cursor: "pointer", fontSize: "0.85rem" }}>
                          {profile.pitchVideoFile ? "Video Ready ✅" : "Upload Pitch Video"}
                          <input type="file" accept="video/*" style={{ display: "none" }} onChange={handleVideoChange} />
                        </label>
                        {profile.pitchVideoUrl && (
                          <a href={profile.pitchVideoUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent-color)", fontSize: "0.8rem", fontWeight: "700" }}>WATCH</a>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label>{profile.role === 'Founder' ? 'Startup Availability' : 'Availability'} <span className="required-star">*</span></label>
                  <select name="availability" value={profile.availability} onChange={handleChange} className={errors.availability ? "input-error" : ""}>
                    <option value="">Select...</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Weekends">Weekends</option>
                  </select>
                  {errors.availability && <span className="error-message">{errors.availability}</span>}
                </div>
              </div>

              {/* CV SECTIONS (Only for Co-Founders) */}
              {(profile.role?.toLowerCase() === "co-founder" || profile.role?.toLowerCase() === "cofounder") && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h3 style={{ margin: 0 }}>Education</h3>
                  </div>
                  <div className="cv-item-card" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-glass)", borderRadius: "16px", padding: "20px", marginBottom: "15px" }}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Degree/Certification <span className="required-star">*</span></label>
                        <input
                          value={profile.education?.degree || ""}
                          onChange={(e) => handleEducationUpdate("degree", e.target.value)}
                          placeholder="e.g. B.Tech Computer Science"
                          className={errors.educationDegree ? "input-error" : ""}
                        />
                        {errors.educationDegree && <span className="error-message">{errors.educationDegree}</span>}
                      </div>
                      <div className="form-group">
                        <label>Institution <span className="required-star">*</span></label>
                        <input
                          value={profile.education?.institution || ""}
                          onChange={(e) => handleEducationUpdate("institution", e.target.value)}
                          placeholder="e.g. Stanford University"
                          className={errors.educationInstitution ? "input-error" : ""}
                        />
                        {errors.educationInstitution && <span className="error-message">{errors.educationInstitution}</span>}
                      </div>
                      <div className="form-group">
                        <label>Year</label>
                        <input value={profile.education?.year || ""} onChange={(e) => handleEducationUpdate("year", e.target.value)} placeholder="e.g. 2018 - 2022" />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", marginTop: "40px" }}>
                    <h3 style={{ margin: 0 }}>Work Experience</h3>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600" }}>
                      <input
                        type="checkbox"
                        checked={profile.isFresher}
                        onChange={(e) => setProfile(prev => ({ ...prev, isFresher: e.target.checked }))}
                        style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--accent-color)" }}
                      />
                      I AM A FRESHER
                    </label>
                  </div>
                  {!profile.isFresher ? (
                    <div className="cv-item-card" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-glass)", borderRadius: "16px", padding: "20px", marginBottom: "15px" }}>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Company/Project</label>
                          <input value={profile.workExperience?.company || ""} onChange={(e) => handleExperienceUpdate("company", e.target.value)} placeholder="Name of organization" />
                        </div>
                        <div className="form-group">
                          <label>Role</label>
                          <input value={profile.workExperience?.role || ""} onChange={(e) => handleExperienceUpdate("role", e.target.value)} placeholder="e.g. Lead Developer" />
                        </div>
                        <div className="form-group">
                          <label>Duration</label>
                          <input value={profile.workExperience?.duration || ""} onChange={(e) => handleExperienceUpdate("duration", e.target.value)} placeholder="e.g. Jan 2020 - Present" />
                        </div>
                        <div className="form-group full-width">
                          <label>Key Responsibilities</label>
                          <textarea value={profile.workExperience?.description || ""} onChange={(e) => handleExperienceUpdate("description", e.target.value)} placeholder="Describe your impact..." rows="2" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="cv-item-card" style={{ background: "rgba(16, 185, 129, 0.05)", border: "1px dashed rgba(16, 185, 129, 0.3)", borderRadius: "16px", padding: "30px", marginBottom: "15px", textAlign: "center" }}>
                      <p style={{ color: "var(--success)", fontSize: "0.9rem", fontWeight: "700", margin: 0 }}>✨ Fresher: Looking for first opportunity!</p>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", marginTop: "40px" }}>
                    <h3 style={{ margin: 0 }}>Portfolio / Projects</h3>
                  </div>
                  <div className="cv-item-card" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-glass)", borderRadius: "16px", padding: "20px", marginBottom: "15px" }}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Project Title</label>
                        <input value={profile.projects?.title || ""} onChange={(e) => handleProjectUpdate("title", e.target.value)} placeholder="e.g. E-commerce Platform" />
                      </div>
                      <div className="form-group">
                        <label>Live Link</label>
                        <input value={profile.projects?.link || ""} onChange={(e) => handleProjectUpdate("link", e.target.value)} placeholder="github.com/... or app.link" />
                      </div>
                      <div className="form-group full-width">
                        <label>Description</label>
                        <textarea value={profile.projects?.description || ""} onChange={(e) => handleProjectUpdate("description", e.target.value)} placeholder="What did you build?" rows="2" />
                      </div>
                    </div>
                  </div>
                </>
              )}

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
