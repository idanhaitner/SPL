import type { FirebaseOptions } from "firebase/app";

// The site's Firebase web config. It is public by design: Firestore's security rules (firebase/firestore.rules) decide what anyone may do.
// While it is null the leaderboard is switched off and the site behaves exactly as it did before it. See "Leaderboard setup" in the README.
export const FIREBASE_CONFIG: FirebaseOptions | null = null;
