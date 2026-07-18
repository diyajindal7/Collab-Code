const express = require("express");
const router = express.Router();

const protect = require("../middleware/auth");

const {
  registerUser,
  loginUser,
  getProfile,
  forgotPassword,
  resetPassword
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get(
  "/profile",
  protect,
  getProfile
);

module.exports = router;
