const axios = require("axios");
const Contest = require("../models/Contest");
const ContestProblem = require("../models/ContestProblem");
const ContestSubmission = require("../models/ContestSubmission");
const Room = require("../models/Room");

const LANGUAGE_MAP = {
  javascript: 63,
  java: 62,
  cpp: 54,
  c: 50,
  python: 71,
};

const normalizeOutput = (value) => (value || "").trim().replace(/\r\n/g, "\n");

const getContestBundle = async (roomCode) => {
  const room = await Room.findOne({ roomCode });
  if (!room) return null;

  const contest = await Contest.findOne({ room: room._id }).sort({
    createdAt: -1,
  });
  if (!contest) return { room, contest: null, problems: [] };

  const problems = await ContestProblem.find({ contest: contest._id }).sort({
    order: 1,
    createdAt: 1,
  });

  return { room, contest, problems };
};

const buildLeaderboard = async (contestId) => {
  const submissions = await ContestSubmission.find({ contest: contestId })
    .populate("user", "name email")
    .sort({ submittedAt: 1 });
  const rowsByUser = {};

  submissions.forEach((submission) => {
    const userId = submission.user?._id?.toString() || submission.user?.toString();
    if (!userId) return;

    if (!rowsByUser[userId]) {
      rowsByUser[userId] = {
        userId,
        participant: submission.user?.name || "Participant",
        solvedProblems: new Set(),
        solved: 0,
        penalty: 0,
        lastSubmission: submission.submittedAt,
        submissions: 0,
      };
    }

    const row = rowsByUser[userId];
    row.submissions += 1;
    row.lastSubmission = submission.submittedAt;

    if (submission.verdict === "Accepted") {
      row.solvedProblems.add(submission.problem.toString());
      row.solved = row.solvedProblems.size;
    } else {
      row.penalty += 20;
    }
  });

  return Object.values(rowsByUser)
    .map((row) => ({
      ...row,
      solvedProblems: undefined,
    }))
    .sort((first, second) => second.solved - first.solved || first.penalty - second.penalty)
    .map((row, index) => ({
      rank: index + 1,
      ...row,
    }));
};

