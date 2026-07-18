const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
    },

    title: {
      type: String,
      required: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    interviewMode: {
      type: Boolean,
      default: false,
    },

    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    interviewStatus: {
      type: String,
      enum: [
        "waiting",
        "active",
        "paused",
        "completed",
      ],
      default: "waiting",
    },

    duration: {
      type: Number,
      default: 45,
    },

    interviewStartedAt: {
      type: Date,
      default: null,
    },

    interviewPausedAt: {
      type: Date,
      default: null,
    },

    interviewTotalPausedMs: {
      type: Number,
      default: 0,
    },

    interviewNotes: {
      type: String,
      default: "",
    },

    candidateEvaluation: {
      communication: {
        type: Number,
        default: 0,
      },
      problemSolving: {
        type: Number,
        default: 0,
      },
      coding: {
        type: Number,
        default: 0,
      },
      optimization: {
        type: Number,
        default: 0,
      },
      debugging: {
        type: Number,
        default: 0,
      },
      rating: {
        type: Number,
        default: 0,
      },
      recommendation: {
        type: String,
        default: "pending",
      },
      feedback: {
        type: String,
        default: "",
      },
    },

    codingQuestion: {
      title: {
        type: String,
        default: "",
      },
      statement: {
        type: String,
        default: "",
      },
      examples: {
        type: String,
        default: "",
      },
      constraints: {
        type: String,
        default: "",
      },
      expectedComplexity: {
        type: String,
        default: "",
      },
    },

    pairProgramming: {
      enabled: {
        type: Boolean,
        default: false,
      },
      locked: {
        type: Boolean,
        default: false,
      },
      restrictEditing: {
        type: Boolean,
        default: true,
      },
      startedAt: {
        type: Date,
        default: null,
      },
      driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      navigator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      pendingControlRequest: {
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        requestedAt: {
          type: Date,
          default: null,
        },
      },
      currentFile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FileNode",
        default: null,
      },
      openFiles: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "FileNode",
        },
      ],
      followTarget: {
        type: String,
        default: "",
      },
      scrollTop: {
        type: Number,
        default: 0,
      },
      cursorState: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      presence: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      mutedParticipants: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },

   

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    language: {
      type: String,
      default: "javascript",
    },

    code: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Room", roomSchema);
