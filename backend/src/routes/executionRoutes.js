const express = require("express");
const router = express.Router();

const protect = require("../middleware/auth");

const {
  getExecutionHistory,
} = require("../controllers/executionController");

router.get("/:roomCode", protect, getExecutionHistory);

module.exports = router;
