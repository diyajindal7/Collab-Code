import api from "@/lib/axios";

export const getExecutionHistory = async (roomCode) => {
  const { data } = await api.get(`/executions/${roomCode}`);
  return data;
};
