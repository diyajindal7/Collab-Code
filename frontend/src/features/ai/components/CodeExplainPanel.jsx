import { useState } from "react";
import { Button } from "@/components/ui/button";
import { explainCode } from "../services/aiExplainService";

export default function CodeExplainPanel({ language, selectedCode }) {
  const [explanation, setExplanation] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [error, setError] = useState("");

  const handleExplain = async () => {
    if (isExplaining) {
      return;
    }

    if (!selectedCode.trim()) {
      setExplanation(null);
      setError("Please select some code first.");
      return;
    }

    try {
      setIsExplaining(true);
      setError("");

      const response = await explainCode({
        sourceCode: selectedCode,
        language,
      });

      if (!response.success) {
        throw new Error(response.message || "Unable to generate code explanation");
      }

      setExplanation(response.explanation);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to generate code explanation"
      );
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <section className="border-t border-slate-700 bg-slate-950 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-white">AI Code Explanation</h2>
          <p className="mt-1 text-sm text-slate-400">
            Select code in the editor to get a beginner-friendly explanation.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={handleExplain}
          disabled={isExplaining}
        >
          {isExplaining ? "Explaining..." : "Explain Code"}
        </Button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {explanation && (
        <div className="mt-5 max-h-[calc(100vh-16rem)] space-y-5 overflow-y-auto pr-2">
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <h3 className="font-semibold text-white">Purpose</h3>
            <p className="mt-2 text-sm text-slate-300">
              {explanation.purpose}
            </p>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-white">
              Step-by-step Explanation
            </h3>
            <ol className="space-y-3">
              {explanation.steps.map((item, index) => (
                <li
                  key={`${item.step}-${index}`}
                  className="rounded-lg border border-slate-700 bg-slate-900 p-3"
                >
                  <h4 className="font-medium text-white">
                    {index + 1}. {item.step}
                  </h4>
                  <p className="mt-2 text-sm text-slate-300">
                    {item.explanation}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-white">
              Important Elements
            </h3>
            {explanation.importantElements.length > 0 ? (
              <ul className="space-y-3">
                {explanation.importantElements.map((element, index) => (
                  <li
                    key={`${element.name}-${index}`}
                    className="rounded-lg border border-slate-700 bg-slate-900 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="font-medium text-white">{element.name}</h4>
                      <span className="rounded-full border border-blue-500/30 bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-400">
                        {element.type}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">
                      {element.explanation}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">
                No important elements identified.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <h3 className="font-semibold text-white">Complexity</h3>
            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <p className="text-slate-300">
                <span className="font-medium text-white">Time:</span>{" "}
                {explanation.complexity.time}
              </p>
              <p className="text-slate-300">
                <span className="font-medium text-white">Space:</span>{" "}
                {explanation.complexity.space}
              </p>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              {explanation.complexity.explanation}
            </p>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <h3 className="font-semibold text-white">Beginner Explanation</h3>
            <p className="mt-2 text-sm text-slate-300">
              {explanation.beginnerExplanation}
            </p>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <h3 className="font-semibold text-white">Key Takeaways</h3>
            {explanation.keyTakeaways.length > 0 ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
                {explanation.keyTakeaways.map((takeaway, index) => (
                  <li key={`${takeaway}-${index}`}>{takeaway}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-400">
                No key takeaways identified.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
