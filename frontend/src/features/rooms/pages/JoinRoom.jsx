import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { joinRoom } from "../services/roomService";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function JoinRoom() {
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!roomCode.trim()) {
      toast.error("Please enter a room code");
      return;
    }

    try {
      setLoading(true);

      const response = await joinRoom({
        roomCode: roomCode.trim().toUpperCase(),
      });

      toast.success(response.message);

      navigate(`/room/${response.room.roomCode}`);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to join room"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl text-center">
            Join Room 🔗
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <Input
            placeholder="Enter Room Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />

          <Button
            className="w-full"
            onClick={handleJoin}
            disabled={loading}
          >
            {loading ? "Joining..." : "Join Room"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}