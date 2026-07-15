import api from "@/lib/axios";

export const fixCode = async ({ sourceCode, language }) => {
  const { data } = await api.post("/ai/fix", {
    sourceCode,
    language,
  });

  return data;
};
