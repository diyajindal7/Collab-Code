import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEditor } from "@/features/editor/context/EditorContext";
import socket from "@/features/editor/socket";

const defaultPairState = {
  enabled: false,
  locked: false,
  restrictEditing: true,
  startedAt: null,
  driver: null,
  navigator: null,
  pendingControlRequest: {
    from: null,
    requestedAt: null,
  },
  currentFile: null,
  openFiles: [],
  presence: {},
};

const getUserId = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?._id || user?.id || user?.userId;
};

export default function usePairProgramming(roomCode, openFile) {
  const navigate = useNavigate();
  const [pairState, setPairState] = useState(defaultPairState);
  const [workspaceStatus, setWorkspaceStatus] = useState("");
  const { resetEditor, setOpenFiles } = useEditor();

  useEffect(() => {
    const handlePairState = (state) => {
      setPairState({
        ...defaultPairState,
        ...state,
      });
    };

    const handlePairFileOpened = ({ file, openFiles: nextOpenFiles }) => {
      if (file) {
        openFile(file, {
          remote: true,
        });
      }

      if (Array.isArray(nextOpenFiles) && nextOpenFiles.length) {
        setOpenFiles(nextOpenFiles);
      }
    };

    const handleFileTreeChanged = () => {
      setWorkspaceStatus("Workspace updated");
    };

    const handleRoomRemoved = ({ message }) => {
      alert(message || "You were removed from the room.");
      resetEditor();
      navigate("/dashboard");
    };

    socket.on("pair:state", handlePairState);
    socket.on("pair:file-opened", handlePairFileOpened);
    socket.on("pair:file-tree-changed", handleFileTreeChanged);
    socket.on("room:removed", handleRoomRemoved);

    return () => {
      socket.off("pair:state", handlePairState);
      socket.off("pair:file-opened", handlePairFileOpened);
      socket.off("pair:file-tree-changed", handleFileTreeChanged);
      socket.off("room:removed", handleRoomRemoved);
    };
  }, [navigate, openFile, resetEditor, roomCode, setOpenFiles]);

  const requestControl = useCallback(() => {
    socket.emit("pair:request-control", {
      roomCode,
    });
  }, [roomCode]);

  const respondControl = useCallback(
    (accepted) => {
      socket.emit("pair:respond-control", {
        roomCode,
        accepted,
      });
    },
    [roomCode]
  );

  const assignRoles = useCallback(
    (driver, navigator) => {
      socket.emit("pair:assign-roles", {
        roomCode,
        driver,
        navigator,
      });
    },
    [roomCode]
  );

  const togglePairProgramming = useCallback(
    (enabled) => {
      socket.emit("pair:toggle", {
        roomCode,
        enabled,
      });
    },
    [roomCode]
  );

  const currentUserId = getUserId()?.toString();
  const pairDriverId = pairState.driver?.toString?.() || pairState.driver;
  const isNavigator =
    pairState.enabled &&
    pairState.restrictEditing !== false &&
    pairDriverId?.toString() !== currentUserId;

  return {
    pairState,
    setPairState,
    workspaceStatus,
    isNavigator,
    requestControl,
    respondControl,
    assignRoles,
    togglePairProgramming,
  };
}
