import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fixCode } from "../services/aiFixService";
import { useParams } from "react-router-dom";
import socket from "@/features/editor/socket";

const severityClasses = {
  low: "border-blue-500/30 bg-blue-500/15 text-blue-400",
  medium: "border-amber-500/30 bg-amber-500/15 text-amber-400",
  high: "border-orange-500/30 bg-orange-500/15 text-orange-400",
  critical: "border-red-500/30 bg-red-500/15 text-red-400",
};

export default function CodeFixPanel({ language, selectedCode }) {
  const { roomCode } = useParams();
  const [fixedResult, setFixedResult] = useState(null);
  const [isFixing, setIsFixing] = useState(false);
  const [error, setError] = useState("");

  const handleFix = async () => {
    if (isFixing) {
      return;
    }

    if (!selectedCode.trim()) {
      setFixedResult(null);
      setError("Please select some code first.");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      socket.emit("pair:ai-action", {
        roomCode,
        action: "AI Fix",
        user,
      });
      setIsFixing(true);
      setError("");

      const response = await fixCode({
        sourceCode: selectedCode,
        language,
      });

      if (!response.success) {
        throw new Error(response.message || "Unable to generate code fix");
      }

      setFixedResult(response.fix);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to generate code fix"
      );
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <section className="border-t border-slate-700 bg-slate-950 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-white">AI Code Fix</h2>
          <p className="mt-1 text-sm text-slate-400">
            Select code in the editor to find issues and generate an improved version.
          </p>
        </div>

        <Button variant="secondary" onClick={handleFix} disabled={isFixing}>
          {isFixing ? "Fixing..." : "Fix Code"}
        </Button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {fixedResult && (
        <div className="mt-5 max-h-[calc(100vh-16rem)] space-y-5 overflow-y-auto pr-2">
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <h3 className="font-semibold text-white">Summary</h3>
            <p className="mt-2 text-sm text-slate-300">{fixedResult.summary}</p>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-white">Issues</h3>
            {fixedResult.issues.length > 0 ? (
              <ul className="space-y-3">
                {fixedResult.issues.map((issue, index) => (
                  <li
                    key={`${issue.title}-${index}`}
                    className="rounded-lg border border-slate-700 bg-slate-900 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h4 className="font-medium text-white">{issue.title}</h4>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                          severityClasses[issue.severity] || severityClasses.low
                        }`}
                      >
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">{issue.description}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">No issues identified.</p>
            )}
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-white">Fixed Code</h3>
              <Button variant="secondary" size="sm" disabled>
                Copy (coming soon)
              </Button>
            </div>
            <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-sm text-slate-200">
              <code>{fixedResult.fixedCode}</code>
            </pre>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-white">Changes Made</h3>
            {fixedResult.changes.length > 0 ? (
              <ul className="space-y-3">
                {fixedResult.changes.map((change, index) => (
                  <li
                    key={`${change.title}-${index}`}
                    className="rounded-lg border border-slate-700 bg-slate-900 p-3"
                  >
                    <h4 className="font-medium text-white">{change.title}</h4>
                    <p className="mt-2 text-sm text-slate-300">
                      {change.explanation}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">No changes were needed.</p>
            )}
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <h3 className="font-semibold text-white">Best Practices</h3>
            {fixedResult.bestPractices.length > 0 ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
                {fixedResult.bestPractices.map((practice, index) => (
                  <li key={`${practice}-${index}`}>{practice}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-400">
                No best-practice recommendations identified.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
