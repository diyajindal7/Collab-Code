import { useState } from "react";
import { Button } from "@/components/ui/button";

const defaultContestForm = {
  title: "",
  description: "",
  startTime: "",
  duration: 60,
  visibility: "private",
  password: "",
  maxParticipants: 50,
  languages: "javascript,python,java,cpp,c",
};

const defaultProblemForm = {
  title: "",
  statement: "",
  inputFormat: "",
  outputFormat: "",
  constraints: "",
  sampleInput: "",
  sampleOutput: "",
  explanation: "",
  difficulty: "medium",
  timeLimit: 1,
  memoryLimit: 128,
  expectedComplexity: "",
};

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

export default function ContestPanel({ contestState, isOwner }) {
  const [contestForm, setContestForm] = useState(defaultContestForm);
  const [problemForm, setProblemForm] = useState(defaultProblemForm);
  const [showProblemForm, setShowProblemForm] = useState(false);

  const handleCreateContest = async (event) => {
    event.preventDefault();
    await contestState.createContest({
      ...contestForm,
      duration: Number(contestForm.duration),
      maxParticipants: Number(contestForm.maxParticipants),
      languages: contestForm.languages
        .split(",")
        .map((language) => language.trim())
        .filter(Boolean),
    });
    setContestForm(defaultContestForm);
  };

  const handleAddProblem = async (event) => {
    event.preventDefault();
    await contestState.addProblem({
      ...problemForm,
      timeLimit: Number(problemForm.timeLimit),
      memoryLimit: Number(problemForm.memoryLimit),
    });
    setProblemForm(defaultProblemForm);
    setShowProblemForm(false);
  };

  if (contestState.loading) {
    return <div className="p-4 text-sm text-slate-400">Loading contest...</div>;
  }

  if (!contestState.contest) {
    return (
      <div className="h-full overflow-y-auto p-4 text-sm text-slate-300">
        <h2 className="mb-3 text-base font-semibold text-white">Contest Mode</h2>
        {!isOwner ? (
          <p className="rounded bg-slate-900 p-3 text-slate-400">
            The room owner has not created a contest yet.
          </p>
        ) : (
          <form className="space-y-3" onSubmit={handleCreateContest}>
            <input
              className="w-full rounded bg-slate-900 px-3 py-2 text-white"
              placeholder="Contest title"
              value={contestForm.title}
              onChange={(event) =>
                setContestForm((form) => ({ ...form, title: event.target.value }))
              }
              required
            />
            <textarea
              className="h-24 w-full rounded bg-slate-900 px-3 py-2 text-white"
              placeholder="Description"
              value={contestForm.description}
              onChange={(event) =>
                setContestForm((form) => ({ ...form, description: event.target.value }))
              }
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="rounded bg-slate-900 px-3 py-2 text-white"
                type="datetime-local"
                value={contestForm.startTime}
                onChange={(event) =>
                  setContestForm((form) => ({ ...form, startTime: event.target.value }))
                }
              />
              <input
                className="rounded bg-slate-900 px-3 py-2 text-white"
                type="number"
                min="1"
                value={contestForm.duration}
                onChange={(event) =>
                  setContestForm((form) => ({ ...form, duration: event.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                className="rounded bg-slate-900 px-3 py-2 text-white"
                value={contestForm.visibility}
                onChange={(event) =>
                  setContestForm((form) => ({ ...form, visibility: event.target.value }))
                }
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
              <input
                className="rounded bg-slate-900 px-3 py-2 text-white"
                type="number"
                min="1"
                value={contestForm.maxParticipants}
                onChange={(event) =>
                  setContestForm((form) => ({ ...form, maxParticipants: event.target.value }))
                }
              />
            </div>
            <input
              className="w-full rounded bg-slate-900 px-3 py-2 text-white"
              placeholder="Languages"
              value={contestForm.languages}
              onChange={(event) =>
                setContestForm((form) => ({ ...form, languages: event.target.value }))
              }
            />
            <Button className="w-full" type="submit">
              Create Contest
            </Button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 text-sm text-slate-300">
      <div className="mb-4 rounded border border-slate-800 bg-slate-900 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-white">{contestState.contest.title}</h2>
            <p className="mt-1 text-xs text-slate-400">
              {contestState.contest.description || "No description"}
            </p>
          </div>
          <span className="rounded bg-blue-600/20 px-2 py-1 text-xs uppercase text-blue-200">
            {contestState.contest.status}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded bg-slate-950 p-2">
            <div className="text-slate-500">Timer</div>
            <div className="text-white">{formatTime(contestState.remainingSeconds)}</div>
          </div>
          <div className="rounded bg-slate-950 p-2">
            <div className="text-slate-500">Problems</div>
            <div className="text-white">{contestState.problems.length}</div>
          </div>
        </div>
      </div>

      {isOwner && (
        <div className="mb-4 space-y-2 rounded border border-slate-800 bg-slate-900 p-3">
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" onClick={() => contestState.updateStatus("running")}>
              {contestState.contest.status === "paused" ? "Resume" : "Start"}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => contestState.updateStatus("paused")}>
              Pause
            </Button>
            <Button size="sm" variant="destructive" onClick={() => contestState.updateStatus("ended")}>
              End
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                contestState.setLeaderboardFrozen(!contestState.contest.leaderboardFrozen)
              }
            >
              {contestState.contest.leaderboardFrozen ? "Unfreeze" : "Freeze"}
            </Button>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="w-full"
            onClick={() => setShowProblemForm((current) => !current)}
          >
            {showProblemForm ? "Close Problem Form" : "Add Problem"}
          </Button>
        </div>
      )}

      {showProblemForm && isOwner && (
        <form className="mb-4 space-y-2 rounded border border-slate-800 bg-slate-900 p-3" onSubmit={handleAddProblem}>
          <input
            className="w-full rounded bg-slate-950 px-3 py-2 text-white"
            placeholder="Problem title"
            value={problemForm.title}
            onChange={(event) => setProblemForm((form) => ({ ...form, title: event.target.value }))}
            required
          />
          <textarea
            className="h-28 w-full rounded bg-slate-950 px-3 py-2 text-white"
            placeholder="Statement"
            value={problemForm.statement}
            onChange={(event) =>
              setProblemForm((form) => ({ ...form, statement: event.target.value }))
            }
            required
          />
          {["inputFormat", "outputFormat", "constraints", "sampleInput", "sampleOutput", "explanation", "expectedComplexity"].map((field) => (
            <textarea
              key={field}
              className="h-16 w-full rounded bg-slate-950 px-3 py-2 text-white"
              placeholder={field}
              value={problemForm[field]}
              onChange={(event) =>
                setProblemForm((form) => ({ ...form, [field]: event.target.value }))
              }
            />
          ))}
          <div className="grid grid-cols-3 gap-2">
            <select
              className="rounded bg-slate-950 px-3 py-2 text-white"
              value={problemForm.difficulty}
              onChange={(event) =>
                setProblemForm((form) => ({ ...form, difficulty: event.target.value }))
              }
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <input
              className="rounded bg-slate-950 px-3 py-2 text-white"
              type="number"
              min="1"
              value={problemForm.timeLimit}
              onChange={(event) =>
                setProblemForm((form) => ({ ...form, timeLimit: event.target.value }))
              }
            />
            <input
              className="rounded bg-slate-950 px-3 py-2 text-white"
              type="number"
              min="1"
              value={problemForm.memoryLimit}
              onChange={(event) =>
                setProblemForm((form) => ({ ...form, memoryLimit: event.target.value }))
              }
            />
          </div>
          <Button className="w-full" size="sm" type="submit">
            Save Problem
          </Button>
        </form>
      )}

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase text-slate-500">Problems</div>
        {contestState.problems.map((problem, index) => (
          <button
            type="button"
            key={problem._id}
            className={`w-full rounded p-3 text-left ${
              contestState.activeProblem?._id === problem._id
                ? "bg-blue-600 text-white"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
            onClick={() => contestState.setActiveProblemId(problem._id)}
          >
            <div className="text-xs text-slate-400">Problem {String.fromCharCode(65 + index)}</div>
            <div className="font-medium">{problem.title}</div>
            <div className="mt-1 text-xs capitalize opacity-80">{problem.difficulty}</div>
          </button>
        ))}
      </div>

      {contestState.error && (
        <p className="mt-3 rounded bg-red-950/60 p-2 text-xs text-red-200">
          {contestState.error}
        </p>
      )}
    </div>
  );
}
