import api from "@/lib/axios";

export const reviewCode = async ({ sourceCode, language }) => {
  const { data } = await api.post("/ai/review", {
    sourceCode,
    language,
  });

  return data;
};