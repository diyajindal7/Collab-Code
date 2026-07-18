import api from "@/lib/axios";

export const runCode = async (payload) => {
  const { data } = await api.post("/judge0/run", payload);
  return data;
};
