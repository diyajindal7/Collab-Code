import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import socket from "@/features/editor/socket";
import { useChat } from "@/features/chat/context/ChatContext";
export default function ChatPanel() {

  const { roomCode } = useParams();

  const { messages, setMessages } = useChat();

  const [text, setText] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
useEffect(() => {
  const handleMessage = (message) => {
    setMessages((prev) => [...prev, message]);
  };

  const handleSystemMessage = (message) => {
    setMessages((prev) => [...prev, {
      ...message,
      system: true,
    }]);
  };

  socket.on("receive-message", handleMessage);
  socket.on("system-message", handleSystemMessage);

  return () => {
    socket.off("receive-message", handleMessage);
    socket.off("system-message", handleSystemMessage);
  };
}, [setMessages]);

  const sendMessage = () => {

    if (!text.trim()) return;

    socket.emit("send-message", {
      roomCode,
      message: text,
      user: user.name,
    });

    setText("");

  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white">

      <div className="p-3 border-b">
        <h2 className="font-bold">
          Chat
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">

        {messages.map((msg, index) => (

          <div key={`${msg.type || "chat"}-${index}`}>

            {msg.system ? (
              <div className="flex justify-center">
                <div
                  className={`rounded-full px-3 py-1 text-center text-xs ${
                    msg.type === "join"
                      ? "bg-green-500/15 border border-green-500/30 text-green-300 text-green-200"
                      : "bg-red-500/15 border border-red-500/30 text-red-300 text-red-200"
                  }`}
                >
                  {msg.type === "join" ? "\uD83D\uDFE2" : "\uD83D\uDD34"} {msg.message}
                </div>
              </div>
            ) : (
            <div className="bg-slate-800 rounded-lg p-2">
  <div className="flex justify-between text-sm mb-1">
    <span className="font-semibold text-cyan-400">
      {msg.user}
    </span>

    <span className="text-gray-400">
      {msg.time}
    </span>
  </div>

  <p>{msg.message}</p>
</div>
            )}

          </div>

        ))}

      </div>

     <div className="p-3 flex gap-2 border-t border-slate-700">

  <input
    className="flex-1 rounded-lg bg-slate-800 px-3 py-2 outline-none"
    placeholder="Type a message..."
    value={text}
    onChange={(e) => setText(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter") sendMessage();
    }}
  />

  <button
    onClick={sendMessage}
    className="bg-blue-600 hover:bg-blue-700 px-4 rounded-lg"
  >
    Send
  </button>

</div>

    </div>
  );
}