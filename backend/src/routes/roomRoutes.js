const express = require("express");
const router = express.Router();

const protect = require("../middleware/auth");

const {
    createRoom,
    joinRoom,
    getMyRooms,
    updateRoomSettings,
    deleteRoom
} = require("../controllers/roomController");


router.post("/create", protect, createRoom);

router.post("/join", protect, joinRoom);

router.get("/my-rooms", protect, getMyRooms);

router.put("/:roomCode/settings", protect, updateRoomSettings);

router.delete("/:roomCode", protect, deleteRoom);

module.exports = router;
