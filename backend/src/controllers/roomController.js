const Room = require("../models/Room");
const User = require("../models/User");
const generateRoomCode = require("../utils/generateRoomCode");

const createRoom = async (req, res) => {
  try {
    const { title, language } = req.body;

    if (!title || !language) {
      return res.status(400).json({
        success: false,
        message: "Title and language are required"
      });
    }

    const owner = req.user.userId;

    // Generate unique room code
    let roomCode;
    let existingRoom;

    do {
      roomCode = generateRoomCode();
      existingRoom = await Room.findOne({ roomCode });
    } while (existingRoom);

    // Create room
    const room = await Room.create({
      roomCode,
      title,
      owner,
      participants: [owner],
      language,
      code: ""
    });

    // Update user
    await User.findByIdAndUpdate(owner, {
      $push: {
        createdRooms: room._id,
        joinedRooms: room._id
      }
    });

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      room
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

module.exports = {
  createRoom
};