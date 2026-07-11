const express = require("express");

const { reviewCode } = require("../controllers/aiReviewController");

const router = express.Router();

router.post("/review", reviewCode);

module.exports = router;