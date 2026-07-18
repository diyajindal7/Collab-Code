import { Button } from "@/components/ui/button";
import CodeEditor from "@/features/editor/components/CodeEditor";

export default function Workspace({
  language,
  selectedCode,
  setSelectedCode,
  currentFile,
  openFiles,
  dirtyFiles,
  saveStatus,
  isRunning,
  onRun,
  onOpenFile,
  onCloseTab,
  isPairNavigator,
  pairState,
}) {
  return (
    <>
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/80">
        <div className="flex min-w-0 flex-1 overflow-x-auto">
          {openFiles.length ? (
            openFiles.map((file) => (
              <button
                type="button"
                key={file._id}
                className={`flex items-center gap-2 border-r border-slate-800 px-3 py-2 text-sm ${
                  currentFile?._id === file._id
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
                onClick={() => onOpenFile(file)}
              >
                <span className="max-w-40 truncate">
                  {file.name}
                  {dirtyFiles[file._id] ? "*" : ""}
                </span>
                <span
                  className="rounded px-1 hover:bg-slate-700"
                  onClick={(event) => {
                    event.stopPropagation();
                    onCloseTab(file._id);
                  }}
                >
                  x
                </span>
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-slate-500">
              Open a file from Explorer
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 px-3">
          <span className="hidden text-xs text-slate-500 sm:inline">
            {currentFile?.name || "No file"}
          </span>
          <span className="text-xs text-slate-500">{saveStatus}</span>
          <Button size="sm" onClick={onRun} disabled={isRunning}>
            {isRunning ? "Running..." : "Run"}
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <CodeEditor
          language={language}
          selectedCode={selectedCode}
          onSelectionChange={setSelectedCode}
          readOnly={isPairNavigator}
          pairEnabled={pairState.enabled}
          followTarget={pairState.followTarget}
          currentFile={currentFile}
          openFiles={openFiles}
        />
      </div>
    </>
  );
}
