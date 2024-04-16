
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  signInWithCustomToken,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// getApps checks if any Firebase apps have been initialized. If not, initializeApp(firebaseConfig) initializes a new app with your configuration. This prevents multiple instances of your Firebase app from being initialized, which could lead to errors.
export const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

  //Service References: getAuth, getFirestore, and getStorage are used to initialize references to Firebase Authentication, Firestore (database), and Storage services, respectively. These references are used to interact with these services throughout your application.
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
// This function attempts to authenticate a user based on a session token.
// It works both on the client-side and server-side environments.
export async function getAuthenticatedAppForUser(session = null) {
  // Logging to console for debugging purposes.
  console.log("getAuthenticatedAppForUser");

  // Check if we're running in a browser environment.
  if (typeof window !== "undefined") {
    // Client-side environment detected.
    console.log("client: ")
    console.log("auth: ", auth);

    // Return the Firebase app instance and the current user's data.
    // currentUser.toJSON() converts the user object into a JSON format for easier handling.
    return { app: firebaseApp, user: auth.currentUser.toJSON() };
  }
  console.log("server: ")
  // Server-side logic starts here:
  // Dynamically import Firebase Admin SDK modules needed for server-side authentication.
  // This approach prevents these modules from being included in the client-side bundle.
  const { initializeApp: initializeAdminApp, getApps: getAdminApps } = await import("firebase-admin/app");
  const { getAuth: getAdminAuth } = await import("firebase-admin/auth");
  const { credential } = await import("firebase-admin");

  // Define or find the Firebase Admin app instance.
  const ADMIN_APP_NAME = "firebase-frameworks";
  const adminApp =
    getAdminApps().find((app) => app.name === ADMIN_APP_NAME) ||
    initializeAdminApp({
      credential: credential.applicationDefault(),
    }, ADMIN_APP_NAME);

  // Initialize Firebase Admin Auth for further operations.
  const adminAuth = getAdminAuth(adminApp);

  // A fallback return object for when authentication fails or is unavailable.
  const noSessionReturn = { app: null, currentUser: null };

  // Check if a session token was passed; if not, attempt to retrieve it from cookies.
  if (!session) {
    console.log("no session");
    session = await getAppRouterSession();

    if (!session) {
      // No session token could be retrieved; return the fallback object.
      console.log("no session from headers");
      return noSessionReturn;
    }
  }

  // Log the session for debugging.
  console.log("session: ", session);

  // Verify the session cookie using Firebase Admin SDK.
  const decodedIdToken = await adminAuth.verifySessionCookie(session);

  // Initialize a Firebase app instance specifically for this authenticated session.
  const app = initializeAuthenticatedApp(decodedIdToken.uid)
  const auth = getAuth(app)

  // Check if the session token has been revoked.
  const isRevoked = !(await adminAuth.verifySessionCookie(session, true).catch((e) => {
    console.error(e.message);
    return true; // Assume revoked if there's an error.
  }));

  if (isRevoked) {
    // Session token is revoked; return the fallback object.
    return noSessionReturn;
  }

  // At this point, the user is considered authenticated.
  // However, if the current user's UID doesn't match the UID from the decoded token,
  // a custom token is created and used to authenticate the user again.
  if (auth.currentUser?.uid !== decodedIdToken.uid) {
    const customToken = await adminAuth.createCustomToken(decodedIdToken.uid).catch((e) => {
      console.error(e.message);
      return null; // Return null to indicate failure.
    });

    if (!customToken) {
      // Custom token creation failed; return the fallback object.
      return noSessionReturn;
    }

    // Use the custom token to authenticate the user.
    await signInWithCustomToken(auth, customToken);
  }

  // Successful server-side authentication; return the app instance and current user.
  console.log("server: ", app);
  return { app, currentUser: auth.currentUser };
}


async function getAppRouterSession() {
  // dynamically import to prevent import errors in pages router
  const { cookies } = await import("next/headers");
  console.log("cookies: ", cookies().get("__session")?.value);
  try {
    return cookies().get("__session")?.value;
  } catch (error) {
    // cookies() throws when called from pages router
    return undefined;
  }
}

function initializeAuthenticatedApp(uid) {
  const random = Math.random().toString(36).split(".")[1];
  const appName = `authenticated-context:${uid}:${random}`;

  const app = initializeApp(firebaseConfig, appName);

  return app;
}
