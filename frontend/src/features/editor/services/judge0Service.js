import axios from "axios";

const API = axios.create({
  baseURL: "`${import.meta.env.VITE_API_URL}/judge0`",
});

export const runCode = async (payload) => {
  const { data } = await API.post("/run", payload);
  return data;
};