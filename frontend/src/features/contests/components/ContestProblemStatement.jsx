import { Button } from "@/components/ui/button";

export default function ContestProblemStatement({ contestState }) {
  const problem = contestState.activeProblem;

  if (!contestState.contest) {
    return (
      <div className="p-4 text-sm text-slate-400">
        Create or join a contest to view problem statements.
      </div>
    );
  }

  if (!problem) {
    return <div className="p-4 text-sm text-slate-400">No contest problem selected.</div>;
  }

  return (
    <div className="space-y-4 p-4 text-sm text-slate-300">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{problem.title}</h3>
          <p className="mt-1 text-xs capitalize text-slate-500">
            {problem.difficulty} · {problem.timeLimit}s · {problem.memoryLimit} MB
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={contestState.applyStarterCode}>
            Starter Code
          </Button>
          <Button
            size="sm"
            onClick={contestState.submitSolution}
            disabled={contestState.submitting || contestState.contest.status !== "running"}
          >
            {contestState.submitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>

      <section>
        <h4 className="mb-1 font-semibold text-white">Statement</h4>
        <p className="whitespace-pre-wrap">{problem.statement || "No statement provided."}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded bg-slate-950 p-3">
          <h4 className="mb-1 font-semibold text-white">Input Format</h4>
          <p className="whitespace-pre-wrap">{problem.inputFormat || "-"}</p>
        </section>
        <section className="rounded bg-slate-950 p-3">
          <h4 className="mb-1 font-semibold text-white">Output Format</h4>
          <p className="whitespace-pre-wrap">{problem.outputFormat || "-"}</p>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded bg-slate-950 p-3">
          <h4 className="mb-1 font-semibold text-white">Sample Input</h4>
          <pre className="overflow-auto whitespace-pre-wrap text-xs">{problem.sampleInput || "-"}</pre>
        </section>
        <section className="rounded bg-slate-950 p-3">
          <h4 className="mb-1 font-semibold text-white">Sample Output</h4>
          <pre className="overflow-auto whitespace-pre-wrap text-xs">{problem.sampleOutput || "-"}</pre>
        </section>
      </div>

      <section>
        <h4 className="mb-1 font-semibold text-white">Constraints</h4>
        <p className="whitespace-pre-wrap">{problem.constraints || "-"}</p>
      </section>
      <section>
        <h4 className="mb-1 font-semibold text-white">Expected Complexity</h4>
        <p>{problem.expectedComplexity || "Not specified"}</p>
      </section>
    </div>
  );
}
