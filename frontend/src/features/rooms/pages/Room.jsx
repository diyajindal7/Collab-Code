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

export default function Room() {
  const { roomCode } = useParams();
  const [language, setLanguage] = useState("javascript");
  const { code, stdin, setOutput, setIsRunning } = useEditor();

  const handleRun = async () => {
    try {
      setIsRunning(true);

      const result = await runCode({
        source_code: code,
        language,
        stdin,
      });

      setOutput(
        result.compile_output ||
          result.stderr ||
          result.stdout ||
          result.message ||
          "No Output"
      );
    } catch (error) {
      console.error(error);
      setOutput("Execution Failed");
    } finally {
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