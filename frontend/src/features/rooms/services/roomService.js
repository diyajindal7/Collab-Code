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

export const updateRoomSettings = async (roomCode, settings) => {
  const { data } = await api.put(`/rooms/${roomCode}/settings`, settings);
  return data;
};

export const deleteRoom = async (roomCode) => {
  const { data } = await api.delete(`/rooms/${roomCode}`);
  return data;
};
