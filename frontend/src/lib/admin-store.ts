import { useSyncExternalStore } from "react";

export type ElectionStatus = "Draft" | "Open" | "Closed" | "Results Published";
export type CountingMethod = "plurality" | "majority";
export type MajorityFallback = "runoff" | "plurality";

export interface Candidate {
  id: string;
  name: string;
  positionId: string;
  photo: string;
  manifesto: string;
  credentials: string[];
}

export interface Position {
  id: string;
  title: string;
  countingMethod: CountingMethod;
  majorityFallback: MajorityFallback;
}

export interface Voter {
  studentId: string;
  name: string;
  token?: string;
  voted?: boolean;
}

export interface Election {
  id: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  status: ElectionStatus;
  positions: Position[];
  candidates: Candidate[];
  voters: Voter[];
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  ts: string;
  actor: string;
  action: string;
}

interface AdminState {
  admin: { email: string } | null;
  elections: Election[];
  audit: AuditEntry[];
}

const KEY = "htu-admin-state-v3";

const seed: AdminState = {
  admin: null,
  elections: [],
  audit: [],
};

function load(): AdminState {
  if (typeof window === "undefined") return seed;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return seed;
}

let state: AdminState = load();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window !== "undefined") sessionStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

function logAction(action: string) {
  state = {
    ...state,
    audit: [
      { id: "a" + Date.now(), ts: new Date().toISOString().slice(0, 16), actor: state.admin?.email ?? "Admin", action },
      ...state.audit,
    ],
  };
}

const rid = () => Math.random().toString(36).slice(2, 9);

export const adminStore = {
  get: () => state,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  login(email: string) {
    state = { ...state, admin: { email } };
    persist();
  },
  logout() {
    state = { ...state, admin: null };
    persist();
  },
  createElection(input: Omit<Election, "id" | "status" | "candidates" | "voters" | "createdAt"> & { id?: string }) {
    const el: Election = {
      ...input,
      id: input.id ?? "el-" + rid(),
      status: "Draft",
      candidates: [],
      voters: [],
      createdAt: new Date().toISOString().slice(0, 16),
    };
    state = { ...state, elections: [el, ...state.elections] };
    logAction(`Election created: ${el.title}`);
    persist();
    return el.id;
  },
  updateElection(id: string, patch: Partial<Election>) {
    state = {
      ...state,
      elections: state.elections.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    };
    persist();
  },
  openElection(id: string) {
    const el = state.elections.find((e) => e.id === id);
    if (!el) return;
    state = {
      ...state,
      elections: state.elections.map((e) => (e.id === id ? { ...e, status: "Open" as const } : e)),
    };
    logAction(`Election opened: ${el.title}`);
    persist();
  },
  closeElection(id: string) {
    const el = state.elections.find((e) => e.id === id);
    if (!el) return;
    state = {
      ...state,
      elections: state.elections.map((e) => (e.id === id ? { ...e, status: "Closed" as const } : e)),
    };
    logAction(`Election closed: ${el.title}`);
    persist();
  },
  publishResults(id: string) {
    const el = state.elections.find((e) => e.id === id);
    if (!el) return;
    state = {
      ...state,
      elections: state.elections.map((e) =>
        e.id === id ? { ...e, status: "Results Published" as const } : e,
      ),
    };
    logAction(`Results published: ${el.title}`);
    persist();
  },
  addCandidate(electionId: string, c: Omit<Candidate, "id">) {
    state = {
      ...state,
      elections: state.elections.map((e) =>
        e.id === electionId ? { ...e, candidates: [...e.candidates, { ...c, id: "c" + rid() }] } : e,
      ),
    };
    logAction(`Candidate added: ${c.name}`);
    persist();
  },
  updateCandidate(electionId: string, candidateId: string, patch: Partial<Candidate>) {
    state = {
      ...state,
      elections: state.elections.map((e) =>
        e.id === electionId
          ? { ...e, candidates: e.candidates.map((c) => (c.id === candidateId ? { ...c, ...patch } : c)) }
          : e,
      ),
    };
    persist();
  },
  removeCandidate(electionId: string, candidateId: string) {
    state = {
      ...state,
      elections: state.elections.map((e) =>
        e.id === electionId ? { ...e, candidates: e.candidates.filter((c) => c.id !== candidateId) } : e,
      ),
    };
    persist();
  },
  setVoters(electionId: string, voters: Voter[]) {
    state = {
      ...state,
      elections: state.elections.map((e) => (e.id === electionId ? { ...e, voters } : e)),
    };
    logAction(`Voter roll uploaded (${voters.length} voters)`);
    persist();
  },
  generateTokens(electionId: string) {
    state = {
      ...state,
      elections: state.elections.map((e) =>
        e.id === electionId
          ? {
              ...e,
              voters: e.voters.map((v) => ({
                ...v,
                token:
                  v.token ??
                  `VOTE-${v.studentId.slice(-4)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
              })),
            }
          : e,
      ),
    };
    logAction(`Voting tokens generated`);
    persist();
  },
};

export function useAdminState() {
  return useSyncExternalStore(adminStore.subscribe, adminStore.get, adminStore.get);
}
