import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useEditor } from "@/features/editor/context/EditorContext";
import { reviewCode } from "../services/aiReviewService";




const severityClasses = {
  low: "border-blue-500/30 bg-blue-500/15 text-blue-400",
  medium: "border-amber-500/30 bg-amber-500/15 text-amber-400",
  high: "border-orange-500/30 bg-orange-500/15 text-orange-400",
  critical: "border-red-500/30 bg-red-500/15 text-red-400",
};

function ReviewItem({ item, recommendationLabel }) {
  return (
    <li className="rounded-lg border border-slate-700 bg-slate-900 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h4 className="font-medium text-white">{item.title}</h4>

        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
            severityClasses[item.severity] || severityClasses.low
          }`}
        >
          {item.severity}
        </span>
      </div>

      <p className="text-sm text-slate-300">{item.description}</p>

      <p className="mt-2 text-sm text-slate-400">
        <span className="font-medium text-slate-200">
          {recommendationLabel}:
        </span>{" "}
        {item.suggestion || item.recommendation}
      </p>
    </li>
  );
}

export default function CodeReviewPanel({ language, selectedCode }) {
  const { code } = useEditor();
  const [review, setReview] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState("");
  
   useEffect(() => {
    if (selectedCode.trim()) {
      setError("");
    }
  }, [selectedCode]);

  const requestReview = async (sourceCode) => {
    try {
      setIsReviewing(true);
      setError("");

      const response = await reviewCode({
        sourceCode,
        language,
      });

      if (!response.success) {
        throw new Error(response.message || "Unable to generate code review");
      }

      setReview(response.review);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to generate code review"
      );
    } finally {
      setIsReviewing(false);
    }
  };

  const handleReview = async () => {
    if (!code.trim() || isReviewing) {
      return;
    }

    await requestReview(code);
  };

  const handleSelectionReview = async () => {
    if (isReviewing) {
      return;
    }

   if (!selectedCode.trim()) {
  setReview(null);
  setError("Please select some code first.");
  return;
}

    await requestReview(selectedCode);
  };

  return (
    <section className="border-t border-slate-700 bg-slate-950 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-white">AI Code Review</h2>
          <p className="mt-1 text-sm text-slate-400">
            Analyze the complete file for quality, bugs, and improvements.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleReview}
            disabled={isReviewing || !code.trim()}
          >
            {isReviewing ? "Reviewing..." : "Review Code"}
          </Button>

          <Button
            variant="secondary"
            onClick={handleSelectionReview}
            disabled={isReviewing}
          >
            {isReviewing ? "Reviewing..." : "Review Selection"}
          </Button>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {review && (
        <div className="mt-5 max-h-[calc(100vh-16rem)] space-y-5 overflow-y-auto pr-2">
          <div className="flex flex-col gap-4 rounded-lg border border-slate-700 bg-slate-900 p-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-semibold text-white">Summary</h3>
              <p className="mt-2 text-sm text-slate-300">{review.summary}</p>
            </div>

            <div className="shrink-0 rounded-lg bg-blue-500/15 px-3 py-2 text-center">
              <p className="text-xs text-blue-300">Score</p>
              <p className="text-lg font-bold text-blue-400">{review.score}/100</p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <h3 className="font-semibold text-white">Complexity</h3>
            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <p className="text-slate-300">
                <span className="font-medium text-white">Time:</span>{" "}
                {review.complexity.time}
              </p>
              <p className="text-slate-300">
                <span className="font-medium text-white">Space:</span>{" "}
                {review.complexity.space}
              </p>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              {review.complexity.explanation}
            </p>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-white">Bugs</h3>
            {review.bugs.length > 0 ? (
              <ul className="space-y-3">
                {review.bugs.map((bug, index) => (
                  <ReviewItem
                    key={`${bug.title}-${index}`}
                    item={bug}
                    recommendationLabel="Suggestion"
                  />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">No bugs identified.</p>
            )}
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-white">Improvements</h3>
            {review.improvements.length > 0 ? (
              <ul className="space-y-3">
                {review.improvements.map((improvement, index) => (
                  <li
                    key={`${improvement.title}-${index}`}
                    className="rounded-lg border border-slate-700 bg-slate-900 p-3"
                  >
                    <h4 className="font-medium text-white">
                      {improvement.title}
                    </h4>
                    <p className="mt-2 text-sm text-slate-300">
                      {improvement.description}
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      <span className="font-medium text-slate-200">
                        Suggestion:
                      </span>{" "}
                      {improvement.suggestion}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">
                No improvements identified.
              </p>
            )}
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-white">Security</h3>
            {review.security.length > 0 ? (
              <ul className="space-y-3">
                {review.security.map((issue, index) => (
                  <ReviewItem
                    key={`${issue.title}-${index}`}
                    item={issue}
                    recommendationLabel="Recommendation"
                  />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">
                No security concerns identified.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <h3 className="font-semibold text-white">Best Practices</h3>

            {review.bestPractices.length > 0 ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
                {review.bestPractices.map((practice, index) => (
                  <li key={`${practice}-${index}`}>{practice}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-400">
                No best-practice concerns identified.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}