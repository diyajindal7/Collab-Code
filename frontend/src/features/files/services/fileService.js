import api from "@/lib/axios";

export const getFileTree = async (roomCode) => {
  const { data } = await api.get(`/files/${roomCode}/tree`);
  return data;
};

export const createFile = async (roomCode, payload) => {
  const { data } = await api.post(`/files/${roomCode}/file`, payload);
  return data;
};

export const createFolder = async (roomCode, payload) => {
  const { data } = await api.post(`/files/${roomCode}/folder`, payload);
  return data;
};

export const renameFileItem = async (itemId, name) => {
  const { data } = await api.put(`/files/${itemId}/rename`, { name });
  return data;
};

export const deleteFileItem = async (itemId) => {
  const { data } = await api.delete(`/files/${itemId}`);
  return data;
};

export const updateFileContent = async (itemId, payload) => {
  const { data } = await api.put(`/files/${itemId}/content`, payload);
  return data;
};
