const mongoose = require("mongoose");

const interviewRecordingSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    filename: {
      type: String,
      required: true,
    },

    originalName: {
      type: String,
      default: "",
    },

    size: {
      type: Number,
      default: 0,
    },

    mimeType: {
      type: String,
      default: "video/webm",
    },

    durationSeconds: {
      type: Number,
      default: 0,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("InterviewRecording", interviewRecordingSchema);
