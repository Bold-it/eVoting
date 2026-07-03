import { useSyncExternalStore } from "react";

export type Selections = Record<string, string | "ABSTAIN" | undefined>;

interface VotingState {
  accessToken: string | null;
  selections: Selections;
  receiptCode: string | null;
}

const KEY = "htu-voting-state";

function load(): VotingState {
  if (typeof window === "undefined") {
    return { accessToken: null, selections: {}, receiptCode: null };
  }
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { accessToken: null, selections: {}, receiptCode: null };
}

let state: VotingState = load();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
}

export const votingStore = {
  get: () => state,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  login(accessToken: string) {
    state = { accessToken, selections: {}, receiptCode: null };
    persist();
  },
  setSelection(positionId: string, candidateId: string | "ABSTAIN") {
    state = { ...state, selections: { ...state.selections, [positionId]: candidateId } };
    persist();
  },
  setReceiptCode(receiptCode: string) {
    state = { ...state, receiptCode };
    persist();
  },
  reset() {
    state = { accessToken: null, selections: {}, receiptCode: null };
    persist();
  },
};

export function useVotingState() {
  return useSyncExternalStore(
    votingStore.subscribe,
    votingStore.get,
    votingStore.get,
  );
}
