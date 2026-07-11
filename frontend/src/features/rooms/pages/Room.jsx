import { useState } from "react";
import { useParams } from "react-router-dom";
import { useEditor } from "@/features/editor/context/EditorContext";
import { runCode } from "@/features/editor/services/judge0Service";
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

  const message =
    error.response?.data?.message ||
    error.message ||
    "Execution Failed";

  setExecution({
    output: message,
    outputType: "stderr",
    time: null,
    memory: null,
    status: null,
  });
}
     finally {
      setIsRunning(false);
    }
  };

  return (
    <ParticipantsProvider>
      <ChatProvider>
        <div className="flex h-screen flex-col bg-slate-950">
          <Toolbar
            language={language}
            setLanguage={setLanguage}
            onRun={handleRun}
            roomCode={roomCode}
            isRunning={isRunning}
          />

          <div className="flex flex-1">
            <div className="flex-1">
              <CodeEditor language={language} />
              <InputPanel />
              <OutputPanel />
            </div>

            <div className="flex w-72 flex-col border-l border-slate-700">
              <Participants />

              <div className="flex-1 border-t border-slate-700">
                <ChatPanel />
              </div>
            </div>
          </div>
        </div>
      </ChatProvider>
    </ParticipantsProvider>
  );
}