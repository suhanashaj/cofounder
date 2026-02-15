import { auth, db, storage, rtdb } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential, updatePassword, setPersistence, browserSessionPersistence } from "firebase/auth";
import { doc, setDoc, getDocs, collection, updateDoc, query, where, addDoc, serverTimestamp, getDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ref as rtdbRef, get, child } from "firebase/database";

// HELPER: Wait for Auth to likely be ready
const ensureAuthReady = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

// SIGNUP
export const signup = async (username, email, password, role = "user") => {
  try {
    const trimmedEmail = email.trim();

    // Set persistence to SESSION
    await setPersistence(auth, browserSessionPersistence);

    const res = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
    console.log("Auth signup response:", res);
    const uid = res.user && res.user.uid;

    // Send Verification Email
    try {
      await sendEmailVerification(res.user);
      console.log("Verification email sent.");
    } catch (emailErr) {
      console.error("Error sending verification email:", emailErr);
      // Continue flow, but log error
    }

    // save user data in Firestore (catch Firestore-specific errors separately)
    try {
      console.log("Firestore: Attempting to create user document for UID", uid);
      await setDoc(doc(db, "users", uid), {
        username,
        email: trimmedEmail,
        verified: false, // Explicitly false until verified
        certificateApproved: false,
        role: role,
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

    // Set persistence to SESSION (clears on tab close)
    await setPersistence(auth, browserSessionPersistence);

    const res = await signInWithEmailAndPassword(auth, trimmedEmail, password);

    // Wait for auth state to settle (though signIn usually sets it immediately, good practice)
    await ensureAuthReady();

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
    sessionStorage.clear(); // Clear session storage
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, msg: error.message };
  }
};

// RESEND VERIFICATION
export const resendVerification = async () => {
  try {
    await ensureAuthReady();
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      return { success: true, msg: "Verification email sent!" };
    }
    return { success: false, msg: "No user logged in" };
  } catch (error) {
    return { success: false, msg: error.message };
  }
};

// GET PROFILE (Public/Other Users)
export const getProfileAPI = async (username) => {
  try {
    const user = await ensureAuthReady();
    if (!user) return { success: false, msg: "User not authenticated" };

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

// GET CURRENT USER PROFILE (Private/Self)
export const getCurrentUserProfile = async () => {
  try {
    const user = await ensureAuthReady();
    if (!user) return { success: false, msg: "No user logged in" };

    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      return { success: true, data: userSnap.data() };
    } else {
      return { success: false, msg: "Profile document does not exist" };
    }
  } catch (error) {
    console.error("Error getting current profile:", error);
    return { success: false, msg: error.message };
  }
};

// SAVE PROFILE
export const saveProfileAPI = async (username, profileData) => {
  try {
    const user = await ensureAuthReady();
    if (!user) return { success: false, msg: "You must be logged in to save." };

    const uid = user.uid;

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

    // Direct reference using authenticated UID - Safe & Secure
    const userRef = doc(db, "users", uid);

    // Remove file objects before saving to Firestore
    const { certificate, profilePic, ...dataToSave } = profileData;

    // Use setDoc with merge: true to ensure it works even if doc is missing/partial
    await setDoc(userRef, {
      ...dataToSave,
      certificateUrl,
      profilePicUrl,
      username: username // Ensure username is kept/updated
    }, { merge: true });

    return { success: true, msg: "Profile saved" };

  } catch (err) {
    console.error("Save profile error:", err);
    return { success: false, msg: err.message };
  }
};

// GET USERS
export const getUsers = async () => {
  try {
    const user = await ensureAuthReady();
    if (!user) return [];

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
    const user = await ensureAuthReady();
    if (!user) return { success: false, msg: "User not authenticated" };

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
    const user = await ensureAuthReady();
    if (!user) return [];

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
    const user = await ensureAuthReady();
    if (!user) return [];

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

// GET CONNECTION COUNT FOR USER
export const getConnectionCount = async (username) => {
  try {
    const user = await ensureAuthReady();
    if (!user) return 0;

    const connectionsRef = collection(db, "connections");
    // Count where user is 'from' OR 'to' AND status is 'accepted'
    // Firestory OR queries are limited, using double query approach

    const q1 = query(
      connectionsRef,
      where("from", "==", username),
      where("status", "==", "accepted")
    );

    const q2 = query(
      connectionsRef,
      where("to", "==", username),
      where("status", "==", "accepted")
    );

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    return snap1.size + snap2.size;

  } catch (error) {
    console.error("Get connection count error:", error);
    return 0;
  }
};

// UPDATE CONNECTION STATUS
export const updateConnectionStatus = async (id, status) => {
  try {
    await ensureAuthReady();
    const connRef = doc(db, "connections", id);
    await updateDoc(connRef, { status });
    return { success: true, msg: `Request ${status}` };
  } catch (error) {
    return { success: false, msg: error.message };
  }
};

// APPROVE USER (Certificate or Profile)
export const approveUserAPI = async (username, type = 'certificate') => {
  await ensureAuthReady();
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("username", "==", username));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const userRef = doc(db, "users", snapshot.docs[0].id);
    const updateData = type === 'profile'
      ? { profileApproved: true, profileRejected: false }
      : { certificateApproved: true, certificateRejected: false };

    await updateDoc(userRef, updateData);

    // Optional: Send success message
    try {
      const messagesRef = collection(db, "messages");
      await addDoc(messagesRef, {
        from: "Admin",
        to: username,
        text: `Congratulations! Your ${type} has been approved.`,
        read: false,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error("Auto-message error:", e);
    }

    return { success: true, msg: `${type === 'profile' ? 'Profile' : 'Certificate'} approved` };
  }
  return { success: false, msg: "User not found" };
};

// REJECT USER (Certificate or Profile)
export const rejectUserAPI = async (username, type = 'certificate', reason = "") => {
  await ensureAuthReady();
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("username", "==", username));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const userRef = doc(db, "users", snapshot.docs[0].id);
    const updateData = type === 'profile'
      ? { profileApproved: false, profileRejected: true }
      : { certificateApproved: false, certificateRejected: true };

    await updateDoc(userRef, updateData);

    // Send Rejection Message
    if (reason) {
      try {
        const messagesRef = collection(db, "messages");
        await addDoc(messagesRef, {
          from: "Admin",
          to: username,
          text: `Your ${type} verification was rejected. Reason: ${reason}`,
          read: false,
          timestamp: serverTimestamp()
        });
      } catch (e) {
        console.error("Auto-message error:", e);
      }
    }

    return { success: true, msg: `${type === 'profile' ? 'Profile' : 'Certificate'} rejected` };
  }
  return { success: false, msg: "User not found" };
};

// OTP verification placeholder (dummy)
export const verifyOTP = async (username, otp) => {
  // For now, just return success
  return { success: true, msg: "OTP verified (dummy)" };
};

// SYNC EMAIL VERIFICATION
export const syncEmailVerification = async () => {
  try {
    const user = await ensureAuthReady();
    if (!user) return { success: false, msg: "No user logged in" };

    await user.reload(); // Force refresh to get latest status
    if (user.emailVerified) {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { verified: true });
      return { success: true, verified: true };
    }
    return { success: true, verified: false };
  } catch (error) {
    console.error("Sync verification error:", error);
    return { success: false, msg: error.message };
  }
};

// SEND MESSAGE
export const sendMessage = async (from, to, text) => {
  try {
    const user = await ensureAuthReady();
    if (!user) return { success: false, msg: "User not authenticated" };

    const messagesRef = collection(db, "messages");
    await addDoc(messagesRef, {
      from,
      to,
      text,
      read: false,
      timestamp: serverTimestamp()
    });
    return { success: true, msg: "Message sent" };
  } catch (error) {
    return { success: false, msg: error.message };
  }
};

// GET MESSAGES
export const getMessages = async (user1, user2) => {
  try {
    const user = await ensureAuthReady();
    if (!user) return [];

    const messagesRef = collection(db, "messages");

    // Query messages: user1 -> user2
    const q1 = query(
      messagesRef,
      where("from", "==", user1),
      where("to", "==", user2)
    );

    // Query messages: user2 -> user1
    const q2 = query(
      messagesRef,
      where("from", "==", user2),
      where("to", "==", user1)
    );

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    let messages = [];
    snap1.forEach(doc => messages.push({ id: doc.id, ...doc.data() }));
    snap2.forEach(doc => messages.push({ id: doc.id, ...doc.data() }));

    // Sort by timestamp
    messages.sort((a, b) => {
      const t1 = a.timestamp ? a.timestamp.seconds : 0;
      const t2 = b.timestamp ? b.timestamp.seconds : 0;
      return t1 - t2;
    });

    return messages;
  } catch (error) {
    console.error("Get messages error:", error);
    return [];
  }
};

// GET UNREAD MESSAGES COUNT
export const getUnreadCounts = async (username) => {
  try {
    const user = await ensureAuthReady();
    if (!user) return {};

    const messagesRef = collection(db, "messages");
    // Get all unread messages sent TO the current user
    const q = query(
      messagesRef,
      where("to", "==", username),
      where("read", "==", false)
    );

    const snapshot = await getDocs(q);
    const counts = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      const sender = data.from;
      counts[sender] = (counts[sender] || 0) + 1;
    });

    return counts;
  } catch (error) {
    console.error("Get unread counts error:", error);
    return {};
  }
};

