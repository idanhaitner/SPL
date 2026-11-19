import { initializeApp, type FirebaseOptions } from "firebase/app";
import { Timestamp, collection, doc, getDocs, getFirestore, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import type { BoardStore } from "./board-store";
import { toRow, type Row } from "./leaderboard";

// Firestore holds one document per device at courses/{courseId}/players/{playerId}. Loaded only through getStore().
export function firestoreStore(config: FirebaseOptions): BoardStore {
  const db = getFirestore(initializeApp(config));
  const players = (courseId: string) => collection(db, "courses", courseId, "players");
  const rows = (docs: { id: string; data: () => unknown }[]) => docs.map((snap) => toRow(snap.id, snap.data())).filter((row): row is Row => row !== null);
  return {
    async put(courseId, id, { reachedAt, ...row }) {
      await setDoc(doc(players(courseId), id), { ...row, reachedAt: Timestamp.fromMillis(reachedAt), updatedAt: serverTimestamp() }, { merge: true });
    },
    async once(courseId) {
      return rows((await getDocs(players(courseId))).docs);
    },
    watch(courseId, onRows, onError) {
      return onSnapshot(players(courseId), (snapshot) => onRows(rows(snapshot.docs)), () => onError());
    },
  };
}
