import { useEditor } from "@/features/editor/context/EditorContext";

const getStatusBadgeClass = (statusDescription) => {
  if (statusDescription === "Accepted") {
    return "bg-green-500/15 text-green-400 border-green-500/30";
  }

  if (statusDescription === "Compilation Error") {
    return "bg-red-500/15 text-red-400 border-red-500/30";
  }

  if (
    statusDescription?.includes("Runtime Error") ||
    statusDescription === "Time Limit Exceeded"
  ) {
    return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  }

  return "bg-slate-700/50 text-slate-300 border-slate-600";
};

const formatRuntime = (time) => {
  if (time === null || time === undefined) {
    return "—";
  }

  return `${time} s`;
};

const formatMemory = (memory) => {
  if (memory === null || memory === undefined) {
    return "—";
  }

  return `${memory} KB`;
};

export default function OutputPanel() {
  const { execution, isRunning } = useEditor();
  const { output, outputType, time, memory, status } = execution;

  const hasExecutionDetails =
    time !== null || memory !== null || status !== null;

  const outputClassName =
  outputType === "stdout"
    ? "text-green-400"
    : outputType === "compile_error"
    ? "text-red-500"
    : "text-amber-400";

  return (
    <div className="h-56 overflow-auto border-t border-slate-700 bg-black p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-bold text-white">Output</h2>

        {status && (
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(
              status.description
            )}`}
          >
            {status.description}
          </span>
        )}
      </div>

      {hasExecutionDetails && (
        <div className="mb-3 flex gap-4 text-xs text-slate-400">
          <span>Runtime: {formatRuntime(time)}</span>
          <span>Memory: {formatMemory(memory)}</span>
        </div>
      )}

      <pre className={`whitespace-pre-wrap font-mono text-sm ${outputClassName}`}>
        {isRunning ? "Running..." : output || "No output yet."}
      </pre>
    </div>
  );
}