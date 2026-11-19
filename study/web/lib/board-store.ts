import { FIREBASE_CONFIG } from "./firebase-config";
import type { Row, Summary } from "./leaderboard";

// What a device sends for its own row. The store stamps updatedAt itself.
export type RowInput = Summary & { name: string; reachedAt: number; hidden?: boolean };

export interface BoardStore {
  put(courseId: string, id: string, row: RowInput): Promise<void>;
  once(courseId: string): Promise<Row[]>;
  watch(courseId: string, onRows: (rows: Row[]) => void, onError: () => void): () => void;
}

// The browser checks install an in-memory board here instead of Firestore.
type TestBoard = { rows: Row[]; fail?: boolean };
declare global {
  interface Window {
    __studyBoard?: TestBoard;
  }
}

const testBoard = () => (typeof window !== "undefined" ? window.__studyBoard : undefined);

export function boardEnabled() {
  return FIREBASE_CONFIG !== null || !!testBoard();
}

function memoryStore(board: TestBoard): BoardStore {
  const listeners = new Set<() => void>();
  const failure = () => Promise.reject(new Error("The test board is set to fail"));
  return {
    put(_courseId, id, row) {
      if (board.fail) return failure();
      const next: Row = { id, hidden: false, ...row, updatedAt: Date.now() };
      board.rows = [...board.rows.filter((other) => other.id !== id), next];
      listeners.forEach((listener) => listener());
      return Promise.resolve();
    },
    once() {
      return board.fail ? failure() : Promise.resolve([...board.rows]);
    },
    watch(_courseId, onRows, onError) {
      if (board.fail) {
        onError();
        return () => {};
      }
      const listener = () => onRows([...board.rows]);
      listeners.add(listener);
      listener();
      return () => listeners.delete(listener);
    },
  };
}

let store: Promise<BoardStore | null> | null = null;

// The Firebase SDK is only ever loaded from here, on demand, so no page carries it at first paint.
export function getStore(): Promise<BoardStore | null> {
  const board = testBoard();
  if (board) return Promise.resolve(memoryStore(board));
  if (!FIREBASE_CONFIG) return Promise.resolve(null);
  const config = FIREBASE_CONFIG;
  store ??= import("./board-firestore").then(({ firestoreStore }) => firestoreStore(config)).catch(() => {
    store = null;
    return null;
  });
  return store;
}