// MARK MESSAGES AS READ
export const markMessagesAsRead = async (recipient, sender) => {
  try {
    await ensureAuthReady();
    const messagesRef = collection(db, "messages");

    // Find unread messages from 'sender' to 'recipient'
    const q = query(
      messagesRef,
      where("to", "==", recipient),
      where("from", "==", sender),
      where("read", "==", false)
    );

    const snapshot = await getDocs(q);

    // Update each document
    const updatePromises = snapshot.docs.map(docSnap =>
      updateDoc(doc(db, "messages", docSnap.id), { read: true })
    );

    await Promise.all(updatePromises);
    return { success: true };
  } catch (error) {
    console.error("Mark read error:", error);
    return { success: false, msg: error.message };
  }
};

// CHANGE PASSWORD
export const changePasswordAPI = async (currentPassword, newPassword) => {
  try {
    const user = await ensureAuthReady();
    if (!user) return { success: false, msg: "No user logged in" };

    const credential = EmailAuthProvider.credential(user.email, currentPassword);

    // Re-authenticate user
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, newPassword);

    return { success: true, msg: "Password updated successfully!" };
  } catch (error) {
    console.error("Change password error:", error);
    return { success: false, msg: error.message };
  }
};

// MIGRATE RTDB TO FIRESTORE

