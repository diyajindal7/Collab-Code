import AiAssistantPanel from "@/features/ai/components/AiAssistantPanel";

export default function RightSidebar({
  isOpen,
  setIsOpen,
  language,
  selectedCode,
}) {
  return (
    <aside className="flex min-h-0 w-80 shrink-0 flex-col border-l border-slate-800 bg-slate-950">
      <div className="flex h-10 items-center justify-between border-b border-slate-800 px-3">
        <span className="text-sm font-semibold text-white">AI Assistant</span>
        <button
          type="button"
          className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? "Hide" : "Show"}
        </button>
      </div>
      {isOpen && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AiAssistantPanel language={language} selectedCode={selectedCode} />
        </div>
      )}
    </aside>
  );
}
