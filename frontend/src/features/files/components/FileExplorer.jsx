import { useState } from "react";

const mockFiles = [
  "main.js",
  "app.js",
  "utils.js",
];

export default function FileExplorer() {
  const [selectedFile, setSelectedFile] = useState(mockFiles[0]);

  return (
    <div className="flex h-full flex-col border-r border-slate-700 bg-slate-950 text-slate-100">
      <div className="border-b border-slate-700 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
          Explorer
        </h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {mockFiles.map((file) => (
          <button
            key={file}
            type="button"
            className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
              selectedFile === file
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
            onClick={() => setSelectedFile(file)}
          >
            {file}
          </button>
        ))}
      </div>

      <div className="border-t border-slate-700 p-3">
        <button
          type="button"
          className="w-full rounded bg-slate-800 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          onClick={() => console.log("New File")}
        >
          New File
        </button>
      </div>
    </div>
  );
}