import api from "@/lib/axios";

export const explainCode = async ({ sourceCode, language }) => {
  const { data } = await api.post("/ai/explain", {
    sourceCode,
    language,
  });

  return data;
};
