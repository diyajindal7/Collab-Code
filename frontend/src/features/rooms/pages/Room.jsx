import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useEditor } from "@/features/editor/context/EditorContext";
import { runCode } from "@/features/editor/services/judge0Service";
import AiAssistantPanel from "@/features/ai/components/AiAssistantPanel";
import Toolbar from "../components/Toolbar";
import Participants from "../components/Participants";
import InputPanel from "../components/InputPanel";
import OutputPanel from "../components/OutputPanel";
import ChatPanel from "../components/ChatPanel";
import { ChatProvider } from "@/features/chat/context/ChatContext";
import CodeEditor from "@/features/editor/components/CodeEditor";
import { ParticipantsProvider } from "../context/ParticipantsContext";

const normalizeExecution = (result) => {
  let output = "No Output";
  let outputType = "stdout";

  if (result.compile_output) {
    output = result.compile_output;
    outputType = "compile_error";
  } else if (result.stderr) {
    output = result.stderr;
    outputType = "stderr";
  } else if (result.stdout) {
    output = result.stdout;
  } else if (result.message) {
    output = result.message;
    outputType = "stderr";
  }

  return {
    output,
    outputType,
    time: result.time || null,
    memory: result.memory ?? null,
    status: result.status
      ? {
          id: result.status.id,
          description: result.status.description,
        }
      : null,
  };
};

export default function Room() {
  const { roomCode } = useParams();
  const [language, setLanguage] = useState("javascript");
  const [selectedCode, setSelectedCode] = useState("");
  const [editorWidth, setEditorWidth] = useState(70);
  const [showAiPanel, setShowAiPanel] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const splitContainerRef = useRef(null);

  const {
    code,
    stdin,
    isRunning,
    setExecution,
    setIsRunning,
  } = useEditor();

  const handleRun = async () => {
    if (isRunning) {
      return;
    }

    try {
      setIsRunning(true);

      const result = await runCode({
        source_code: code,
        language,
        stdin,
      });

      setExecution(normalizeExecution(result));
    } catch (error) {
      console.error(error);

      setExecution({
        output:
          error.response?.data?.message ||
          error.message ||
          "Execution Failed",
        outputType: "stderr",
        time: null,
        memory: null,
        status: null,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleResizeStart = (event) => {
    event.preventDefault();

    const handleResize = (event) => {
      if (!splitContainerRef.current) return;

      const containerRect = splitContainerRef.current.getBoundingClientRect();
      const nextWidth =
        ((event.clientX - containerRect.left) / containerRect.width) * 100;

      setEditorWidth(Math.min(85, Math.max(40, nextWidth)));
    };

    const handleResizeEnd = () => {
      window.removeEventListener("mousemove", handleResize);
      window.removeEventListener("mouseup", handleResizeEnd);
    };

    window.addEventListener("mousemove", handleResize);
    window.addEventListener("mouseup", handleResizeEnd);
  };

  return (
    <ParticipantsProvider>
      <ChatProvider>
        <div className="flex h-screen flex-col overflow-hidden bg-slate-950">
          <Toolbar
            language={language}
            setLanguage={setLanguage}
            onRun={handleRun}
            roomCode={roomCode}
            isRunning={isRunning}
          />

          <div
            ref={splitContainerRef}
            className="flex min-h-0 flex-1 overflow-hidden"
          >
            <div
              className="flex min-h-0 min-w-0 overflow-hidden transition-all duration-300"
              style={{ width: showAiPanel ? `${editorWidth}%` : "100%" }}
            >
              <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
                <CodeEditor
                  language={language}
                  onSelectionChange={setSelectedCode}
                />
                <InputPanel />
                <OutputPanel />
              </div>

              {showSidebar ? (
                <div className="relative flex min-h-0 w-72 shrink-0 flex-col border-l border-slate-700 transition-all duration-300">
                  <button
                    type="button"
                    className="absolute left-0 top-1/2 z-10 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-800 text-white shadow-lg transition-all duration-300 hover:bg-blue-600"
                    onClick={() => setShowSidebar(false)}
                    aria-label="Collapse participants and chat sidebar"
                  >
                    {"<"}
                  </button>

                  <Participants />

                  <div className="min-h-0 flex-1 border-t border-slate-700">
                    <ChatPanel />
                  </div>
                </div>
              ) : (
                <div className="relative flex w-2 shrink-0 items-center justify-center border-l border-slate-700 bg-slate-900 transition-all duration-300">
                  <button
                    type="button"
                    className="absolute left-1/2 top-1/2 z-10 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-800 text-white shadow-lg transition-all duration-300 hover:bg-blue-600"
                    onClick={() => setShowSidebar(true)}
                    aria-label="Expand participants and chat sidebar"
                  >
                    {">"}
                  </button>
                </div>
              )}
            </div>

            {showAiPanel ? (
              <>
                <div
                  className="group relative flex w-2 cursor-col-resize items-center justify-center bg-slate-800 transition-all duration-300 hover:bg-blue-500"
                  onMouseDown={handleResizeStart}
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="Resize editor and AI panels"
                >
                  <div className="h-10 w-1 rounded-full bg-slate-500 group-hover:bg-white" />
                  <button
                    type="button"
                    className="absolute left-1/2 top-1/2 z-10 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-800 text-white shadow-lg transition-all duration-300 hover:bg-blue-600"
                    onClick={() => setShowAiPanel(false)}
                    aria-label="Collapse AI panel"
                  >
                    {"<"}
                  </button>
                </div>

                <div
                  className="flex min-h-0 min-w-0 flex-col overflow-y-auto border-l border-slate-700 transition-all duration-300"
                  style={{ width: `${100 - editorWidth}%` }}
                >
                  <AiAssistantPanel
                    language={language}
                    selectedCode={selectedCode}
                  />
                </div>
              </>
            ) : (
              <div className="relative flex w-2 shrink-0 items-center justify-center border-l border-slate-700 bg-slate-900 transition-all duration-300">
                <button
                  type="button"
                  className="absolute left-1/2 top-1/2 z-10 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-800 text-white shadow-lg transition-all duration-300 hover:bg-blue-600"
                  onClick={() => setShowAiPanel(true)}
                  aria-label="Expand AI panel"
                >
                  {">"}
                </button>
              </div>
            )}
          </div>
        </div>
      </ChatProvider>
    </ParticipantsProvider>
  );
}