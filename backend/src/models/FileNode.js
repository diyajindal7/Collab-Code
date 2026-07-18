const mongoose = require("mongoose");

const fileNodeSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["file", "folder"],
      required: true,
    },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FileNode",
      default: null,
    },

    content: {
      type: String,
      default: "",
    },

    language: {
      type: String,
      default: "javascript",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FileNode", fileNodeSchema);
