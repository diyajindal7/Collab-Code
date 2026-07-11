import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/judge0",
});

export const runCode = async (payload) => {
  const { data } = await API.post("/run", payload);
  return data;
};