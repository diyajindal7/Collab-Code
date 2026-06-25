const express = require("express");
const router = express.Router();

const protect = require("../middleware/auth");

const {
    createRoom,
    joinRoom,
    getMyRooms
} = require("../controllers/roomController");


router.post("/create", protect, createRoom);

router.post("/join", protect, joinRoom);

router.get("/my-rooms", protect, getMyRooms);

module.exports = router;