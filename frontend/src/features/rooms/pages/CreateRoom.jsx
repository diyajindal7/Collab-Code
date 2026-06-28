import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom } from "../services/roomService";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateRoom() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await createRoom({
        title,
        language,
      });

      toast.success("Room Created Successfully!");

      navigate(`/room/${response.room.roomCode}`);

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create room"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">

      <Card className="w-full max-w-lg">

        <CardHeader>

          <CardTitle className="text-3xl">

            Create Room 🚀

          </CardTitle>

        </CardHeader>

        <CardContent>

          <form
            onSubmit={handleCreateRoom}
            className="space-y-5"
          >

            <div>

              <Label>Room Title</Label>

              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="DSA Practice Room"
              />

            </div>

            <div>

              <Label>Programming Language</Label>

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full border rounded-md p-2"
              >
                <option>javascript</option>
                <option>java</option>
                <option>python</option>
                <option>cpp</option>
                <option>c</option>
              </select>

            </div>

            <Button
              className="w-full"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Room"}
            </Button>

          </form>

        </CardContent>

      </Card>

    </div>
  );
}