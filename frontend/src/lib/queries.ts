import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

export interface Election {
  id: string;
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  status: 'draft' | 'open' | 'closed' | 'results_published';
  configLocked: boolean;
  createdAt: string;
  updatedAt: string;
  Positions: Position[];
  Voters: Voter[];
}

export interface ElectionListDto {
  id: string;
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  status: 'draft' | 'open' | 'closed' | 'results_published';
  createdAt: string;
  _count: {
    Voters: number;
    Positions: number;
    VoteRecords: number;
  };
}

export interface Position {
  id: string;
  electionId: string;
  name: string;
  countingMethod: 'plurality' | 'simple_majority';
  majorityFallback: 'runoff' | 'plurality' | null;
  Candidates: Candidate[];
}

export interface Candidate {
  id: string;
  positionId: string;
  name: string;
  photoUrl: string | null;
  manifesto: string | null;
  credentials: string | null;
}

export interface Voter {
  id: string;
  studentId: string;
  name: string;
  email: string;
  hasVoted: boolean;
}

// ----------------------------------------------------
// ELECTIONS
// ----------------------------------------------------

export function useElections() {
  return useQuery({
    queryKey: ['elections'],
    queryFn: async () => {
      const res = await api.get<ElectionListDto[]>('/admin/elections');
      return res.data;
    },
  });
}

export function useElection(id: string) {
  return useQuery({
    queryKey: ['elections', id],
    queryFn: async () => {
      const res = await api.get<Election>(`/admin/elections/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateElection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { election: any, positions: any[] }) => {
      const res = await api.post('/admin/elections', data.election);
      const electionId = res.data.id;

      if (data.positions && data.positions.length > 0) {
        await Promise.all(
          data.positions.map((pos) =>
            api.post(`/admin/elections/${electionId}/positions`, {
              name: pos.title,
              countingMethod: pos.countingMethod === 'majority' ? 'simple_majority' : 'plurality',
              majorityFallback: pos.majorityFallback,
            })
          )
        );
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elections'] });
    },
  });
}

export function useUpdateElection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action }: { id: string, action: 'open' | 'close' }) => {
      const status = action === 'open' ? 'open' : 'closed';
      const res = await api.patch(`/admin/elections/${id}`, { status });
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['elections'] });
      queryClient.invalidateQueries({ queryKey: ['elections', id] });
    },
  });
}

export function useElectionVoters(electionId: string) {
  return useQuery({
    queryKey: ['elections', electionId, 'voters'],
    queryFn: async () => {
      const res = await api.get<Voter[]>(`/admin/elections/${electionId}/voters`);
      return res.data;
    },
    enabled: !!electionId,
  });
}

export function useUploadVoters() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ electionId, voters }: { electionId: string, voters: { studentId: string, name: string }[] }) => {
      const res = await api.post(`/admin/elections/${electionId}/voters/bulk`, { voters });
      return res.data;
    },
    onSuccess: (_, { electionId }) => {
      queryClient.invalidateQueries({ queryKey: ['elections', electionId] });
      queryClient.invalidateQueries({ queryKey: ['elections', electionId, 'voters'] });
    },
  });
}

// ----------------------------------------------------
// POSITIONS & CANDIDATES
// ----------------------------------------------------

export function useCreateCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ positionId, formData }: { positionId: string; formData: FormData }) => {
      const res = await api.post(`/admin/positions/${positionId}/candidates`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elections'] });
    },
  });
}

export function useDeleteCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (candidateId: string) => {
      const res = await api.delete(`/admin/candidates/${candidateId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elections'] });
    },
  });
}

// TODO: Add position creation hook when backend supports it

export function useGenerateTokens() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (electionId: string) => {
      const res = await api.post(`/admin/elections/${electionId}/tokens/bulk`);
      return res.data;
    },
    onSuccess: (_, electionId) => {
      queryClient.invalidateQueries({ queryKey: ['elections', electionId, 'voters'] });
      queryClient.invalidateQueries({ queryKey: ['elections'] });
    },
  });
}

export function useClearVoters() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (electionId: string) => {
      const res = await api.delete(`/admin/elections/${electionId}/voters`);
      return res.data;
    },
    onSuccess: (_, electionId) => {
      queryClient.invalidateQueries({ queryKey: ['elections', electionId, 'voters'] });
      queryClient.invalidateQueries({ queryKey: ['elections'] });
    },
  });
}
