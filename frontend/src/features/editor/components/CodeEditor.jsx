import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { useParams } from "react-router-dom";
import socket from "../socket";
import { useParticipants } from "@/features/rooms/context/ParticipantsContext";
import { useEditor } from "../context/EditorContext";

export default function CodeEditor({
  language,
  onSelectionChange = () => {},
  readOnly = false,
  pairEnabled = false,
  followTarget = "",
  currentFile = null,
  openFiles = [],
}) {
  const { roomCode } = useParams();

  const editorRef = useRef(null);
  const isRemoteUpdate = useRef(false);
  const userRef = useRef(null);
  const roomCodeRef = useRef(roomCode);
  const cursorPositionDisposableRef = useRef(null);
  const scrollDisposableRef = useRef(null);
  const cursorThrottleTimeoutRef = useRef(null);
  const followThrottleTimeoutRef = useRef(null);
  const lastCursorEmitRef = useRef(0);
  const lastCursorLeaveRef = useRef(null);
  const cursorWidgetsRef = useRef({});
  const cursorColorsRef = useRef({});
  const selectionDecorationsRef = useRef({});
  const selectionStylesRef = useRef({});
  const [remoteCursors, setRemoteCursors] = useState({});
  const [remoteSelections, setRemoteSelections] = useState({});

  const { setParticipants } = useParticipants();
  const { code, setCode } = useEditor();

  const emitPairFollowUpdate = () => {
    if (!editorRef.current || !userRef.current || !pairEnabled) return;

    socket.emit("pair:follow:update", {
      roomCode,
      payload: {
        currentFile: currentFile?._id || currentFile?.id || null,
        openFiles: openFiles.map((file) => file._id || file.id).filter(Boolean),
        position: editorRef.current.getPosition(),
        scrollTop: editorRef.current.getScrollTop(),
      },
    });
  };

  const schedulePairFollowUpdate = () => {
    if (followThrottleTimeoutRef.current) return;

    followThrottleTimeoutRef.current = setTimeout(() => {
      followThrottleTimeoutRef.current = null;
      emitPairFollowUpdate();
    }, 120);
  };

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

  const getSelectionClassName = (userId) => {
    const className = `remote-selection-${String(userId).replace(/[^a-zA-Z0-9]/g, "-")}`;

    if (selectionStylesRef.current[userId]) {
      return className;
    }

    const color = getCursorColor(userId);
    const styleNode = document.createElement("style");
    styleNode.textContent = `
      .${className} {
        background-color: ${color}55;
      }
    `;

    document.head.appendChild(styleNode);
    selectionStylesRef.current[userId] = styleNode;

    return className;
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

  const emitSelectionChange = (selection) => {
    if (!userRef.current) return;

    const userId = userRef.current._id || userRef.current.id;
    const username = userRef.current.username || userRef.current.name;
    const roomId = roomCodeRef.current;

    if (!roomId || !userId || !selection) return;

    socket.emit("selection:change", {
      roomId,
      userId,
      username,
      selection,
    });
  };

  const emitSelectionClear = () => {
    if (!userRef.current) return;

    const userId = userRef.current._id || userRef.current.id;
    const roomId = roomCodeRef.current;

    if (!roomId || !userId) return;

    socket.emit("selection:clear", {
      roomId,
      userId,
    });
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;

    editor.onDidChangeCursorSelection((event) => {
      const model = editor.getModel();

      if (!model || event.selection.isEmpty()) {
        onSelectionChange("");
        emitSelectionClear();
        return;
      }

      onSelectionChange(model.getValueInRange(event.selection));
      emitSelectionChange(event.selection);
    });

    if (cursorPositionDisposableRef.current) {
      cursorPositionDisposableRef.current.dispose();
    }

    cursorPositionDisposableRef.current =
      editor.onDidChangeCursorPosition(scheduleCursorMove);

    if (scrollDisposableRef.current) {
      scrollDisposableRef.current.dispose();
    }

    scrollDisposableRef.current = editor.onDidScrollChange(
      schedulePairFollowUpdate
    );
    editor.updateOptions({
      readOnly,
      readOnlyMessage: {
        value: "Navigator is read-only. Request control to edit.",
      },
    });
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

      if (followThrottleTimeoutRef.current) {
        clearTimeout(followThrottleTimeoutRef.current);
      }

      if (cursorPositionDisposableRef.current) {
        cursorPositionDisposableRef.current.dispose();
      }

      if (scrollDisposableRef.current) {
        scrollDisposableRef.current.dispose();
      }

      if (editorRef.current) {
        Object.values(cursorWidgetsRef.current).forEach((widget) => {
          editorRef.current.removeContentWidget(widget);
        });

        Object.values(selectionDecorationsRef.current).forEach((decorationIds) => {
          editorRef.current.deltaDecorations(decorationIds, []);
        });
      }

      Object.values(selectionStylesRef.current).forEach((styleNode) => {
        styleNode.remove();
      });
    };
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;

    editorRef.current.updateOptions({
      readOnly,
      readOnlyMessage: {
        value: "Navigator is read-only. Request control to edit.",
      },
    });
  }, [readOnly]);

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
    if (!editorRef.current) return;

    Object.entries(selectionDecorationsRef.current).forEach(
      ([userId, decorationIds]) => {
        if (!remoteSelections[userId]) {
          editorRef.current.deltaDecorations(decorationIds, []);
          delete selectionDecorationsRef.current[userId];
        }
      }
    );

    Object.values(remoteSelections).forEach(({ userId, selection }) => {
      if (
        !selection ||
        !selection.startLineNumber ||
        !selection.startColumn ||
        !selection.endLineNumber ||
        !selection.endColumn
      ) {
        return;
      }

      const className = getSelectionClassName(userId);
      const currentDecorations = selectionDecorationsRef.current[userId] || [];

      selectionDecorationsRef.current[userId] =
        editorRef.current.deltaDecorations(currentDecorations, [
          {
            range: selection,
            options: {
                 className: className,
            },
          },
        ]);
    });
  }, [remoteSelections]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    userRef.current = user;
    lastCursorLeaveRef.current = null;

    if (!socket.connected) {
      socket.connect();
    }

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

    const handleSelectionChange = ({ userId, username, selection }) => {
      setRemoteSelections((currentSelections) => ({
        ...currentSelections,
        [userId]: {
          userId,
          username,
          selection,
        },
      }));
    };

    const handleSelectionClear = ({ userId }) => {
      setRemoteSelections((currentSelections) => {
        const updatedSelections = { ...currentSelections };
        delete updatedSelections[userId];
        return updatedSelections;
      });
    };

    const handlePairFollowUpdate = ({ userId, payload }) => {
      if (!editorRef.current || !payload) return;
      if (!followTarget || userId?.toString() !== followTarget?.toString()) return;

      if (payload.position) {
        editorRef.current.revealPositionInCenterIfOutsideViewport(
          payload.position
        );
      }

      if (typeof payload.scrollTop === "number") {
        editorRef.current.setScrollTop(payload.scrollTop);
      }
    };

    socket.on("load-code", handleLoadCode);
    socket.on("receive-code", handleReceiveCode);
    socket.on("participants-update", handleParticipants);
    socket.on("cursor:move", handleCursorMove);
    socket.on("cursor:leave", handleCursorLeave);
    socket.on("selection:change", handleSelectionChange);
    socket.on("selection:clear", handleSelectionClear);
    socket.on("pair:follow:update", handlePairFollowUpdate);

    return () => {
      emitCursorLeave();

      socket.off("load-code", handleLoadCode);
      socket.off("receive-code", handleReceiveCode);
      socket.off("participants-update", handleParticipants);
      socket.off("cursor:move", handleCursorMove);
      socket.off("cursor:leave", handleCursorLeave);
      socket.off("selection:change", handleSelectionChange);
      socket.off("selection:clear", handleSelectionClear);
      socket.off("pair:follow:update", handlePairFollowUpdate);
    };
  }, [roomCode, setParticipants, followTarget]);

  const handleEditorChange = (value) => {
    if (isRemoteUpdate.current) {
      setCode(value);
      return;
    }

    if (readOnly) return;

    setCode(value);

    if (pairEnabled) {
      socket.emit("pair:presence", {
        roomCode,
        status: {
          activity: "typing",
          currentFile: currentFile?._id || currentFile?.id || null,
          currentFileName: currentFile?.name || "",
        },
      });
    }

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
