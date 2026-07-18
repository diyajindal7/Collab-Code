import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getMyRooms } from "@/features/rooms/services/roomService";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState("");

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoadingRooms(true);
        setRoomsError("");

        const data = await getMyRooms();
        setRooms(data.rooms || []);
      } catch (error) {
        setRoomsError(
          error.response?.data?.message || "Unable to load recent rooms"
        );
      } finally {
        setLoadingRooms(false);
      }
    };

    fetchRooms();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getRoomOwnerId = (room) => {
    if (room.owner?._id) {
      return room.owner._id;
    }

    if (room.owner?.id) {
      return room.owner.id;
    }

    return room.owner;
  };

  const getUserId = () => user?._id || user?.id || user?.userId;

  const getRoomRole = (room) =>
    getRoomOwnerId(room)?.toString() === getUserId()?.toString()
      ? "Owner"
      : "Participant";

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}

      <nav className="border-b border-slate-800">

        <div className="max-w-7xl mx-auto flex justify-between items-center p-5">

          <h1 className="text-3xl font-bold">
            ⚡ CollabCode
          </h1>

          <div className="flex items-center gap-4">

            <span>
              Welcome, {user?.name}
            </span>

            <Button
              variant="destructive"
              onClick={handleLogout}
            >
              Logout
            </Button>

          </div>

        </div>

      </nav>

      {/* Body */}

      <div className="max-w-7xl mx-auto p-8">

        <h2 className="text-4xl font-bold mb-8">
          Dashboard
        </h2>

        <div className="grid md:grid-cols-2 gap-8">

          <Card
            className="cursor-pointer hover:scale-105 transition"
            onClick={() => navigate("/create-room")}
          >
            <CardHeader>

              <CardTitle className="text-2xl">

                ➕ Create Room

              </CardTitle>

            </CardHeader>

            <CardContent>

              Create a collaborative coding room.

            </CardContent>

          </Card>

          <Card
            className="cursor-pointer hover:scale-105 transition"
            onClick={() => navigate("/join-room")}
          >
            <CardHeader>

              <CardTitle className="text-2xl">

                🔗 Join Room

              </CardTitle>

            </CardHeader>

            <CardContent>

              Join using a room code.

            </CardContent>

          </Card>

        </div>

        <div className="mt-12">

          <h2 className="text-3xl font-bold mb-6">

            Recent Rooms

          </h2>

          <Card>

            <CardContent className="p-6">

              {loadingRooms ? (
                <p className="text-slate-400">
                  Loading recent rooms...
                </p>
              ) : roomsError ? (
                <p className="text-red-400">
                  {roomsError}
                </p>
              ) : rooms.length === 0 ? (
                "No rooms yet."
              ) : (
                <div className="space-y-4">
                  {rooms.map((room) => (
                    <div
                      key={room._id}
                      className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-semibold text-white">
                            {room.title}
                          </h3>

                          <span className="rounded-full border border-blue-500/30 bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-300">
                            {getRoomRole(room)}
                          </span>

                          {room.interviewMode && (
                            <span className="rounded-full border border-purple-500/30 bg-purple-500/15 px-3 py-1 text-xs font-medium text-purple-300">
                              Interview Mode
                            </span>
                          )}
                        </div>

                        <div className="mt-3 grid gap-2 text-sm text-slate-400 md:grid-cols-2">
                          <span>
                            Code: {room.roomCode}
                          </span>

                          <span>
                            Language: {room.language}
                          </span>

                          <span>
                            Participants: {room.participants?.length || 0}
                          </span>

                          <span>
                            Created: {formatDate(room.createdAt)}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => navigate(`/room/${room.roomCode}`)}
                      >
                        Open Room
                      </Button>
                    </div>
                  ))}
                </div>
              )}

            </CardContent>

          </Card>

        </div>

      </div>

    </div>
  );
}
