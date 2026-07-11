const express = require("express");
const router = express.Router();

const {
  runCode,
} = require("../controllers/judge0Controller");

router.post("/run", runCode);

module.exports = router;