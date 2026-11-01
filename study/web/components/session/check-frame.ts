"use client";

import { createContext, type ReactNode } from "react";

// A lesson shows a check as one card. A practice step passes this down to lay the same check out across its panels.
export type CheckFrame = (parts: { question: ReactNode; answers: ReactNode; right: boolean }) => ReactNode;

export const CheckFrameContext = createContext<CheckFrame | null>(null);
