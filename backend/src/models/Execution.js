const mongoose = require("mongoose");

const executionSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    language: {
      type: String,
      required: true,
    },

    code: {
      type: String,
      default: "",
    },

    stdin: {
      type: String,
      default: "",
    },

    stdout: {
      type: String,
      default: "",
    },

    stderr: {
      type: String,
      default: "",
    },

    compileOutput: {
      type: String,
      default: "",
    },

    executionTime: {
      type: String,
      default: "",
    },

    memory: {
      type: Number,
      default: null,
    },

    status: {
      type: Object,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Execution", executionSchema);
