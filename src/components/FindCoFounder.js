import React, { useState, useEffect } from "react";
import { getUsers } from "../utils/api";
import { useNavigate } from "react-router-dom";

function FindCoFounder() {
  const navigate = useNavigate();
  const username = localStorage.getItem("loggedInUser");

  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ skill: "", domain: "", exp: "", avail: "" });
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const data = await getUsers();
      setUsers(data);
    };
    fetchUsers();
  }, []);

  const handleSearch = () => {
    const currentUser = users.find(u => u.username === username);
    if (!currentUser?.certificateApproved) { alert("Certificate not approved"); return; }

    const matches = users.filter(u => {
      if (u.username === username) return false;
      if (!u.verified || !u.certificateApproved) return false;
      let score = 0;
      if (filters.skill && u.skills.toLowerCase().includes(filters.skill.toLowerCase())) score += 40;
      if (filters.domain && u.domain.toLowerCase().includes(filters.domain.toLowerCase())) score += 30;
      if (filters.exp && u.experience === filters.exp) score += 20;
      if (filters.avail && u.availability === filters.avail) score += 10;
      return score > 0;
    });
    setResults(matches);
  };

  return (
    <div className="container">
      <div className="left">
        <h2>Find Suitable Co-Founders</h2>
      </div>
      <div className="right">
        <h2>Search</h2>
        <input placeholder="Skill" value={filters.skill} onChange={e => setFilters({ ...filters, skill: e.target.value })} />
        <input placeholder="Domain" value={filters.domain} onChange={e => setFilters({ ...filters, domain: e.target.value })} />
        <select value={filters.exp} onChange={e => setFilters({ ...filters, exp: e.target.value })}>
          <option value="">Experience Level</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Expert">Expert</option>
        </select>
        <select value={filters.avail} onChange={e => setFilters({ ...filters, avail: e.target.value })}>
          <option value="">Availability</option>
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
        </select>
        <button onClick={handleSearch}>Search</button>

        <div id="results" style={{ marginTop: "10px" }}>
          {results.length ? results.map((r, idx) => (
            <p key={idx}>{r.username} - {r.skills} - {r.domain}</p>
          )) : "No matches found"}
        </div>

        <button className="secondary-btn" onClick={() => navigate("/welcome")}>Back</button>
      </div>
    </div>
  );
}

export default FindCoFounder;
