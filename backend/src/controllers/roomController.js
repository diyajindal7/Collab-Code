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

const joinRoom = async (req, res) => {
    try {

        const { roomCode } = req.body;

        if (!roomCode) {
            return res.status(400).json({
                success: false,
                message: "Room code is required"
            });
        }

        const userId = req.user.userId;

        // Find room
        const room = await Room.findOne({ roomCode });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        // Check if already joined
        const alreadyJoined = room.participants.some(
    participant => participant.toString() === userId
);

if (alreadyJoined) {
    return res.status(400).json({
        success: false,
        message: "Already joined this room"
    });
}

        // Add user to room
        room.participants.push(userId);

        await room.save();

        // Update user
        await User.findByIdAndUpdate(userId, {
            $push: {
                joinedRooms: room._id
            }
        });

        res.status(200).json({
            success: true,
            message: "Joined room successfully",
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


const getMyRooms = async (req, res) => {
    try {

        const userId = req.user.userId;

        const user = await User.findById(userId)
            .populate("createdRooms")
            .populate("joinedRooms");

        res.status(200).json({
            success: true,
            createdRooms: user.createdRooms,
            joinedRooms: user.joinedRooms
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
    createRoom,
    joinRoom,
    getMyRooms
};