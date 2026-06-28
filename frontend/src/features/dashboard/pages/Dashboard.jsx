import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

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

  const handleLogout = () => {
    logout();
    navigate("/");
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

              No rooms yet.

            </CardContent>

          </Card>

        </div>

      </div>

    </div>
  );
}