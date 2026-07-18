const mongoose = require("mongoose");

const contestProblemSchema = new mongoose.Schema(
  {
    contest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    statement: {
      type: String,
      default: "",
    },
    inputFormat: {
      type: String,
      default: "",
    },
    outputFormat: {
      type: String,
      default: "",
    },
    constraints: {
      type: String,
      default: "",
    },
    sampleInput: {
      type: String,
      default: "",
    },
    sampleOutput: {
      type: String,
      default: "",
    },
    explanation: {
      type: String,
      default: "",
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },
    timeLimit: {
      type: Number,
      default: 2,
    },
    memoryLimit: {
      type: Number,
      default: 128,
    },
    expectedComplexity: {
      type: String,
      default: "",
    },
    starterCode: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    visibleTestCases: [
      {
        input: {
          type: String,
          default: "",
        },
        output: {
          type: String,
          default: "",
        },
      },
    ],
    hiddenTestCases: [
      {
        input: {
          type: String,
          default: "",
        },
        output: {
          type: String,
          default: "",
        },
      },
    ],
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ContestProblem", contestProblemSchema);
