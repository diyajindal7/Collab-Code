import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import socket from "@/features/editor/socket";

export default function Toolbar({
  language,
  setLanguage,
  onRun,
  roomCode,
  isRunning,
  onLeaveRoom,
  onOpenSettings,
}) {
  const [connectionStatus, setConnectionStatus] = useState(
  socket.connected ? "Connected" : "Disconnected"
);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    alert("Room code copied!");
  };

  useEffect(() => {
    const handleConnect = () => {
      setConnectionStatus("Connected");
    };

    const handleDisconnect = () => {
      setConnectionStatus("Disconnected");
    };

    const handleReconnectAttempt = () => {
      setConnectionStatus("Reconnecting...");
    };

    const handleReconnect = () => {
      setConnectionStatus("Connected");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.io.on("reconnect_attempt", handleReconnectAttempt);
    socket.io.on("reconnect", handleReconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.io.off("reconnect_attempt", handleReconnectAttempt);
      socket.io.off("reconnect", handleReconnect);
    };
  }, []);

  const statusStyles = {
    Connected: "bg-green-500/15 border border-green-500/30 text-green-300",
    "Reconnecting...": "bg-yellow-500/15 border border-yellow-500/30 text-yellow-300",
    Disconnected: "bg-red-500/15 border border-red-500/30 text-red-300",
  };

  const statusIcon = {
    Connected: "\uD83D\uDFE2",
    "Reconnecting...": "\uD83D\uDFE0",
    Disconnected: "\uD83D\uDD34",
  };

  return (
    <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900 px-5 py-3">
      <h1 className="text-xl font-bold text-white">⚡ CollabCode</h1>

      <div className="flex items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-sm ${statusStyles[connectionStatus]}`}
        >
          {statusIcon[connectionStatus]} {connectionStatus}
        </span>

        <select
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          className="rounded bg-slate-800 px-3 py-2 text-white"
        >
          <option value="javascript">JavaScript</option>
          <option value="java">Java</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
          <option value="c">C</option>
        </select>

        <Button onClick={onRun} disabled={isRunning}>
          {isRunning ? "Running..." : "▶ Run"}
        </Button>

        <Button variant="secondary" onClick={copyRoomCode}>
          Copy Room Code
        </Button>
        <Button variant="secondary" onClick={onOpenSettings}>
          Settings
        </Button>
        <Button
    variant="destructive"
    onClick={onLeaveRoom}
>
    Leave Room
</Button>
      </div>
    </div>
  );
}
