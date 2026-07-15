import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { useParams } from "react-router-dom";
import socket from "../socket";
import { useParticipants } from "@/features/rooms/context/ParticipantsContext";
import { useEditor } from "../context/EditorContext";

export default function CodeEditor({
  language,
  onSelectionChange = () => {},
}) {
  const { roomCode } = useParams();

  const editorRef = useRef(null);
  const isRemoteUpdate = useRef(false);
  const userRef = useRef(null);
  const roomCodeRef = useRef(roomCode);
  const cursorPositionDisposableRef = useRef(null);
  const cursorThrottleTimeoutRef = useRef(null);
  const lastCursorEmitRef = useRef(0);
  const lastCursorLeaveRef = useRef(null);
  const cursorWidgetsRef = useRef({});
  const cursorColorsRef = useRef({});
  const [remoteCursors, setRemoteCursors] = useState({});

  const { setParticipants } = useParticipants();
  const { code, setCode } = useEditor();

  const getCursorColor = (userId) => {
    if (cursorColorsRef.current[userId]) {
      return cursorColorsRef.current[userId];
    }

    const colors = [
      "#38bdf8",
      "#f472b6",
      "#a78bfa",
      "#34d399",
      "#facc15",
      "#fb7185",
      "#60a5fa",
      "#c084fc",
    ];

    const colorIndex = String(userId)
      .split("")
      .reduce((total, character) => total + character.charCodeAt(0), 0) % colors.length;

    cursorColorsRef.current[userId] = colors[colorIndex];
    return cursorColorsRef.current[userId];
  };

  const createCursorWidget = ({ userId, username, position }) => {
    const color = getCursorColor(userId);
    const domNode = document.createElement("div");
    domNode.className = "remote-cursor-widget";
    domNode.style.pointerEvents = "none";
    domNode.style.position = "relative";
    domNode.style.zIndex = "20";

    const nameNode = document.createElement("div");
    nameNode.textContent = username || "Anonymous";
    nameNode.style.position = "absolute";
    nameNode.style.bottom = "2px";
    nameNode.style.left = "0";
    nameNode.style.padding = "2px 6px";
    nameNode.style.borderRadius = "4px";
    nameNode.style.background = color;
    nameNode.style.color = "#020617";
    nameNode.style.fontSize = "11px";
    nameNode.style.fontWeight = "600";
    nameNode.style.lineHeight = "14px";
    nameNode.style.whiteSpace = "nowrap";
    nameNode.style.transform = "translateY(-100%)";

    const cursorNode = document.createElement("div");
    cursorNode.style.width = "2px";
    cursorNode.style.height = "18px";
    cursorNode.style.background = color;

    domNode.appendChild(nameNode);
    domNode.appendChild(cursorNode);

    return {
      getId: () => `remote-cursor-${userId}`,
      getDomNode: () => domNode,
      getPosition: () => ({
        position,
        preference: [0],
      }),
    };
  };

  const emitCursorMove = () => {
    if (!editorRef.current || !userRef.current) return;

    const position = editorRef.current.getPosition();
    const userId = userRef.current._id || userRef.current.id;
    const username = userRef.current.username || userRef.current.name;

    if (!position || !position.lineNumber || !position.column || !userId) {
      return;
    }

    socket.emit("cursor:move", {
      roomId: roomCodeRef.current,
      userId,
      username,
      position,
    });

    lastCursorEmitRef.current = Date.now();
  };

  const scheduleCursorMove = () => {
    const elapsed = Date.now() - lastCursorEmitRef.current;

    if (elapsed >= 40) {
      emitCursorMove();
      return;
    }

    if (cursorThrottleTimeoutRef.current) {
      clearTimeout(cursorThrottleTimeoutRef.current);
    }

    cursorThrottleTimeoutRef.current = setTimeout(() => {
      cursorThrottleTimeoutRef.current = null;
      emitCursorMove();
    }, 40 - elapsed);
  };

  const emitCursorLeave = () => {
    if (!userRef.current) return;

    const userId = userRef.current._id || userRef.current.id;
    const roomId = roomCodeRef.current;

    if (!roomId || !userId) return;

    const leaveKey = `${roomId}:${userId}`;

    if (lastCursorLeaveRef.current === leaveKey) return;

    socket.emit("cursor:leave", {
      roomId,
      userId,
    });

    lastCursorLeaveRef.current = leaveKey;
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;

    editor.onDidChangeCursorSelection((event) => {
      const model = editor.getModel();

      if (!model || event.selection.isEmpty()) {
        onSelectionChange("");
        return;
      }

      onSelectionChange(model.getValueInRange(event.selection));
    });

    if (cursorPositionDisposableRef.current) {
      cursorPositionDisposableRef.current.dispose();
    }

    cursorPositionDisposableRef.current =
      editor.onDidChangeCursorPosition(scheduleCursorMove);
  };

  useEffect(() => {
    roomCodeRef.current = roomCode;
  }, [roomCode]);

  useEffect(() => {
    return () => {
      emitCursorLeave();

      if (cursorThrottleTimeoutRef.current) {
        clearTimeout(cursorThrottleTimeoutRef.current);
      }

      if (cursorPositionDisposableRef.current) {
        cursorPositionDisposableRef.current.dispose();
      }

      if (editorRef.current) {
        Object.values(cursorWidgetsRef.current).forEach((widget) => {
          editorRef.current.removeContentWidget(widget);
        });
      }
    };
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;

    Object.entries(cursorWidgetsRef.current).forEach(([userId, widget]) => {
      if (!remoteCursors[userId]) {
        editorRef.current.removeContentWidget(widget);
        delete cursorWidgetsRef.current[userId];
      }
    });

    Object.values(remoteCursors).forEach((cursor) => {
      if (
        !cursor.position ||
        !cursor.position.lineNumber ||
        !cursor.position.column
      ) {
        return;
      }

      if (cursorWidgetsRef.current[cursor.userId]) {
        editorRef.current.removeContentWidget(
          cursorWidgetsRef.current[cursor.userId]
        );
      }

      const widget = createCursorWidget(cursor);
      cursorWidgetsRef.current[cursor.userId] = widget;
      editorRef.current.addContentWidget(widget);
    });
  }, [remoteCursors]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    userRef.current = user;
    lastCursorLeaveRef.current = null;

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

   const handleCursorMove = ({ userId, username, position }) => {
  setRemoteCursors((currentCursors) => ({
    ...currentCursors,
    [userId]: {
      userId,
      username,
      position,
    },
  }));
};

    const handleCursorLeave = ({ userId }) => {
      setRemoteCursors((currentCursors) => {
        const updatedCursors = { ...currentCursors };
        delete updatedCursors[userId];
        return updatedCursors;
      });
    };

    socket.on("load-code", handleLoadCode);
    socket.on("receive-code", handleReceiveCode);
    socket.on("participants-update", handleParticipants);
    socket.on("cursor:move", handleCursorMove);
    socket.on("cursor:leave", handleCursorLeave);

    return () => {
      emitCursorLeave();

      socket.off("load-code", handleLoadCode);
      socket.off("receive-code", handleReceiveCode);
      socket.off("participants-update", handleParticipants);
      socket.off("cursor:move", handleCursorMove);
      socket.off("cursor:leave", handleCursorLeave);
    };
  }, [roomCode, setParticipants]);

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






