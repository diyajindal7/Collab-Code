import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import socket from "@/features/editor/socket";
import { useEditor } from "@/features/editor/context/EditorContext";
import {
  createContest as createContestRequest,
  createContestProblem,
  getContest,
  submitContestSolution,
  updateContestStatus,
} from "../services/contestService";

const getInitialProblemForm = () => ({
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
});

const getRemainingSeconds = (contest) => {
  if (!contest?.startTime || contest.status !== "running") return 0;

  const endsAt =
    new Date(contest.startTime).getTime() + Number(contest.duration || 0) * 60_000;
  return Math.max(0, Math.floor((endsAt - Date.now()) / 1000));
};

export default function useContest(roomCode, language) {
  const { code, stdin, setCode } = useEditor();
  const [contest, setContest] = useState(null);
  const [problems, setProblems] = useState([]);
  const [activeProblemId, setActiveProblemId] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const loadRequestIdRef = useRef(0);

  const activeProblem = useMemo(
    () => problems.find((problem) => problem._id === activeProblemId) || problems[0] || null,
    [activeProblemId, problems]
  );

  const loadContest = useCallback(async () => {
    const requestId = loadRequestIdRef.current + 1;
    loadRequestIdRef.current = requestId;

    try {
      setLoading(true);
      setError("");
      const data = await getContest(roomCode);

      if (loadRequestIdRef.current !== requestId) {
        return;
      }

      setContest(data.contest || null);
      setProblems(data.problems || []);
      setSubmissions(data.submissions || []);
      setLeaderboard(data.leaderboard || []);
      setActiveProblemId((currentProblemId) => {
        if ((data.problems || []).some((problem) => problem._id === currentProblemId)) {
          return currentProblemId;
        }
        return data.problems?.[0]?._id || "";
      });
    } catch (contestError) {
      if (loadRequestIdRef.current !== requestId) {
        return;
      }

      console.error(contestError);
      setError(contestError.response?.data?.message || "Unable to load contest");
    } finally {
      if (loadRequestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [roomCode]);

  useEffect(() => {
    queueMicrotask(() => {
      loadContest();
    });
  }, [loadContest]);

  useEffect(() => {
    if (contest?.status !== "running") {
      queueMicrotask(() => {
        setRemainingSeconds(getRemainingSeconds(contest));
      });
      return undefined;
    }

    const timer = setInterval(() => {
      setRemainingSeconds(getRemainingSeconds(contest));
    }, 1000);

    queueMicrotask(() => {
      setRemainingSeconds(getRemainingSeconds(contest));
    });

    return () => clearInterval(timer);
  }, [contest]);

  useEffect(() => {
    const handleContestStatus = ({ contest: nextContest }) => {
      setContest(nextContest);
    };

    const handleContestLeaderboard = ({ leaderboard: nextLeaderboard }) => {
      setLeaderboard(nextLeaderboard || []);
    };

    const handleContestSubmission = () => {
      loadContest();
    };

    socket.on("contest:status", handleContestStatus);
    socket.on("contest:leaderboard", handleContestLeaderboard);
    socket.on("contest:submission", handleContestSubmission);
    socket.on("contest:problem:update", loadContest);

    return () => {
      socket.off("contest:status", handleContestStatus);
      socket.off("contest:leaderboard", handleContestLeaderboard);
      socket.off("contest:submission", handleContestSubmission);
      socket.off("contest:problem:update", loadContest);
    };
  }, [loadContest]);

  const createContest = useCallback(
    async (payload) => {
      const data = await createContestRequest(roomCode, payload);
      setContest(data.contest);
      socket.emit("contest:problem:update", { roomCode });
      return data.contest;
    },
    [roomCode]
  );

  const addProblem = useCallback(
    async (payload) => {
      if (!contest?._id) return null;

      const data = await createContestProblem(contest._id, payload);
      await loadContest();
      socket.emit("contest:problem:update", { roomCode, contestId: contest._id });
      return data.problem;
    },
    [contest, loadContest, roomCode]
  );

  const updateStatus = useCallback(
    async (status) => {
      if (!contest?._id) return;

      if (["running", "paused", "ended"].includes(status)) {
        const eventName =
          status === "running" && contest.status === "paused"
            ? "contest:resume"
            : status === "running"
              ? "contest:start"
              : status === "paused"
                ? "contest:pause"
                : "contest:end";

        socket.emit(eventName, { roomCode, contestId: contest._id });
        return;
      }

      const data = await updateContestStatus(contest._id, { status });
      setContest(data.contest);
    },
    [contest, roomCode]
  );

  const setLeaderboardFrozen = useCallback(
    async (leaderboardFrozen) => {
      if (!contest?._id) return;

      const data = await updateContestStatus(contest._id, { leaderboardFrozen });
      setContest(data.contest);
      socket.emit("contest:leaderboard", { roomCode, contestId: contest._id });
    },
    [contest, roomCode]
  );

  const disqualifyParticipant = useCallback(
    async (disqualifiedUserId) => {
      if (!contest?._id || !disqualifiedUserId) return;

      const data = await updateContestStatus(contest._id, { disqualifiedUserId });
      setContest(data.contest);
      socket.emit("contest:leaderboard", { roomCode, contestId: contest._id });
    },
    [contest, roomCode]
  );

  const submitSolution = useCallback(async () => {
    if (!contest?._id || !activeProblem?._id || submitting) return null;

    try {
      setSubmitting(true);
      setError("");
      const data = await submitContestSolution(contest._id, activeProblem._id, {
        code,
        stdin,
        language,
      });
      setSubmissions((currentSubmissions) => [data.submission, ...currentSubmissions]);
      if (data.leaderboard?.length) {
        setLeaderboard(data.leaderboard);
      }
      socket.emit("contest:submission", { roomCode, contestId: contest._id });
      return data.submission;
    } catch (submitError) {
      console.error(submitError);
      setError(submitError.response?.data?.message || "Submission failed");
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [activeProblem, code, contest, language, roomCode, stdin, submitting]);

  const applyStarterCode = useCallback(() => {
    const starterCode = activeProblem?.starterCode?.[language];
    if (starterCode) {
      setCode(starterCode);
    }
  }, [activeProblem?.starterCode, language, setCode]);

  return {
    contest,
    problems,
    activeProblem,
    activeProblemId,
    setActiveProblemId,
    submissions,
    leaderboard,
    loading,
    submitting,
    error,
    remainingSeconds,
    createContest,
    addProblem,
    updateStatus,
    setLeaderboardFrozen,
    disqualifyParticipant,
    submitSolution,
    applyStarterCode,
    reloadContest: loadContest,
    getInitialProblemForm,
  };
}
