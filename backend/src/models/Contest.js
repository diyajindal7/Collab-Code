const mongoose = require("mongoose");

const contestSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    startTime: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: 60,
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
    },
    password: {
      type: String,
      default: "",
    },
    maxParticipants: {
      type: Number,
      default: 50,
    },
    languages: {
      type: [String],
      default: ["javascript", "python", "java", "cpp", "c"],
    },
    status: {
      type: String,
      enum: ["upcoming", "running", "paused", "ended"],
      default: "upcoming",
    },
    leaderboardFrozen: {
      type: Boolean,
      default: false,
    },
    disqualifiedParticipants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Contest", contestSchema);
