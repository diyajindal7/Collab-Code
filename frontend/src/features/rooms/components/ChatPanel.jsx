import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";

import socket from "@/features/editor/socket";
import { useChat } from "@/features/chat/context/ChatContext";
export default function ChatPanel() {

  const { roomCode } = useParams();

  const { messages, setMessages } = useChat();

  const [text, setText] = useState("");
  const [typingUser, setTypingUser] = useState("");
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const username = user?.name;

  const emitTypingStop = () => {
    if (!isTypingRef.current) return;

    socket.emit("typing:stop", {
      roomCode,
      username: user.name,
    });

    isTypingRef.current = false;
  };

  const handleInputChange = (event) => {
    const value = event.target.value;

    setText(value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (!value.trim()) {
      emitTypingStop();
      return;
    }

    if (!isTypingRef.current) {
      socket.emit("typing:start", {
        roomCode,
        username: user.name,
      });

      isTypingRef.current = true;
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStop();
    }, 1000);
  };

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

 const handleTypingStart = ({ username: receivedUsername }) => {
  if (receivedUsername === username) return;

  setTypingUser(receivedUsername);
};

const handleTypingStop = ({ username: receivedUsername }) => {
  if (receivedUsername === username) return;

  setTypingUser("");
};

  socket.on("receive-message", handleMessage);
  socket.on("system-message", handleSystemMessage);
  socket.on("typing:start", handleTypingStart);
  socket.on("typing:stop", handleTypingStop);

  return () => {
    socket.off("receive-message", handleMessage);
    socket.off("system-message", handleSystemMessage);
    socket.off("typing:start", handleTypingStart);
    socket.off("typing:stop", handleTypingStop);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    emitTypingStop();
  };
}, [setMessages]);

  const sendMessage = () => {

    if (!text.trim()) return;

    socket.emit("send-message", {
      roomCode,
      message: text,
      user: user.name,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    emitTypingStop();
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
                      ? "bg-green-500/15 border border-green-500/30 text-green-300"
                      : "bg-red-500/15 border border-red-500/30 text-red-300"
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

      <div className="px-3 pb-2 text-sm italic text-slate-400 transition-all duration-300">
        {typingUser ? `\uD83D\uDCAC ${typingUser} is typing...` : ""}
      </div>

     <div className="p-3 flex gap-2 border-t border-slate-700">

  <input
    className="flex-1 rounded-lg bg-slate-800 px-3 py-2 outline-none"
    placeholder="Type a message..."
    value={text}
    onChange={handleInputChange}
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