const getContest = async (req, res) => {
  try {
    const bundle = await getContestBundle(req.params.roomCode);
    if (!bundle) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    const submissions = bundle.contest
      ? await ContestSubmission.find({ contest: bundle.contest._id, user: req.user.userId })
          .populate("problem", "title")
          .sort({ submittedAt: -1 })
      : [];
    const leaderboard = bundle.contest ? await buildLeaderboard(bundle.contest._id) : [];

    res.json({
      success: true,
      contest: bundle.contest,
      problems: bundle.problems,
      submissions,
      leaderboard,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const createContest = async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.roomCode });
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }
    if (room.owner.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Only owner can create contest" });
    }

    const contest = await Contest.create({
      room: room._id,
      owner: req.user.userId,
      title: req.body.title,
      description: req.body.description,
      startTime: req.body.startTime || null,
      duration: req.body.duration || 60,
      visibility: req.body.visibility || "private",
      password: req.body.password || "",
      maxParticipants: req.body.maxParticipants || 50,
      languages: req.body.languages || ["javascript", "python", "java", "cpp", "c"],
      status: req.body.status || "upcoming",
    });

    res.status(201).json({ success: true, contest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const createProblem = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.contestId);
    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }
    if (contest.owner.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Only owner can add problems" });
    }

    const count = await ContestProblem.countDocuments({ contest: contest._id });
    const problem = await ContestProblem.create({
      contest: contest._id,
      ...req.body,
      order: req.body.order ?? count,
    });

    res.status(201).json({ success: true, problem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const updateContestStatus = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.contestId);
    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }
    if (contest.owner.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Only owner can update contest" });
    }

    if (req.body.status) contest.status = req.body.status;
    if (req.body.leaderboardFrozen !== undefined) {
      contest.leaderboardFrozen = Boolean(req.body.leaderboardFrozen);
    }
    if (req.body.disqualifiedUserId) {
      contest.disqualifiedParticipants.addToSet(req.body.disqualifiedUserId);
    }
    await contest.save();

    res.json({ success: true, contest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const submitSolution = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.contestId);
    const problem = await ContestProblem.findById(req.params.problemId);
    if (!contest || !problem) {
      return res.status(404).json({ success: false, message: "Contest or problem not found" });
    }
    if (contest.status !== "running") {
      return res.status(400).json({ success: false, message: "Contest is not running" });
    }
    if (contest.disqualifiedParticipants.some((id) => id.toString() === req.user.userId)) {
      return res.status(403).json({ success: false, message: "Participant is disqualified" });
    }

    const languageId = LANGUAGE_MAP[req.body.language];
    if (!languageId) {
      return res.status(400).json({ success: false, message: "Unsupported language" });
    }

    const testCases = [
      ...(problem.visibleTestCases || []),
      ...(problem.hiddenTestCases || []),
    ].filter((testCase) => testCase?.input !== undefined || testCase?.output !== undefined);
    const effectiveTestCases = testCases.length
      ? testCases
      : [
          {
            input: req.body.stdin || problem.sampleInput || "",
            output: problem.sampleOutput || "",
          },
        ];

    let aggregateResult = null;
    let verdict = "Accepted";
    let totalTime = 0;
    let maxMemory = 0;

    for (const testCase of effectiveTestCases) {
      const judgeResult = await axios.post(
        "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
        {
          source_code: req.body.code,
          language_id: languageId,
          stdin: testCase.input || "",
        }
      );
      aggregateResult = judgeResult.data;
      totalTime += Number(judgeResult.data.time) || 0;
      maxMemory = Math.max(maxMemory, Number(judgeResult.data.memory) || 0);

      const expectedOutput = normalizeOutput(testCase.output);
      const actualOutput = normalizeOutput(judgeResult.data.stdout);
      const passed =
        judgeResult.data.status?.id === 3 &&
        (!expectedOutput || expectedOutput === actualOutput);

      if (!passed) {
        verdict =
          judgeResult.data.status?.id === 3
            ? "Wrong Answer"
            : judgeResult.data.status?.description || "Wrong Answer";
        break;
      }
    }

    const submission = await ContestSubmission.create({
      user: req.user.userId,
      contest: contest._id,
      problem: problem._id,
      language: req.body.language,
      code: req.body.code,
      verdict,
      executionTime: totalTime,
      memory: maxMemory,
      stdout: aggregateResult?.stdout || "",
      stderr: aggregateResult?.stderr || "",
      compileOutput: aggregateResult?.compile_output || "",
      status: aggregateResult?.status || null,
      submittedAt: new Date(),
    });
    const leaderboard = contest.leaderboardFrozen ? [] : await buildLeaderboard(contest._id);

    res.status(201).json({ success: true, submission, leaderboard });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Submission failed" });
  }
};

const getResults = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.contestId);
    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }
    const submissions = await ContestSubmission.find({ contest: contest._id });
    const leaderboard = await buildLeaderboard(contest._id);
    const accepted = submissions.filter((submission) => submission.verdict === "Accepted");

    res.json({
      success: true,
      summary: {
        leaderboard,
        submissionCount: submissions.length,
        acceptedCount: accepted.length,
        wrongAnswers: submissions.length - accepted.length,
        averageExecutionTime:
          submissions.reduce((total, submission) => total + submission.executionTime, 0) /
          (submissions.length || 1),
        averageMemory:
          submissions.reduce((total, submission) => total + submission.memory, 0) /
          (submissions.length || 1),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = {
  getContest,
  createContest,
  createProblem,
  updateContestStatus,
  submitSolution,
  getResults,
  buildLeaderboard,
};
