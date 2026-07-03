import type { Election, Position, Candidate } from "./admin-store";

export interface CandidateTally {
  candidate: Candidate;
  votes: number;
  pct: number; // share of valid (non-abstain) votes
}

export type PositionOutcome =
  | { kind: "decided"; winners: CandidateTally[] } // single winner
  | { kind: "no_majority"; top: CandidateTally[]; nextStep: "runoff" | "plurality" }
  | { kind: "tie"; tied: CandidateTally[] };

export interface PositionResult {
  position: Position;
  tallies: CandidateTally[]; // sorted desc by votes
  abstain: number;
  totalCast: number; // candidate votes + abstain
  validVotes: number; // candidate votes only
  outcome: PositionOutcome;
}

// Deterministic hash → 0..1 pseudo-random based on a string.
function rand(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

// Scripted scenarios per (electionId, positionId) so the demo shows all
// three states cleanly. Falls back to deterministic mock tallies.
function scriptedShares(
  electionId: string,
  position: Position,
  candidates: Candidate[],
): { shares: number[]; abstainShare: number } | null {
  if (electionId === "el-2026") {
    if (position.id === "p-pres" && candidates.length >= 2) {
      // Majority + runoff: no candidate above 50% → "No Majority Reached"
      return { shares: [0.46, 0.45], abstainShare: 0.09 };
    }
    if (position.id === "p-vp" && candidates.length >= 2) {
      // Tie scenario for the top spot
      return { shares: [0.45, 0.45], abstainShare: 0.10 };
    }
    if (position.id === "p-sec") {
      // Clear plurality winner
      const base = [0.78];
      while (base.length < candidates.length) base.push((1 - 0.78 - 0.08) / (candidates.length - 1));
      return { shares: base, abstainShare: 0.08 };
    }
  }
  return null;
}

export function tallyElection(election: Election): PositionResult[] {
  const totalVoters = election.voters.filter((v) => v.voted).length || Math.max(50, election.voters.length);

  return election.positions.map((position) => {
    const candidates = election.candidates.filter((c) => c.positionId === position.id);

    let candidateVotes: number[] = [];
    let abstain = 0;

    if (candidates.length === 0) {
      return {
        position,
        tallies: [],
        abstain: 0,
        totalCast: 0,
        validVotes: 0,
        outcome: { kind: "decided", winners: [] } as PositionOutcome,
      };
    }

    const scripted = scriptedShares(election.id, position, candidates);
    if (scripted) {
      candidateVotes = scripted.shares.map((s) => Math.round(s * totalVoters));
      abstain = Math.max(0, totalVoters - candidateVotes.reduce((a, b) => a + b, 0));
    } else {
      // Deterministic per-candidate weight; first candidate slightly favored
      const weights = candidates.map((c, i) => 0.5 + rand(election.id + ":" + c.id) + (i === 0 ? 0.25 : 0));
      const sum = weights.reduce((a, b) => a + b, 0);
      const abstainShare = 0.05 + rand(election.id + ":" + position.id) * 0.07;
      const valid = Math.round(totalVoters * (1 - abstainShare));
      candidateVotes = weights.map((w) => Math.round((w / sum) * valid));
      abstain = totalVoters - candidateVotes.reduce((a, b) => a + b, 0);
      if (abstain < 0) abstain = 0;
    }

    const validVotes = candidateVotes.reduce((a, b) => a + b, 0);

    const tallies: CandidateTally[] = candidates
      .map((c, i) => ({
        candidate: c,
        votes: candidateVotes[i] ?? 0,
        pct: validVotes ? ((candidateVotes[i] ?? 0) / validVotes) * 100 : 0,
      }))
      .sort((a, b) => b.votes - a.votes);

    const top = tallies[0];
    const tiedAtTop = tallies.filter((t) => t.votes === top.votes);

    let outcome: PositionOutcome;
    if (tiedAtTop.length > 1) {
      outcome = { kind: "tie", tied: tiedAtTop };
    } else if (position.countingMethod === "majority" && top.pct <= 50) {
      const runnerUp = tallies[1] ? [top, tallies[1]] : [top];
      outcome = {
        kind: "no_majority",
        top: runnerUp,
        nextStep: position.majorityFallback === "runoff" ? "runoff" : "plurality",
      };
    } else {
      outcome = { kind: "decided", winners: [top] };
    }

    return {
      position,
      tallies,
      abstain,
      totalCast: validVotes + abstain,
      validVotes,
      outcome,
    };
  });
}

export function isPositionPublishable(r: PositionResult): boolean {
  if (r.outcome.kind === "tie") return false;
  if (r.outcome.kind === "no_majority" && r.outcome.nextStep === "runoff") return false;
  return true;
}

export function electionTurnout(election: any) {
  let voted = 0;
  let total = 0;
  if (election._count) {
    voted = election._count.VoteRecords || 0;
    total = election._count.Voters || 0;
  } else if (election.voters) {
    voted = election.voters.filter((v: any) => v.voted).length;
    total = election.voters.length;
  }
  const pct = total ? Math.round((voted / total) * 100) : 0;
  return { voted, total, pct };
}

// Convert Backend Results to Frontend PositionResult structure
export function processBackendResults(backendData: any, frontendElection: Election): PositionResult[] {
  if (!backendData || !backendData.positions) return [];
  
  const totalCast = backendData.totalBallotsCast || 0;

  return backendData.positions.map((posInfo: any) => {
    // Attempt to match with frontend config for counting method rules
    const positionDef = (frontendElection.Positions || frontendElection.positions || []).find((p: any) => p.id === posInfo.id) || {
      id: posInfo.id,
      title: posInfo.name || posInfo.title,
      description: "",
      countingMethod: "plurality",
      majorityFallback: "plurality",
    };

    const validVotes = posInfo.totalVotes || 0;
    const abstain = Math.max(0, totalCast - validVotes);

    const tallies: CandidateTally[] = (posInfo.candidates || [])
      .map((c: any) => ({
        candidate: { id: c.id, name: c.name, positionId: posInfo.id, photo: c.photoUrl, manifesto: "", credentials: [] },
        votes: c.votes || 0,
        pct: validVotes ? ((c.votes || 0) / validVotes) * 100 : 0,
      }))
      .sort((a: CandidateTally, b: CandidateTally) => b.votes - a.votes);

    const top = tallies[0];
    let outcome: PositionOutcome;
    
    if (tallies.length === 0 || !top) {
      outcome = { kind: "decided", winners: [] };
    } else {
      const tiedAtTop = tallies.filter((t) => t.votes === top.votes);
      if (tiedAtTop.length > 1) {
        outcome = { kind: "tie", tied: tiedAtTop };
      } else if (positionDef.countingMethod === "majority" && top.pct <= 50) {
        const runnerUp = tallies[1] ? [top, tallies[1]] : [top];
        outcome = {
          kind: "no_majority",
          top: runnerUp,
          nextStep: positionDef.majorityFallback === "runoff" ? "runoff" : "plurality",
        };
      } else {
        outcome = { kind: "decided", winners: [top] };
      }
    }

    return {
      position: positionDef as Position,
      tallies,
      abstain,
      totalCast,
      validVotes,
      outcome,
    };
  });
}
