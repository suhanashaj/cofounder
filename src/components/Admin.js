import React, { useEffect, useState } from "react";
import { getUsers, approveUserAPI } from "../utils/api";
import { useNavigate } from "react-router-dom";

function Admin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);

  const loadUsers = async () => {
    const data = await getUsers();
    setUsers(data);
  };

  const approveUser = async (username) => {
    const data = await approveUserAPI(username);
    alert(data.msg);
    loadUsers();
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="container">
      <div className="left">
        <h2>Admin Panel</h2>
      </div>
      <div className="right">
        <h2>All Users</h2>
        <div id="userList">
          {users.map((u, idx) => (
            <div key={idx} style={{ border: "1px solid #ccc", margin: "5px", padding: "5px" }}>
              <p>Username: {u.username}</p>
              <p>Email: {u.email}</p>
              <p>Skills: {u.skills}</p>
              <p>Certificate: {u.certificate ? "Uploaded" : "No"}</p>
              <p>Status: {u.certificateApproved ? "Approved" : "Pending"}</p>
              <button onClick={() => approveUser(u.username)}>Approve Certificate</button>
            </div>
          ))}
        </div>
        <button className="secondary-btn" onClick={() => { localStorage.removeItem("loggedInUser"); navigate("/login"); }}>Logout</button>
      </div>
    </div>
  );
}

export default Admin;
