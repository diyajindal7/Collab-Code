const express = require("express");

const { explainCode } = require("../controllers/aiExplainController");

const router = express.Router();

router.post("/explain", explainCode);

module.exports = router;
