const express = require("express");
const router = express.Router();

const protect = require("../middleware/auth");

const {
  uploadInterviewRecording,
  getInterviewRecordings,
  deleteInterviewRecording,
} = require("../controllers/recordingController");

router.get("/interviews/:roomCode", protect, getInterviewRecordings);
router.delete("/interviews/:recordingId", protect, deleteInterviewRecording);

router.post(
  "/interviews/:roomCode",
  protect,
  express.raw({
    type: "video/webm",
    limit: "500mb",
  }),
  uploadInterviewRecording
);

module.exports = router;
