import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import socket from "@/features/editor/socket";
import { ChatProvider } from "@/features/chat/context/ChatContext";
import { ParticipantsProvider } from "../context/ParticipantsContext";
import BottomPanel from "../components/BottomPanel";
import LeftSidebar from "../components/LeftSidebar";
import RightSidebar from "../components/RightSidebar";
import RoomLayout from "../components/RoomLayout";
import RoomSettingsModal from "../components/RoomSettingsModal";
import TopNavbar from "../components/TopNavbar";
import Workspace from "../components/Workspace";
import useContest from "@/features/contests/hooks/useContest";
import useExecution from "../hooks/useExecution";
import useInterview from "../hooks/useInterview";
import usePairProgramming from "../hooks/usePairProgramming";
import useRecording from "../hooks/useRecording";
import useRoomSettings from "../hooks/useRoomSettings";
import useWorkspace from "../hooks/useWorkspace";
import { useEditor } from "@/features/editor/context/EditorContext";

const LEFT_PANEL_STORAGE_KEY = "collabcode:left-sidebar-width";
const RIGHT_PANEL_STORAGE_KEY = "collabcode:right-sidebar-width";
const LEFT_PANEL_MIN_WIDTH = 240;
const LEFT_PANEL_MAX_WIDTH = 500;
const RIGHT_PANEL_MIN_WIDTH = 280;
const RIGHT_PANEL_MAX_WIDTH = 600;

const getStoredPanelWidth = (key, fallback, min, max) => {
  const storedWidth = Number(localStorage.getItem(key));

  if (!Number.isFinite(storedWidth)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, storedWidth));
};

