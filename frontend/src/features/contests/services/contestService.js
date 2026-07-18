import api from "@/lib/axios";

export const getContest = async (roomCode) => {
  const { data } = await api.get(`/contests/rooms/${roomCode}`);
  return data;
};

export const createContest = async (roomCode, payload) => {
  const { data } = await api.post(`/contests/rooms/${roomCode}`, payload);
  return data;
};

export const createContestProblem = async (contestId, payload) => {
  const { data } = await api.post(`/contests/${contestId}/problems`, payload);
  return data;
};

export const updateContestStatus = async (contestId, payload) => {
  const { data } = await api.patch(`/contests/${contestId}/status`, payload);
  return data;
};

export const submitContestSolution = async (contestId, problemId, payload) => {
  const { data } = await api.post(
    `/contests/${contestId}/problems/${problemId}/submit`,
    payload
  );
  return data;
};

export const getContestResults = async (contestId) => {
  const { data } = await api.get(`/contests/${contestId}/results`);
  return data;
};
