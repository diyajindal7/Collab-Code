const express = require("express");
const protect = require("../middleware/auth");
const {
  createContest,
  createProblem,
  getContest,
  getResults,
  submitSolution,
  updateContestStatus,
} = require("../controllers/contestController");

const router = express.Router();

router.get("/rooms/:roomCode", protect, getContest);
router.post("/rooms/:roomCode", protect, createContest);
router.post("/:contestId/problems", protect, createProblem);
router.patch("/:contestId/status", protect, updateContestStatus);
router.post("/:contestId/problems/:problemId/submit", protect, submitSolution);
router.get("/:contestId/results", protect, getResults);

module.exports = router;
