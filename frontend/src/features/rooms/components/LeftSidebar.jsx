import ChatPanel from "./ChatPanel";
import Participants from "./Participants";
import PairProgrammingPanel from "./PairProgrammingPanel";
import ContestPanel from "@/features/contests/components/ContestPanel";
import InterviewPanel from "@/features/interview/components/InterviewPanel";
import FileExplorer from "@/features/files/components/FileExplorer";

const leftPanels = [
  { id: "files", label: "Explorer", icon: "📁" },
  { id: "participants", label: "People", icon: "👥" },
  { id: "chat", label: "Chat", icon: "💬" },
  { id: "interview", label: "Interview", icon: "🎥" },
  { id: "pair", label: "Pair", icon: "🤝" },
  { id: "contest", label: "Contest", icon: "🏆" },
];

export default function LeftSidebar({
  activePanel,
  setActivePanel,
  width,
  onResizeStart,
  roomCode,
  currentFile,
  onOpenFile,
  interviewMode,
  interviewRole,
  interviewState,
  pairState,
  setPairState,
  contestState,
  isOwner,
}) {
  return (
    <aside
      className="relative flex min-h-0 shrink-0 border-r border-slate-800 bg-slate-950"
      style={{ width }}
    >
      <nav className="flex w-20 flex-col gap-2 border-r border-slate-800 p-2">
        {leftPanels.map((panel) => (
          <button
            key={panel.id}
            type="button"
            title={panel.label}
            className={`rounded-md px-2 py-2 text-xs font-medium transition-colors ${
              activePanel === panel.id
                ? "bg-blue-600 text-white"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
            onClick={() => setActivePanel(panel.id)}
          >
            <span className="block text-base leading-none">{panel.icon}</span>
            <span className="mt-1 block truncate">{panel.label}</span>
          </button>
        ))}
      </nav>

      <div className="h-full min-w-0 flex-1 overflow-hidden">
        {activePanel === "participants" ? (
          <Participants />
        ) : activePanel === "chat" ? (
          <ChatPanel />
        ) : activePanel === "interview" && interviewMode ? (
          <div className="h-full overflow-y-auto">
            <InterviewPanel
              roomCode={roomCode}
              role={interviewRole}
              initialState={interviewState}
            />
          </div>
        ) : activePanel === "pair" ? (
          <div className="h-full overflow-y-auto">
            <PairProgrammingPanel
              roomCode={roomCode}
              isOwner={isOwner}
              pairState={pairState}
              setPairState={setPairState}
            />
          </div>
        ) : activePanel === "contest" ? (
          <ContestPanel contestState={contestState} isOwner={isOwner} />
        ) : (
          <FileExplorer
            roomCode={roomCode}
            selectedFile={currentFile?._id}
            onOpenFile={onOpenFile}
          />
        )}
      </div>

      <div
        aria-label="Resize left sidebar"
        role="separator"
        tabIndex={0}
        className="absolute right-0 top-0 z-20 h-full w-1 cursor-col-resize bg-transparent transition-colors hover:bg-blue-500/70"
        onMouseDown={onResizeStart}
      />
    </aside>
  );
}
