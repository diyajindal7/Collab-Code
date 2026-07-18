import { useEffect, useState } from "react";
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
import useExecution from "../hooks/useExecution";
import useInterview from "../hooks/useInterview";
import usePairProgramming from "../hooks/usePairProgramming";
import useRecording from "../hooks/useRecording";
import useRoomSettings from "../hooks/useRoomSettings";
import useWorkspace from "../hooks/useWorkspace";
import { useEditor } from "@/features/editor/context/EditorContext";

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
    workspace.openFile(...args)
  );
  const workspace = useWorkspace(
    roomCode,
    language,
    setLanguage,
    pair.pairState
  );
  const execution = useExecution(roomCode, language);

  useEffect(() => {
    execution.reloadHistory();
  }, [execution.reloadHistory]);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }
  }, [roomCode]);

  const handleLeaveRoom = () => {
    recording.stopRecording();
    resetEditor();

    if (socket.connected) {
      socket.disconnect();
    }

    navigate("/dashboard");
  };

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
              roomCode={roomCode}
              currentFile={workspace.currentFile}
              onOpenFile={workspace.openFile}
              interviewMode={interviewMode}
              interviewRole={interview.interviewRole}
              interviewState={interviewPanelState}
              pairState={pair.pairState}
              setPairState={pair.setPairState}
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
            />
          }
          rightSidebar={
            <RightSidebar
              isOpen={showAiPanel}
              setIsOpen={setShowAiPanel}
              language={language}
              selectedCode={selectedCode}
            />
          }
        />
      </ChatProvider>
    </ParticipantsProvider>
  );
}
