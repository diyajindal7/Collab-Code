import { useCallback, useState } from "react";
import { useEditor } from "@/features/editor/context/EditorContext";
import { runCode as executeCode } from "@/features/editor/services/judge0Service";
import { getExecutionHistory } from "../services/executionService";

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

export default function useExecution(roomCode, language) {
  const [executions, setExecutions] = useState([]);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const {
    code,
    stdin,
    execution,
    isRunning,
    setExecution,
    setIsRunning,
  } = useEditor();

  const reloadHistory = useCallback(async () => {
    try {
      const data = await getExecutionHistory(roomCode);
      setExecutions(data.executions || []);
    } catch (error) {
      console.error(error);
    }
  }, [roomCode]);

  const runCode = useCallback(async () => {
    if (isRunning) return;

    try {
      setIsRunning(true);
      const result = await executeCode({
        source_code: code,
        language,
        stdin,
        roomCode,
      });

      setExecution(normalizeExecution(result));
      reloadHistory();
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
  }, [
    code,
    isRunning,
    language,
    reloadHistory,
    roomCode,
    setExecution,
    setIsRunning,
    stdin,
  ]);

  return {
    executions,
    execution,
    isRunning,
    selectedExecution,
    setSelectedExecution,
    runCode,
    reloadHistory,
  };
}
