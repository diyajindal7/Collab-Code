import api from "@/lib/axios";

export const createRoom = async (roomData) => {
  const { data } = await api.post("/rooms/create", roomData);
  return data;
};

export const joinRoom = async (roomData) => {
  const { data } = await api.post("/rooms/join", roomData);
  return data;
};

export const getMyRooms = async () => {
  const { data } = await api.get("/rooms/my-rooms");
  return data;
};