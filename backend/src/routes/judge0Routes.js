const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");

const {
  runCode,
} = require("../controllers/judge0Controller");

router.post("/run", protect, runCode);

module.exports = router;
