import { useEditor } from "@/features/editor/context/EditorContext";

export default function InputPanel() {
  const { stdin, setStdin } = useEditor();

  return (
    <div className="border-t border-slate-700 bg-slate-950 p-4">
      <label
        htmlFor="custom-input"
        className="mb-2 block text-sm font-bold text-white"
      >
        Custom Input
      </label>

      <textarea
        id="custom-input"
        value={stdin}
        onChange={(event) => setStdin(event.target.value)}
        placeholder="Enter input for your program..."
        className="
          h-24
          w-full
          resize-none
          rounded-lg
          border
          border-slate-700
          bg-slate-900
          p-3
          font-mono
          text-sm
          text-white
          outline-none
          focus:border-blue-500
        "
      />
    </div>
  );
}