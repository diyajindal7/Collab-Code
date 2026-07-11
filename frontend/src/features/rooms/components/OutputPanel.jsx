import { useEditor } from "@/features/editor/context/EditorContext";

export default function OutputPanel() {
  const { output, isRunning } = useEditor();

  return (
    <div className="h-56 overflow-auto border-t border-slate-700 bg-black p-4 text-green-400">
      <h2 className="mb-3 font-bold text-white">Output</h2>

      <pre className="whitespace-pre-wrap">
        {isRunning ? "Running..." : output || "No output yet."}
      </pre>
    </div>
  );
}