// MIGRATE RTDB TO FIRESTORE
export const migrateRTDBtoFirestore = async () => {
  // ... (existing implementation)
  try {
    await ensureAuthReady();
    const dbRef = rtdbRef(rtdb);
    const snapshot = await get(child(dbRef, "/"));

    if (snapshot.exists()) {
      const data = snapshot.val();
      let count = 0;

      // Iterate through root keys (likely collections: users, messages, etc.)
      for (const [collectionName, collectionData] of Object.entries(data)) {
        if (typeof collectionData === 'object' && collectionData !== null) {

          // Iterate through items in the collection
          for (const [docId, docData] of Object.entries(collectionData)) {
            // Use existing ID or auto-generated if it's an array-like object
            const docRef = doc(db, collectionName, docId);
            await setDoc(docRef, docData, { merge: true });
            count++;
          }
        }
      }
      return { success: true, msg: `Successfully migrated ${count} documents from RTDB to Firestore.` };
    } else {
      return { success: false, msg: "No data available in Realtime Database." };
    }
  } catch (error) {
    console.error("Migration error:", error);
    return { success: false, msg: error.message };
  }
};

// REMOVE DUPLICATES (Cleanup)

export const removeDuplicatesAPI = async () => {
  try {
    await ensureAuthReady();
    let deletedCount = 0;


    // 1. CLEANUP USERS (By Email)
    const usersRef = collection(db, "users");
    const usersSnap = await getDocs(usersRef);
    const usersByEmail = {};
    const usersByUsername = {};

    usersSnap.forEach(docSnap => {
      const data = docSnap.data();
      const id = docSnap.id;

      // Check Email Duplicates
      if (data.email) {
        const email = data.email.toLowerCase().trim();
        if (!usersByEmail[email]) usersByEmail[email] = [];
        usersByEmail[email].push({ id, ...data });
      }

      // Check Username Duplicates
      if (data.username) {
        const username = data.username.toLowerCase().trim();
        if (!usersByUsername[username]) usersByUsername[username] = [];
        usersByUsername[username].push({ id, ...data });
      }
    });

    // Delete duplicate emails (keep the one with the most fields or first one)
    for (const [email, userDocs] of Object.entries(usersByEmail)) {
      if (userDocs.length > 1) {
        // Sort by number of keys (assume more data = better) descending
        userDocs.sort((a, b) => Object.keys(b).length - Object.keys(a).length);

        // Keep the first (index 0), delete the rest
        for (let i = 1; i < userDocs.length; i++) {
          console.log(`Deleting duplicate user by email ${email}: ${userDocs[i].id}`);
          await deleteDoc(doc(db, "users", userDocs[i].id));
          deletedCount++;
        }
      }
    }
    // Note: Username check might overlap with email check, but good to be safe.
    // We re-fetch or just accept that some might be gone. 
    // For simplicity in this script, we'll focus on Email as the unique identifier for Auth.


    // 2. CLEANUP CONNECTIONS (Duplicate From-To)
    const connRef = collection(db, "connections");
    const connSnap = await getDocs(connRef);
    const connMap = {};

    connSnap.forEach(docSnap => {
      const data = docSnap.data();
      const key = `${data.from}_${data.to}`;
      if (!connMap[key]) connMap[key] = [];
      connMap[key].push({ id: docSnap.id, ...data });
    });

    for (const [key, convDocs] of Object.entries(connMap)) {
      if (convDocs.length > 1) {
        // Keep the one with 'accepted' status if exists, else first
        // Sort: Accepted first
        convDocs.sort((a, b) => (a.status === 'accepted' ? -1 : 1));

        for (let i = 1; i < convDocs.length; i++) {
          console.log(`Deleting duplicate connection ${key}: ${convDocs[i].id}`);
          await deleteDoc(doc(db, "connections", convDocs[i].id));
          deletedCount++;
        }
      }
    }

    return { success: true, msg: `Cleanup complete. Removed ${deletedCount} duplicate documents.` };

  } catch (error) {
    console.error("Cleanup error:", error);
    return { success: false, msg: error.message };
  }
};
