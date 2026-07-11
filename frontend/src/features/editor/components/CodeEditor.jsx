import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { useParams } from "react-router-dom";
import socket from "../socket";
import { useParticipants } from "@/features/rooms/context/ParticipantsContext";
import { useEditor } from "../context/EditorContext";

export default function CodeEditor({ language }) {
  const { roomCode } = useParams();

  const editorRef = useRef(null);
  const isRemoteUpdate = useRef(false);
const { setParticipants } = useParticipants();

const { code, setCode } = useEditor();

  // Store Monaco editor instance
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  // Join room when component loads
 useEffect(() => {
  const user = JSON.parse(localStorage.getItem("user"));

  socket.emit("join-room", {
    roomCode,
    user,
  });

  const handleLoadCode = (savedCode) => {
    if (savedCode) {
      setCode(savedCode);

      if (editorRef.current) {
        editorRef.current.setValue(savedCode);
      }
    }
  };

  const handleReceiveCode = (newCode) => {
    if (!editorRef.current) return;

    if (newCode !== editorRef.current.getValue()) {
      isRemoteUpdate.current = true;

      editorRef.current.setValue(newCode);
      setCode(newCode);

      isRemoteUpdate.current = false;
    }
  };

  const handleParticipants = (users) => {
    setParticipants(users);
  };

  socket.on("load-code", handleLoadCode);
  socket.on("receive-code", handleReceiveCode);
  socket.on("participants-update", handleParticipants);

  return () => {
    socket.off("load-code", handleLoadCode);
    socket.off("receive-code", handleReceiveCode);
    socket.off("participants-update", handleParticipants);
  };
}, [roomCode, setParticipants]);

  // Send updates while typing
  const handleEditorChange = (value) => {
    setCode(value);

    if (isRemoteUpdate.current) return;

    socket.emit("code-change", {
      roomCode,
      code: value,
    });
  };

  return (
    <Editor
  height="calc(100vh - 280px)"
  language={language}
  theme="vs-dark"
  value={code}
  onMount={handleEditorDidMount}
  onChange={handleEditorChange}
/>
  );
}