import { auth, db, storage } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { ref as dbRef, set, get, child, update } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

// SIGNUP
export const signup = async (username, email, password, role) => {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Auth signup response:", res);
    const uid = res.user && res.user.uid;

    // Send email verification
    await sendEmailVerification(res.user);
    console.log("Verification email sent");

    // save user data in Realtime Database
    try {
      await set(dbRef(db, "users/" + uid), {
        username,
        email,
        role,
        verified: false,
        certificateApproved: false,
        skills: "",
        domain: "",
        experience: "",
        availability: ""
      });
      console.log("Realtime DB: created user for UID", uid);
    } catch (dbErr) {
      console.error("Realtime DB set error:", dbErr.message || dbErr);
      return { success: false, msg: "Database Error: " + (dbErr.message || "Could not save user data.") };
    }

    return {
      success: true,
      uid,
      msg: "Email sent, please verify"
    };
  } catch (error) {
    console.error("Signup error:", error.message || error);
    if (error.code === "auth/email-already-in-use") {
      return { success: false, msg: "This email is already in use. Please try logging in or use another email." };
    }
    return { success: false, msg: error.message || String(error) };
  }
};

// UPDATE VERIFICATION STATUS
export const updateVerificationStatus = async (uid) => {
  try {
    const userRef = dbRef(db, "users/" + uid);
    await update(userRef, { verified: true });
    return { success: true, msg: "Verification success" };
  } catch (error) {
    console.error("updateVerificationStatus error:", error.message);
    return { success: false, msg: error.message };
  }
};

// LOGIN
export const login = async (email, password) => {
  console.log("Attempting login for:", email);
  try {
    const res = await signInWithEmailAndPassword(auth, email, password);
    const user = res.user;
    console.log("Auth login successful for UID:", user.uid);

    // Force a reload to check for the latest verification status
    await user.reload();
    console.log("Email verified status after reload:", user.emailVerified);

    // Skip verification check for Admin
    if (!user.emailVerified && email !== "appadmin@gmail.com") {
      console.warn("User email still not verified according to Firebase Auth");
      return { success: false, msg: "Please verify your email before logging in. Check your inbox for the verification link." };
    }

    const uid = user.uid;
    let username = "";

    try {
      const snapshot = await get(child(dbRef(db), `users/${uid}`));
      if (snapshot.exists()) {
        const userData = snapshot.val();
        username = userData.username;
        console.log("Realtime DB user found, username:", username);

        // Ensure database 'verified' status is also synced
        if (!userData.verified) {
          await update(dbRef(db, "users/" + uid), { verified: true });
          console.log("Updated database 'verified' status to true during login");
        }
      } else {
        console.warn("No DB entry for UID:", uid);
      }
    } catch (dbErr) {
      console.error("Realtime DB fetch error:", dbErr.message);
      username = email.split('@')[0];
    }

    return { success: true, user: user, username };
  } catch (error) {
    console.error("Login catch error:", error.code, error.message);
    if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-email") {
      return { success: false, msg: "Invalid email or password." };
    }
    return { success: false, msg: error.message };
  }
};

// RESEND VERIFICATION
export const resendVerification = async () => {
  try {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      return { success: true, msg: "Verification email resent! Please check your inbox." };
    }
    return { success: false, msg: "No active session found. Please try logging in again to resend the link." };
  } catch (error) {
    return { success: false, msg: error.message };
  }
};

// SAVE PROFILE
export const saveProfileAPI = async (username, profileData) => {
  try {
    let certificateUrl = "";
    if (profileData.certificate) {
      const sRef = storageRef(storage, `certificates/${username}`);
      const res = await uploadBytes(sRef, profileData.certificate);
      certificateUrl = await getDownloadURL(res.ref);
    }

    const snapshot = await get(child(dbRef(db), "users"));
    let userUid = "";
    if (snapshot.exists()) {
      const users = snapshot.val();
      for (let uid in users) {
        if (users[uid].username === username) {
          userUid = uid;
          break;
        }
      }
    }

    if (userUid) {
      const userRef = dbRef(db, "users/" + userUid);
      await update(userRef, { ...profileData, certificateUrl });
      return { success: true, msg: "Profile saved" };
    }
    return { success: false, msg: "User not found" };
  } catch (err) {
    return { success: false, msg: err.message };
  }
};

// GET SINGLE PROFILE
export const getProfileAPI = async (username) => {
  try {
    const snapshot = await get(child(dbRef(db), "users"));
    if (snapshot.exists()) {
      const users = snapshot.val();
      for (let uid in users) {
        if (users[uid].username === username) {
          return { success: true, data: users[uid] };
        }
      }
    }
    return { success: false, msg: "User not found" };
  } catch (err) {
    return { success: false, msg: err.message };
  }
};

// GET USERS
export const getUsers = async () => {
  try {
    const snapshot = await get(child(dbRef(db), "users"));
    if (snapshot.exists()) {
      return Object.values(snapshot.val());
    }
    return [];
  } catch (err) {
    console.error("getUsers error:", err);
    return [];
  }
};

// APPROVE CERTIFICATE
export const approveUserAPI = async (username) => {
  try {
    const snapshot = await get(child(dbRef(db), "users"));
    let userUid = "";
    if (snapshot.exists()) {
      const users = snapshot.val();
      for (let uid in users) {
        if (users[uid].username === username) {
          userUid = uid;
          break;
        }
      }
    }

    if (userUid) {
      const userRef = dbRef(db, "users/" + userUid);
      await update(userRef, { certificateApproved: true });
      return { success: true, msg: "Certificate approved" };
    }
    return { success: false, msg: "User not found" };
  } catch (error) {
    return { success: false, msg: error.message };
  }
};

// OTP verification placeholder (dummy)
export const verifyOTP = async (username, otp) => {
  return { success: true, msg: "OTP verified (dummy)" };
};
