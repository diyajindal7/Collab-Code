import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { useParams } from "react-router-dom";
import socket from "../socket";

export default function CodeEditor() {
  const { roomCode } = useParams();

  const editorRef = useRef(null);
  const isRemoteUpdate = useRef(false);

  const [code, setCode] = useState(`// Welcome to CollabCode 🚀

function hello() {
    console.log("Hello World");
}
`);

  // Store Monaco editor instance
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  // Join room when component loads
  useEffect(() => {
    socket.emit("join-room", roomCode);

    // Load saved code
    socket.on("load-code", (savedCode) => {
      if (savedCode) {
        setCode(savedCode);

        if (editorRef.current) {
          editorRef.current.setValue(savedCode);
        }
      }
    });

    // Receive code updates
    socket.on("receive-code", (newCode) => {
      if (!editorRef.current) return;

      if (newCode !== editorRef.current.getValue()) {
        isRemoteUpdate.current = true;

        editorRef.current.setValue(newCode);
        setCode(newCode);

        isRemoteUpdate.current = false;
      }
    });

    socket.on("user-joined", (data) => {
      console.log(data.message);
    });

    return () => {
      socket.off("load-code");
      socket.off("receive-code");
      socket.off("user-joined");
    };
  }, [roomCode]);

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
      height="85vh"
      theme="vs-dark"
      defaultLanguage="javascript"
      value={code}
      onMount={handleEditorDidMount}
      onChange={handleEditorChange}
    />
  );
}