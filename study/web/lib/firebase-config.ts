import type { FirebaseOptions } from "firebase/app";

// The site's Firebase web config. It is public by design: Firestore's security rules (firebase/firestore.rules) decide what anyone may do.
// Set it to null to switch the leaderboard off; the site then behaves exactly as it did before it. See "Leaderboard setup" in the README.
export const FIREBASE_CONFIG: FirebaseOptions | null = {
  apiKey: "AIzaSyDghimu1v75mIcc5GCCHqCk0CmkbwVea7I",
  authDomain: "spl-leaderboard-d0082.firebaseapp.com",
  projectId: "spl-leaderboard-d0082",
  storageBucket: "spl-leaderboard-d0082.firebasestorage.app",
  messagingSenderId: "293006187267",
  appId: "1:293006187267:web:aa35d8a69f3fd0b1a3a736",
};
