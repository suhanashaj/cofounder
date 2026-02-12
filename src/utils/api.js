import { auth, db, storage } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, getDocs, collection, updateDoc, query, where, addDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// SIGNUP
export const signup = async (username, email, password) => {
  try {
    const trimmedEmail = email.trim();
    const res = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
    console.log("Auth signup response:", res);
    const uid = res.user && res.user.uid;

    // save user data in Firestore (catch Firestore-specific errors separately)
    try {
      console.log("Firestore: Attempting to create user document for UID", uid);
      await setDoc(doc(db, "users", uid), {
        username,
        email: trimmedEmail,
        verified: true,
        certificateApproved: false,
        role: "user",
        skills: "",
        domain: "",
        experience: "",
        availability: ""
      });
      console.log("Firestore: Successfully created user document for UID", uid);
    } catch (fsErr) {
      console.error("Firestore setDoc error:", fsErr);
      return { success: false, msg: "Auth OK but DB failed: " + (fsErr.message || String(fsErr)) };
    }

    return { success: true, uid };
  } catch (error) {
    console.error("Signup error:", error.message || error);
    return { success: false, msg: error.message || String(error) };
  }
};

// LOGIN
export const login = async (email, password) => {
  try {
    console.log("Auth: Attempting login for", email);
    const trimmedEmail = email.trim();
    const res = await signInWithEmailAndPassword(auth, trimmedEmail, password);
    const uid = res.user.uid;
    console.log("Auth: Login successful, UID:", uid);

    // Get username and role from Firestore by UID directly (avoids collection query permission issues)
    let username = email;
    let role = "user";
    try {
      console.log("Firestore: Fetching profile for UID:", uid);
      const userDocRef = doc(db, "users", uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        username = userData.username || email;
        role = userData.role || "user";
        console.log("Firestore: Profile found, username:", username, "role:", role);
      } else {
        console.warn("Firestore: No user document found for UID:", uid);
      }
    } catch (fsErr) {
      console.error("Firestore: Error fetching user doc:", fsErr);
    }

    return { success: true, user: res.user, username, role };
  } catch (error) {
    console.error("Login overall error:", error.code, error.message);
    return { success: false, msg: error.message, code: error.code };
  }
};

// LOGOUT
export const logout = async () => {
  try {
    await auth.signOut();
    localStorage.clear();
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, msg: error.message };
  }
};

// RESEND VERIFICATION
export const resendVerification = async () => {
  try {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      return { success: true, msg: "Verification email sent!" };
    }
    return { success: false, msg: "No user logged in" };
  } catch (error) {
    return { success: false, msg: error.message };
  }
};

// GET PROFILE
export const getProfileAPI = async (username) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return { success: true, data: querySnapshot.docs[0].data() };
    }
    return { success: false, msg: "Profile not found" };
  } catch (error) {
    return { success: false, msg: error.message };
  }
};

// SAVE PROFILE
export const saveProfileAPI = async (username, profileData) => {
  try {
    let certificateUrl = profileData.certificateUrl || "";
    if (profileData.certificate && typeof profileData.certificate !== "string") {
      const storageRef = ref(storage, `certificates/${username}_${Date.now()}`);
      const res = await uploadBytes(storageRef, profileData.certificate);
      certificateUrl = await getDownloadURL(res.ref);
    }

    let profilePicUrl = profileData.profilePicUrl || "";
    if (profileData.profilePic && typeof profileData.profilePic !== "string") {
      const storageRef = ref(storage, `profiles/${username}_${Date.now()}`);
      const res = await uploadBytes(storageRef, profileData.profilePic);
      profilePicUrl = await getDownloadURL(res.ref);
    }

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userRef = doc(db, "users", querySnapshot.docs[0].id);
      // Remove file objects before saving to Firestore
      const { certificate, profilePic, ...dataToSave } = profileData;
      await updateDoc(userRef, {
        ...dataToSave,
        certificateUrl,
        profilePicUrl
      });
      return { success: true, msg: "Profile saved" };
    }
    return { success: false, msg: "User not found" };
  } catch (err) {
    console.error("Save profile error:", err);
    return { success: false, msg: err.message };
  }
};

// GET USERS
export const getUsers = async () => {
  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    let users = [];
    snapshot.forEach(docSnap => users.push(docSnap.data()));
    return users;
  } catch (error) {
    console.error("Get users error:", error);
    return [];
  }
};

// SEND CONNECTION REQUEST
export const sendConnectionRequest = async (from, to) => {
  try {
    const connectionsRef = collection(db, "connections");

    // Check if request already exists
    const q = query(connectionsRef,
      where("from", "==", from),
      where("to", "==", to)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { success: false, msg: "Request already sent" };
    }

    await addDoc(connectionsRef, {
      from,
      to,
      status: "pending",
      timestamp: serverTimestamp()
    });
    return { success: true, msg: "Connection request sent!" };
  } catch (error) {
    return { success: false, msg: error.message };
  }
};

// GET CONNECTION REQUESTS
export const getConnectionRequests = async (username) => {
  try {
    const connectionsRef = collection(db, "connections");

    // Firestore doesn't support logical OR directly in where clauses easily without 'or' query type (Firebase v10.4+)
    // For simplicity and compatibility, we can run two queries and merge or use the 'or' composite filter

    const q1 = query(connectionsRef, where("from", "==", username));
    const q2 = query(connectionsRef, where("to", "==", username));

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    let connections = [];
    snap1.forEach(doc => connections.push({ id: doc.id, ...doc.data() }));
    snap2.forEach(doc => connections.push({ id: doc.id, ...doc.data() }));

    return connections;
  } catch (error) {
    console.error("Get connections error:", error);
    return [];
  }
};

// GET ALL CONNECTIONS (for Admin)
export const getAllConnections = async () => {
  try {
    const connectionsRef = collection(db, "connections");
    const snapshot = await getDocs(connectionsRef);
    let connections = [];
    snapshot.forEach(docSnap => connections.push({ id: docSnap.id, ...docSnap.data() }));
    return connections;
  } catch (error) {
    console.error("Get all connections error:", error);
    return [];
  }
};

// UPDATE CONNECTION STATUS
export const updateConnectionStatus = async (id, status) => {
  try {
    const connRef = doc(db, "connections", id);
    await updateDoc(connRef, { status });
    return { success: true, msg: `Request ${status}` };
  } catch (error) {
    return { success: false, msg: error.message };
  }
};

// APPROVE CERTIFICATE
export const approveUserAPI = async (username) => {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("username", "==", username));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const userRef = doc(db, "users", snapshot.docs[0].id);
    await updateDoc(userRef, { certificateApproved: true });
    return { success: true, msg: "Certificate approved" };
  }
  return { success: false, msg: "User not found" };
};

// OTP verification placeholder (dummy)
export const verifyOTP = async (username, otp) => {
  // For now, just return success
  return { success: true, msg: "OTP verified (dummy)" };
};
