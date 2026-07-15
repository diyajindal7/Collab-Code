import { useState } from "react";
import { useParams } from "react-router-dom";
import { useEditor } from "@/features/editor/context/EditorContext";
import { runCode } from "@/features/editor/services/judge0Service";
import CodeReviewPanel from "@/features/ai/components/CodeReviewPanel";
import CodeExplainPanel from "@/features/ai/components/CodeExplainPanel";
import CodeFixPanel from "@/features/ai/components/CodeFixPanel";
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

          <div className="flex min-h-0 flex-1 overflow-hidden">
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
              <CodeEditor
                language={language}
                onSelectionChange={setSelectedCode}
              />
              <InputPanel />
              <OutputPanel />
            </div>

            <div className="flex min-h-0 w-72 shrink-0 flex-col border-l border-slate-700">
              <Participants />

              <div className="min-h-0 flex-1 border-t border-slate-700">
                <ChatPanel />
              </div>
            </div>

            <div className="flex min-h-0 w-96 shrink-0 flex-col overflow-y-auto border-l border-slate-700">
              <CodeReviewPanel
                language={language}
                selectedCode={selectedCode}
              />
              <CodeExplainPanel
                language={language}
                selectedCode={selectedCode}
              />
              <CodeFixPanel
                language={language}
                selectedCode={selectedCode}
              />
            </div>
          </div>
        </div>
      </ChatProvider>
    </ParticipantsProvider>
  );
}
