import React, { useState } from "react";
import { verifyOTP } from "../utils/api";

export default function OTP() {
  const [otp, setOtp] = useState("");

  const handleVerify = async () => {
    const username = localStorage.getItem("signupUser");
    const res = await verifyOTP(username, otp);
    if (res.success) {
      alert(res.msg);
      window.location.href = "/login";
    } else {
      alert(res.msg);
    }
  };

  return (
    <div className="container">
      <div className="right">
        <h2>Verify OTP</h2>
        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP"
        />
        <button onClick={handleVerify}>Verify</button>
      </div>
    </div>
  );
}
