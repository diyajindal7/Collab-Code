import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEditor } from "@/features/editor/context/EditorContext";
import {
  deleteRoom as deleteRoomService,
  getMyRooms,
  updateRoomSettings,
} from "../services/roomService";

const getUserId = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?._id || user?.id || user?.userId;
};

const getRoomOwnerId = (room) => room?.owner?._id || room?.owner?.id || room?.owner;

export default function useRoomSettings(
  roomCode,
  { setLanguage, setInterviewMode, setInterviewStatus, setDuration, setTimeRemaining }
) {
  const navigate = useNavigate();
  const { resetEditor } = useEditor();
  const [room, setRoom] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    title: "",
    language: "javascript",
    interviewMode: false,
    duration: 45,
  });

  const isOwner =
    getRoomOwnerId(room)?.toString() === getUserId()?.toString();

  useEffect(() => {
    const loadRoomDetails = async () => {
      try {
        const data = await getMyRooms();
        const currentRoom = (data.rooms || []).find(
          (roomItem) => roomItem.roomCode === roomCode
        );

        if (currentRoom) {
          setRoom(currentRoom);
          setLanguage(currentRoom.language || "javascript");
          setInterviewMode(Boolean(currentRoom.interviewMode));
          setInterviewStatus(currentRoom.interviewStatus || "waiting");
          setDuration(currentRoom.duration || 45);
          setTimeRemaining((currentRoom.duration || 45) * 60);
          setSettings({
            title: currentRoom.title || "",
            language: currentRoom.language || "javascript",
            interviewMode: Boolean(currentRoom.interviewMode),
            duration: currentRoom.duration || 45,
          });
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadRoomDetails();
  }, [
    roomCode,
    setDuration,
    setInterviewMode,
    setInterviewStatus,
    setLanguage,
    setTimeRemaining,
  ]);

  const saveSettings = useCallback(async () => {
    try {
      const data = await updateRoomSettings(roomCode, settings);
      setRoom(data.room);
      setLanguage(data.room.language);
      setInterviewMode(Boolean(data.room.interviewMode));
      setDuration(data.room.duration || 45);
      setShowSettings(false);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Unable to update settings");
    }
  }, [roomCode, setDuration, setInterviewMode, setLanguage, settings]);

  const deleteRoom = useCallback(async () => {
    if (!window.confirm("Delete this room?")) {
      return;
    }

    try {
      await deleteRoomService(roomCode);
      resetEditor();
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Unable to delete room");
    }
  }, [navigate, resetEditor, roomCode]);

  return {
    room,
    isOwner,
    settings,
    setSettings,
    saveSettings,
    deleteRoom,
    showSettings,
    setShowSettings,
  };
}
