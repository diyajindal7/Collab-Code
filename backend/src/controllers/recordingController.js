const fs = require("fs");
const path = require("path");
const Room = require("../models/Room");
const InterviewRecording = require("../models/InterviewRecording");

const uploadInterviewRecording = async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.roomCode });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    if (!req.body?.length) {
      return res.status(400).json({
        success: false,
        message: "Recording is required",
      });
    }

    const uploadDir = path.join(__dirname, "../../uploads/interviews");
    fs.mkdirSync(uploadDir, { recursive: true });

    const filename = `interview-${room.roomCode}-${Date.now()}.webm`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, req.body);

    const recording = await InterviewRecording.create({
      room: room._id,
      filename,
      originalName: req.headers["x-recording-name"] || filename,
      size: req.body.length,
      mimeType: req.headers["content-type"] || "video/webm",
      durationSeconds: Number(req.headers["x-recording-duration"]) || 0,
      uploadedBy: req.user?.userId || null,
    });

    res.status(201).json({
      success: true,
      message: "Recording uploaded",
      recording,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const getInterviewRecordings = async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.roomCode });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const recordings = await InterviewRecording.find({ room: room._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      recordings: recordings.map((recording) => ({
        _id: recording._id,
        filename: recording.filename,
        originalName: recording.originalName,
        size: recording.size,
        mimeType: recording.mimeType,
        durationSeconds: recording.durationSeconds,
        createdAt: recording.createdAt,
        url: `/uploads/interviews/${recording.filename}`,
      })),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const deleteInterviewRecording = async (req, res) => {
  try {
    const recording = await InterviewRecording.findById(req.params.recordingId).populate("room");

    if (!recording) {
      return res.status(404).json({
        success: false,
        message: "Recording not found",
      });
    }

    const room = recording.room;
    const userId = req.user?.userId;
    const canDelete =
      room?.owner?.toString() === userId ||
      room?.interviewer?.toString() === userId ||
      recording.uploadedBy?.toString() === userId;

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: "Not allowed to delete this recording",
      });
    }

    const filePath = path.join(
      __dirname,
      "../../uploads/interviews",
      recording.filename
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await recording.deleteOne();

    res.status(200).json({
      success: true,
      message: "Recording deleted",
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
  uploadInterviewRecording,
  getInterviewRecordings,
  deleteInterviewRecording,
};
