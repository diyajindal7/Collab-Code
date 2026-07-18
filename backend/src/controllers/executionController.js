const Execution = require("../models/Execution");
const Room = require("../models/Room");

const getExecutionHistory = async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.roomCode });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const executions = await Execution.find({ room: room._id })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      executions,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  getExecutionHistory,
};
