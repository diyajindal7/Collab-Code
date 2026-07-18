import InputPanel from "./InputPanel";
import OutputPanel from "./OutputPanel";
import ContestLeaderboard from "@/features/contests/components/ContestLeaderboard";
import ContestProblemStatement from "@/features/contests/components/ContestProblemStatement";
import ContestSubmissions from "@/features/contests/components/ContestSubmissions";

const bottomTabs = [
  { id: "output", label: "Output" },
  { id: "input", label: "Input" },
  { id: "history", label: "Execution History" },
  { id: "question", label: "Coding Question" },
  { id: "notes", label: "Interviewer Notes" },
  { id: "evaluation", label: "Evaluation" },
  { id: "contest-problem", label: "Problem Statement" },
  { id: "contest-submissions", label: "Submissions" },
  { id: "contest-leaderboard", label: "Leaderboard" },
];

export default function BottomPanel({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
  executions,
  selectedExecution,
  setSelectedExecution,
  loadExecutionHistory,
  interviewState,
  contestState,
}) {
  return (
    <section
      className={`shrink-0 border-t border-slate-800 bg-slate-900 ${
        isOpen ? "h-64" : "h-10"
      }`}
    >
      <div className="flex h-10 items-center justify-between border-b border-slate-800 px-3">
        <div className="flex gap-2 overflow-x-auto">
          {bottomTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`rounded px-3 py-1 text-sm ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === "history") loadExecutionHistory();
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? "Collapse" : "Expand"}
        </button>
      </div>

      {isOpen && (
        <div className="h-[calc(100%-2.5rem)] overflow-auto">
          {activeTab === "input" ? (
            <InputPanel />
          ) : activeTab === "history" ? (
            <div className="grid h-full grid-cols-2 gap-3 p-3 text-sm text-slate-300">
              <div className="space-y-2 overflow-y-auto">
                {executions.map((execution) => (
                  <button
                    type="button"
                    key={execution._id}
                    className="block w-full rounded bg-slate-800 p-3 text-left hover:bg-slate-700"
                    onClick={() => setSelectedExecution(execution)}
                  >
                    <div className="font-medium text-white">
                      {execution.language}
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(execution.createdAt).toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400">
                      {execution.status?.description || "Executed"}
                    </div>
                  </button>
                ))}
              </div>
              <pre className="min-h-40 overflow-auto rounded bg-slate-950 p-3 text-xs">
                {selectedExecution
                  ? selectedExecution.stdout ||
                    selectedExecution.stderr ||
                    selectedExecution.compileOutput ||
                    "No Output"
                  : "Select an execution to view output."}
              </pre>
            </div>
          ) : activeTab === "question" ? (
            <div className="space-y-3 p-4 text-sm text-slate-300">
              <h3 className="text-base font-semibold text-white">
                {interviewState?.question?.title || "Question"}
              </h3>
              <p className="whitespace-pre-wrap">
                {interviewState?.question?.statement ||
                  "Open the Interview panel to create or edit the question."}
              </p>
              <p>
                <span className="font-medium text-white">Examples:</span>{" "}
                {interviewState?.question?.examples || "None"}
              </p>
              <p>
                <span className="font-medium text-white">Constraints:</span>{" "}
                {interviewState?.question?.constraints || "None"}
              </p>
              <p>
                <span className="font-medium text-white">
                  Expected Complexity:
                </span>{" "}
                {interviewState?.question?.expectedComplexity || "Not specified"}
              </p>
            </div>
          ) : activeTab === "notes" ? (
            <div className="p-4 text-sm text-slate-300">
              <h3 className="mb-2 text-base font-semibold text-white">Notes</h3>
              <p className="whitespace-pre-wrap rounded bg-slate-950 p-3">
                {interviewState?.notes || "No notes yet."}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Edit and autosave notes from the Interview panel.
              </p>
            </div>
          ) : activeTab === "evaluation" ? (
            <div className="grid gap-3 p-4 text-sm text-slate-300 sm:grid-cols-3">
              {Object.entries(interviewState?.evaluation || {}).map(
                ([key, value]) => (
                  <div key={key} className="rounded bg-slate-950 p-3">
                    <div className="text-xs uppercase text-slate-500">{key}</div>
                    <div className="mt-1 text-white">{String(value || "-")}</div>
                  </div>
                )
              )}
            </div>
          ) : activeTab === "contest-problem" ? (
            <ContestProblemStatement contestState={contestState} />
          ) : activeTab === "contest-submissions" ? (
            <ContestSubmissions submissions={contestState?.submissions || []} />
          ) : activeTab === "contest-leaderboard" ? (
            <ContestLeaderboard leaderboard={contestState?.leaderboard || []} />
          ) : (
            <OutputPanel />
          )}
        </div>
      )}
    </section>
  );
}
