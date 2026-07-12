const express = require("express");

const { fixCode } = require("../controllers/aiFixController");

const router = express.Router();

router.post("/fix", fixCode);

module.exports = router;
