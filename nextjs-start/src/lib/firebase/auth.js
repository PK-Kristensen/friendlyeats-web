import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged as _onAuthStateChanged,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { doc, setDoc, getFirestore } from "firebase/firestore"; // Import necessary Firestore functions

import { auth } from "./firebase";

//onAuthStateChanged sets up a listener for changes in the authentication state (e.g., user logs in or out). This is crucial for dynamically updating your application's UI based on the user's sign-in status.
export function onAuthStateChanged(cb) {
  return _onAuthStateChanged(auth, cb);
}

//The signInWithGoogle function uses Firebase's signInWithPopup method with a GoogleAuthProvider to authenticate users via Google. This function is intended to be used on the client-side, where it opens a popup window for users to sign in with their Google accounts.
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const db = getFirestore(); // Initialize Firestore

  try {
    const result = await signInWithPopup(auth, provider);
    // This gives you a Google Access Token which might be used to access the Google API
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    const user = result.user;

    // Store or update the user's data in Firestore
    const userRef = doc(db, "users", user.uid); // points to a document in 'users' collection with UID as document ID
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastSignInTime: user.metadata.lastSignInTime,
      // Add more fields as necessary
    }, { merge: true }); // Use merge option to update the document or create it if it doesn't exist

  } catch (error) {
    if (error.code === 'auth/account-exists-with-different-credential') {
      // Handle account exists with different credential
      console.error("You have signed up with a different provider for that email.");
      // Handle linking here if required
    } else {
      console.error("Error signing in with Google", error);
    }
  }
}

export async function signOut() {
  try {
    return auth.signOut();
  } catch (error) {
    console.error("Error signing out with Google", error);
  }
}

export function getTokenFromRequest(req) {
  const token = req.cookies['AuthToken']; // Assuming you store your token in a cookie
  return token || null;
}

export function useUser(req) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  return user;
}

export async function signInWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in with email and password", error);
  }
}

// Function to sign up with Email and Password
export async function signUpWithEmail(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error creating new user with email and password", error);
  }
}