export default function Room() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { resetEditor } = useEditor();
  const [language, setLanguage] = useState("javascript");
  const [selectedCode, setSelectedCode] = useState("");
  const [showAiPanel, setShowAiPanel] = useState(true);
  const [interviewMode, setInterviewMode] = useState(true);
  const [activeLeftPanel, setActiveLeftPanel] = useState("files");
  const [activeBottomTab, setActiveBottomTab] = useState("output");
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(true);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(() =>
    getStoredPanelWidth(
      LEFT_PANEL_STORAGE_KEY,
      368,
      LEFT_PANEL_MIN_WIDTH,
      LEFT_PANEL_MAX_WIDTH
    )
  );
  const [rightSidebarWidth, setRightSidebarWidth] = useState(() =>
    getStoredPanelWidth(
      RIGHT_PANEL_STORAGE_KEY,
      320,
      RIGHT_PANEL_MIN_WIDTH,
      RIGHT_PANEL_MAX_WIDTH
    )
  );
  const openFileRef = useRef(null);
  const resizeFrameRef = useRef(null);

  const recording = useRecording(roomCode);
  const interview = useInterview(roomCode, recording.stopRecording);
  const settings = useRoomSettings(roomCode, {
    setLanguage,
    setInterviewMode,
    setInterviewStatus: interview.setInterviewStatus,
    setDuration: interview.setDuration,
    setTimeRemaining: interview.setTimeRemaining,
  });
  const pair = usePairProgramming(roomCode, (...args) =>
    openFileRef.current?.(...args)
  );
  const workspace = useWorkspace(
    roomCode,
    language,
    setLanguage,
    pair.pairState
  );
  const execution = useExecution(roomCode, language);
  const contest = useContest(roomCode, language);

  useEffect(() => {
    openFileRef.current = workspace.openFile;
  }, [workspace.openFile]);

  useEffect(() => {
    execution.reloadHistory();
  }, [execution.reloadHistory]);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }
  }, [roomCode]);

  useEffect(
    () => () => {
      if (resizeFrameRef.current) {
        window.cancelAnimationFrame(resizeFrameRef.current);
      }

      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    },
    []
  );

  const handleLeaveRoom = () => {
    recording.stopRecording();
    resetEditor();

    if (socket.connected) {
      socket.disconnect();
    }

    navigate("/dashboard");
  };

  const startPanelResize = useCallback(
    ({ event, side }) => {
      event.preventDefault();

      const startX = event.clientX;
      const startingWidth =
        side === "left" ? leftSidebarWidth : rightSidebarWidth;
      const minWidth =
        side === "left" ? LEFT_PANEL_MIN_WIDTH : RIGHT_PANEL_MIN_WIDTH;
      const maxWidth =
        side === "left" ? LEFT_PANEL_MAX_WIDTH : RIGHT_PANEL_MAX_WIDTH;
      const storageKey =
        side === "left" ? LEFT_PANEL_STORAGE_KEY : RIGHT_PANEL_STORAGE_KEY;
      const updateWidth =
        side === "left" ? setLeftSidebarWidth : setRightSidebarWidth;

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const handleMouseMove = (moveEvent) => {
        const delta =
          side === "left"
            ? moveEvent.clientX - startX
            : startX - moveEvent.clientX;
        const nextWidth = Math.min(
          maxWidth,
          Math.max(minWidth, startingWidth + delta)
        );

        if (resizeFrameRef.current) {
          window.cancelAnimationFrame(resizeFrameRef.current);
        }

        resizeFrameRef.current = window.requestAnimationFrame(() => {
          updateWidth(nextWidth);
        });
      };

      const handleMouseUp = (upEvent) => {
        const delta =
          side === "left"
            ? upEvent.clientX - startX
            : startX - upEvent.clientX;
        const finalWidth = Math.min(
          maxWidth,
          Math.max(minWidth, startingWidth + delta)
        );

        if (resizeFrameRef.current) {
          window.cancelAnimationFrame(resizeFrameRef.current);
          resizeFrameRef.current = null;
        }

        updateWidth(finalWidth);
        localStorage.setItem(storageKey, String(finalWidth));
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [leftSidebarWidth, rightSidebarWidth]
  );

  const interviewPanelState = {
    status: interview.interviewState?.status || interview.interviewStatus,
    duration: interview.interviewState?.duration || interview.duration,
    startedAt: interview.interviewState?.startedAt || null,
    pausedAt: interview.interviewState?.pausedAt || null,
    totalPausedMs: interview.interviewState?.totalPausedMs || 0,
    notes: interview.interviewState?.notes || "",
    evaluation: interview.interviewState?.evaluation,
    question: interview.interviewState?.question,
  };

  return (
    <ParticipantsProvider>
      <ChatProvider>
        <RoomLayout
          navbar={
            <TopNavbar
              language={language}
              setLanguage={setLanguage}
              onRun={execution.runCode}
              roomCode={roomCode}
              isRunning={execution.isRunning}
              onLeaveRoom={handleLeaveRoom}
              onOpenSettings={() => settings.setShowSettings(true)}
            />
          }
          modal={<RoomSettingsModal settings={settings} />}
          leftSidebar={
            <LeftSidebar
              activePanel={activeLeftPanel}
              setActivePanel={setActiveLeftPanel}
              width={leftSidebarWidth}
              onResizeStart={(event) =>
                startPanelResize({
                  event,
                  side: "left",
                })
              }
              roomCode={roomCode}
              currentFile={workspace.currentFile}
              onOpenFile={workspace.openFile}
              interviewMode={interviewMode}
              interviewRole={interview.interviewRole}
              interviewState={interviewPanelState}
              pairState={pair.pairState}
              setPairState={pair.setPairState}
              contestState={contest}
              isOwner={settings.isOwner}
            />
          }
          workspace={
            <Workspace
              language={language}
              selectedCode={selectedCode}
              setSelectedCode={setSelectedCode}
              currentFile={workspace.currentFile}
              openFiles={workspace.openFiles}
              dirtyFiles={workspace.dirtyFiles}
              saveStatus={pair.workspaceStatus || workspace.saveStatus}
              isRunning={execution.isRunning}
              onRun={execution.runCode}
              onOpenFile={workspace.openFile}
              onCloseTab={workspace.closeFile}
              isPairNavigator={pair.isNavigator}
              pairState={pair.pairState}
            />
          }
          bottomPanel={
            <BottomPanel
              activeTab={activeBottomTab}
              setActiveTab={setActiveBottomTab}
              isOpen={isBottomPanelOpen}
              setIsOpen={setIsBottomPanelOpen}
              executions={execution.executions}
              selectedExecution={execution.selectedExecution}
              setSelectedExecution={execution.setSelectedExecution}
              loadExecutionHistory={execution.reloadHistory}
              interviewState={interview.interviewState}
              contestState={contest}
            />
          }
          rightSidebar={
            <RightSidebar
              isOpen={showAiPanel}
              setIsOpen={setShowAiPanel}
              width={rightSidebarWidth}
              onResizeStart={(event) =>
                startPanelResize({
                  event,
                  side: "right",
                })
              }
              language={language}
              selectedCode={selectedCode}
            />
          }
        />
      </ChatProvider>
    </ParticipantsProvider>
  );
}
