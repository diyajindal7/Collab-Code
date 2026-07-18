const Room = require("../models/Room");

const interviewTimers = {};

const getUserId = (user) => user?._id || user?.id || user?.userId;

const buildInterviewState = (room) => ({
  status: room.interviewStatus,
  duration: room.duration,
  startedAt: room.interviewStartedAt,
  pausedAt: room.interviewPausedAt,
  totalPausedMs: room.interviewTotalPausedMs || 0,
  notes: room.interviewNotes || "",
  evaluation: room.candidateEvaluation || {
    communication: 0,
    problemSolving: 0,
    coding: 0,
    optimization: 0,
    debugging: 0,
    rating: 0,
    recommendation: "pending",
    feedback: "",
  },
  question: room.codingQuestion || {
    title: "",
    statement: "",
    examples: "",
    constraints: "",
    expectedComplexity: "",
  },
});

const buildPairState = (room) => ({
  enabled: Boolean(room.pairProgramming?.enabled),
  locked: Boolean(room.pairProgramming?.locked),
  restrictEditing: room.pairProgramming?.restrictEditing !== false,
  startedAt: room.pairProgramming?.startedAt,
  driver: room.pairProgramming?.driver,
  navigator: room.pairProgramming?.navigator,
  pendingControlRequest: room.pairProgramming?.pendingControlRequest || {
    from: null,
    requestedAt: null,
  },
  currentFile: room.pairProgramming?.currentFile,
  openFiles: room.pairProgramming?.openFiles || [],
  followTarget: room.pairProgramming?.followTarget || "",
  scrollTop: room.pairProgramming?.scrollTop || 0,
  cursorState: room.pairProgramming?.cursorState || {},
  presence: room.pairProgramming?.presence || {},
  mutedParticipants: room.pairProgramming?.mutedParticipants || [],
});

const isInterviewer = (room, user) => {
  const userId = getUserId(user);
  return Boolean(userId && room?.interviewer?.toString() === userId.toString());
};

const isOwner = (room, user) => {
  const userId = getUserId(user);
  return Boolean(userId && room?.owner?.toString() === userId.toString());
};

const isDriver = (room, user) => {
  const userId = getUserId(user);
  return Boolean(
    userId && room?.pairProgramming?.driver?.toString() === userId.toString()
  );
};

const emitInterviewState = async (io, roomCode) => {
  const room = await Room.findOne({ roomCode });

  if (!room) return;

  io.to(roomCode).emit("interview:state", buildInterviewState(room));
};

const emitPairState = async (io, roomCode) => {
  const room = await Room.findOne({ roomCode });

  if (!room) return;

  io.to(roomCode).emit("pair:state", buildPairState(room));
};

const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // Join Room
    socket.on("join-room", async ({ roomCode, user }) => {
      socket.join(roomCode);

      socket.roomCode = roomCode;
      socket.user = user;

      const room = await Room.findOne({ roomCode });

      if (!room) {
        socket.emit("room:error", {
          message: "Room not found",
        });
        return;
      }

      socket.emit("load-code", room.code);

      if (room.interviewMode === true) {
        const userId = (user._id || user.id).toString();
        const role =
          room.interviewer?.toString() === userId ? "interviewer" : "candidate";

        socket.emit("interview-role", {
          role,
        });

        socket.emit("interview:state", buildInterviewState(room));
      }

      socket.emit("pair:state", buildPairState(room));

      // Get all users in this room
      const sockets = await io.in(roomCode).fetchSockets();

      const participants = sockets.map((s) => ({
        id: s.id,
        userId: getUserId(s.user),
        name: s.user?.name || "Anonymous",
      }));

      io.to(roomCode).emit("system-message", {
        type: "join",
        username: user.name,
        message: `${user.name} joined the room`,
      });

      io.to(roomCode).emit("participants-update", participants);
    });

    // Live code updates
    socket.on("code-change", async ({ roomCode, code }) => {
      const room = await Room.findOne({ roomCode });

      if (
        room?.pairProgramming?.enabled &&
        room.pairProgramming.restrictEditing !== false &&
        !isDriver(room, socket.user)
      ) {
        socket.emit("pair:edit-denied", {
          message: "Only the driver can edit in pair programming mode.",
        });
        return;
      }

      socket.to(roomCode).emit("receive-code", code);

      await Room.findOneAndUpdate(
        { roomCode },
        { code }
      );
    });

    socket.on("pair:toggle", async ({ roomCode, enabled }) => {
      const room = await Room.findOne({ roomCode });

      if (!room || !isOwner(room, socket.user)) return;
      if (room.pairProgramming?.locked && room.pairProgramming.enabled !== enabled) return;

      room.pairProgramming.enabled = Boolean(enabled);
      room.pairProgramming.startedAt = enabled
        ? room.pairProgramming.startedAt || new Date()
        : null;
      room.pairProgramming.driver = enabled
        ? room.pairProgramming.driver || room.owner
        : null;
      room.pairProgramming.navigator = enabled
        ? room.pairProgramming.navigator
        : null;
      room.pairProgramming.pendingControlRequest = {
        from: null,
        requestedAt: null,
      };
      await room.save();
      io.to(roomCode).emit("system-message", {
        type: "pair",
        username: socket.user?.name || "Owner",
        message: `Pair programming ${enabled ? "enabled" : "disabled"}`,
      });
      await emitPairState(io, roomCode);
    });

    socket.on("pair:assign-roles", async ({ roomCode, driver, navigator }) => {
      const room = await Room.findOne({ roomCode });

      if (!room || !isOwner(room, socket.user)) return;

      room.pairProgramming.enabled = true;
      room.pairProgramming.startedAt = room.pairProgramming.startedAt || new Date();
      room.pairProgramming.driver = driver || room.pairProgramming.driver || room.owner;
      room.pairProgramming.navigator = navigator || room.pairProgramming.navigator || null;
      room.pairProgramming.pendingControlRequest = {
        from: null,
        requestedAt: null,
      };
      await room.save();
      io.to(roomCode).emit("system-message", {
        type: "pair",
        username: socket.user?.name || "Owner",
        message: "Pair programming roles updated",
      });
      await emitPairState(io, roomCode);
    });

    socket.on("pair:request-control", async ({ roomCode }) => {
      const room = await Room.findOne({ roomCode });
      const userId = getUserId(socket.user);

      if (!room || !room.pairProgramming?.enabled || !userId) return;
      if (room.pairProgramming.pendingControlRequest?.from) return;
      if (room.pairProgramming.driver?.toString() === userId.toString()) return;

      room.pairProgramming.pendingControlRequest = {
        from: userId,
        requestedAt: new Date(),
      };
      await room.save();
      io.to(roomCode).emit("pair:control-requested", {
        from: userId,
        user: socket.user,
      });
      await emitPairState(io, roomCode);
    });

    socket.on("pair:respond-control", async ({ roomCode, accepted }) => {
      const room = await Room.findOne({ roomCode });

      if (!room || !isDriver(room, socket.user)) return;

      const requester = room.pairProgramming.pendingControlRequest?.from;
      if (!requester) return;

      if (accepted) {
        room.pairProgramming.navigator = room.pairProgramming.driver;
        room.pairProgramming.driver = requester;
      }

      room.pairProgramming.pendingControlRequest = {
        from: null,
        requestedAt: null,
      };
      await room.save();
      io.to(roomCode).emit("system-message", {
        type: "pair",
        username: socket.user?.name || "Driver",
        message: accepted ? "Control request accepted" : "Control request rejected",
      });
      await emitPairState(io, roomCode);
    });

    socket.on("pair:permissions:update", async ({ roomCode, permissions }) => {
      const room = await Room.findOne({ roomCode });

      if (!room || !isOwner(room, socket.user)) return;

      if (permissions?.locked !== undefined) {
        room.pairProgramming.locked = Boolean(permissions.locked);
      }
      if (permissions?.restrictEditing !== undefined) {
        room.pairProgramming.restrictEditing = Boolean(permissions.restrictEditing);
      }
      await room.save();
      await emitPairState(io, roomCode);
    });

    socket.on("pair:follow-target", async ({ roomCode, targetUserId }) => {
      const room = await Room.findOne({ roomCode });

      if (!room || !room.pairProgramming?.enabled) return;

      room.pairProgramming.followTarget = targetUserId || "";
      await room.save();
      await emitPairState(io, roomCode);
    });

    socket.on("room:transfer-owner", async ({ roomCode, targetUserId }) => {
      const room = await Room.findOne({ roomCode });

      if (!room || !isOwner(room, socket.user) || !targetUserId) return;

      room.owner = targetUserId;
      if (room.pairProgramming?.enabled && !room.pairProgramming.driver) {
        room.pairProgramming.driver = targetUserId;
      }
      await room.save();
      io.to(roomCode).emit("system-message", {
        type: "pair",
        username: socket.user?.name || "Owner",
        message: "Room ownership transferred",
      });
      await emitPairState(io, roomCode);
    });

    socket.on("room:remove-participant", async ({ roomCode, targetUserId }) => {
      const room = await Room.findOne({ roomCode });

      if (!room || !isOwner(room, socket.user) || !targetUserId) return;

      room.participants = room.participants.filter(
        (participantId) => participantId.toString() !== targetUserId.toString()
      );
      if (room.pairProgramming?.driver?.toString() === targetUserId.toString()) {
        room.pairProgramming.driver = room.owner;
      }
      if (room.pairProgramming?.navigator?.toString() === targetUserId.toString()) {
        room.pairProgramming.navigator = null;
      }
      await room.save();

      const sockets = await io.in(roomCode).fetchSockets();
      sockets
        .filter((roomSocket) => getUserId(roomSocket.user)?.toString() === targetUserId.toString())
        .forEach((roomSocket) => {
          roomSocket.emit("room:removed", {
            message: "You were removed from the room.",
          });
          roomSocket.leave(roomCode);
        });

      io.to(roomCode).emit("system-message", {
        type: "pair",
        username: socket.user?.name || "Owner",
        message: "Participant removed",
      });
      await emitPairState(io, roomCode);
    });

    socket.on("room:mute-participant", async ({ roomCode, targetUserId, muted }) => {
      const room = await Room.findOne({ roomCode });

      if (!room || !isOwner(room, socket.user) || !targetUserId) return;

      const mutedParticipants = room.pairProgramming?.mutedParticipants || [];
      const isAlreadyMuted = mutedParticipants.some(
        (participantId) => participantId.toString() === targetUserId.toString()
      );

      if (muted && !isAlreadyMuted) {
        mutedParticipants.push(targetUserId);
      }

      if (!muted && isAlreadyMuted) {
        room.pairProgramming.mutedParticipants = mutedParticipants.filter(
          (participantId) => participantId.toString() !== targetUserId.toString()
        );
      } else {
        room.pairProgramming.mutedParticipants = mutedParticipants;
      }

      await room.save();
      await emitPairState(io, roomCode);
    });

    socket.on("pair:presence", async ({ roomCode, status }) => {
      const room = await Room.findOne({ roomCode });
      const userId = getUserId(socket.user);

      if (!room || !userId) return;

      room.pairProgramming.presence = {
        ...(room.pairProgramming.presence || {}),
        [userId]: {
          ...(room.pairProgramming.presence?.[userId] || {}),
          ...status,
          user: socket.user,
          updatedAt: new Date(),
        },
      };
      await room.save();
      socket.to(roomCode).emit("pair:presence", {
        userId,
        status: room.pairProgramming.presence[userId],
      });
    });

    socket.on("pair:follow:update", async ({ roomCode, payload }) => {
      const room = await Room.findOne({ roomCode });
      const userId = getUserId(socket.user);

      if (!room || !room.pairProgramming?.enabled || !userId) return;

      room.pairProgramming.currentFile = payload?.currentFile || room.pairProgramming.currentFile;
      room.pairProgramming.openFiles = payload?.openFiles || room.pairProgramming.openFiles || [];
      room.pairProgramming.scrollTop = Number(payload?.scrollTop) || 0;
      room.pairProgramming.cursorState = {
        ...(room.pairProgramming.cursorState || {}),
        [userId]: {
          position: payload?.position || null,
          currentFile: payload?.currentFile || null,
          updatedAt: new Date(),
        },
      };
      await room.save();
      socket.to(roomCode).emit("pair:follow:update", {
        userId,
        user: socket.user,
        payload,
      });
      await emitPairState(io, roomCode);
    });

    socket.on("pair:file-opened", async ({ roomCode, file, openFiles }) => {
      const room = await Room.findOne({ roomCode });

      if (!room || !room.pairProgramming?.enabled) return;

      room.pairProgramming.currentFile = file?._id || file?.id || null;
      room.pairProgramming.openFiles = (openFiles || [])
        .map((openFile) => openFile?._id || openFile?.id)
        .filter(Boolean);
      await room.save();
      socket.to(roomCode).emit("pair:file-opened", {
        file,
        openFiles,
        user: socket.user,
      });
      await emitPairState(io, roomCode);
    });

    socket.on("pair:file-tree-changed", ({ roomCode }) => {
      socket.to(roomCode).emit("pair:file-tree-changed");
    });

    socket.on("pair:ai-action", ({ roomCode, action, user }) => {
      io.to(roomCode).emit("system-message", {
        type: "ai",
        username: user?.name || socket.user?.name || "Participant",
        message: `${user?.name || socket.user?.name || "Participant"} started ${action}`,
      });
    });

    socket.on("start-interview", async ({ roomCode }) => {
      const room = await Room.findOne({ roomCode });

      if (!room || !isInterviewer(room, socket.user)) return;

      interviewTimers[roomCode] = {
        status: "active",
        startedAt: Date.now(),
        pausedAt: null,
        totalPaused: interviewTimers[roomCode]?.totalPaused || 0,
      };

      room.interviewStatus = "active";
      room.interviewStartedAt = new Date(interviewTimers[roomCode].startedAt);
      room.interviewPausedAt = null;
      room.interviewTotalPausedMs = interviewTimers[roomCode].totalPaused;
      await room.save();

      io.to(roomCode).emit("interview-started", buildInterviewState(room));
      await emitInterviewState(io, roomCode);
    });

    socket.on("pause-interview", async ({ roomCode }) => {
      if (!interviewTimers[roomCode]) return;

      const room = await Room.findOne({ roomCode });

      if (!room || !isInterviewer(room, socket.user)) return;

      interviewTimers[roomCode].status = "paused";
      interviewTimers[roomCode].pausedAt = Date.now();

      room.interviewStatus = "paused";
      room.interviewPausedAt = new Date(interviewTimers[roomCode].pausedAt);
      await room.save();

      io.to(roomCode).emit("interview-paused", buildInterviewState(room));
      await emitInterviewState(io, roomCode);
    });

    socket.on("resume-interview", async ({ roomCode }) => {
      if (!interviewTimers[roomCode]) return;

      const room = await Room.findOne({ roomCode });

      if (!room || !isInterviewer(room, socket.user)) return;

      const pausedAt = interviewTimers[roomCode].pausedAt;

      if (pausedAt) {
        interviewTimers[roomCode].totalPaused += Date.now() - pausedAt;
      }

      interviewTimers[roomCode].status = "active";
      interviewTimers[roomCode].pausedAt = null;

      room.interviewStatus = "active";
      room.interviewPausedAt = null;
      room.interviewTotalPausedMs = interviewTimers[roomCode].totalPaused;
      await room.save();

      io.to(roomCode).emit("interview-resumed", buildInterviewState(room));
      await emitInterviewState(io, roomCode);
    });

    socket.on("end-interview", async ({ roomCode }) => {
      const room = await Room.findOne({ roomCode });

      if (!room || !isInterviewer(room, socket.user)) return;

      delete interviewTimers[roomCode];

      room.interviewStatus = "completed";
      room.interviewPausedAt = null;
      await room.save();

      io.to(roomCode).emit("interview-ended", buildInterviewState(room));
      await emitInterviewState(io, roomCode);
    });

    socket.on("finish-interview", async ({ roomCode }) => {
      const room = await Room.findOne({ roomCode });

      if (!room || !isInterviewer(room, socket.user)) return;

      delete interviewTimers[roomCode];

      room.interviewStatus = "completed";
      room.interviewPausedAt = null;
      await room.save();

      io.to(roomCode).emit("interview-ended", buildInterviewState(room));
      await emitInterviewState(io, roomCode);
    });

    socket.on("interview:extend", async ({ roomCode, minutes }) => {
      const room = await Room.findOne({ roomCode });

      if (!room || !isInterviewer(room, socket.user)) return;

      const safeMinutes = Math.min(120, Math.max(1, Number(minutes) || 0));
      room.duration += safeMinutes;
      await room.save();
      await emitInterviewState(io, roomCode);
    });

    socket.on("interview:notes:update", async ({ roomCode, notes }) => {
      const room = await Room.findOne({ roomCode });

      if (!room || !isInterviewer(room, socket.user)) return;

      room.interviewNotes = notes || "";
      await room.save();
      await emitInterviewState(io, roomCode);
    });

    socket.on("interview:evaluation:update", async ({ roomCode, evaluation }) => {
      const room = await Room.findOne({ roomCode });

      if (!room || !isInterviewer(room, socket.user)) return;

      room.candidateEvaluation = {
        communication: Number(evaluation?.communication) || 0,
        problemSolving: Number(evaluation?.problemSolving) || 0,
        coding: Number(evaluation?.coding) || 0,
        optimization: Number(evaluation?.optimization) || 0,
        debugging: Number(evaluation?.debugging) || 0,
        rating: Number(evaluation?.rating) || 0,
        recommendation: evaluation?.recommendation || "pending",
        feedback: evaluation?.feedback || "",
      };
      await room.save();
      await emitInterviewState(io, roomCode);
    });

    socket.on("interview:question:update", async ({ roomCode, question }) => {
      const room = await Room.findOne({ roomCode });

      if (!room || !isInterviewer(room, socket.user)) return;

      room.codingQuestion = {
        title: question?.title || "",
        statement: question?.statement || "",
        examples: question?.examples || "",
        constraints: question?.constraints || "",
        expectedComplexity: question?.expectedComplexity || "",
      };
      await room.save();
      await emitInterviewState(io, roomCode);
    });

    socket.on("interview:question:skip", async ({ roomCode }) => {
      const room = await Room.findOne({ roomCode });

      if (!room || !isInterviewer(room, socket.user)) return;

      room.codingQuestion = {
        title: "",
        statement: "",
        examples: "",
        constraints: "",
        expectedComplexity: "",
      };
      await room.save();
      await emitInterviewState(io, roomCode);
    });

    socket.on("webrtc:join", async ({ roomCode, user }) => {
      socket.join(roomCode);
      socket.roomCode = roomCode;
      socket.user = user;

      const sockets = await io.in(roomCode).fetchSockets();
      const peers = sockets
        .filter((s) => s.id !== socket.id)
        .map((s) => ({
          socketId: s.id,
          user: s.user,
        }));

      socket.emit("webrtc:peers", peers);
      socket.to(roomCode).emit("webrtc:user-joined", {
        socketId: socket.id,
        user,
      });
    });

    socket.on("webrtc:offer", ({ to, offer }) => {
      io.to(to).emit("webrtc:offer", {
        from: socket.id,
        offer,
        user: socket.user,
      });
    });

    socket.on("webrtc:answer", ({ to, answer }) => {
      io.to(to).emit("webrtc:answer", {
        from: socket.id,
        answer,
      });
    });

    socket.on("webrtc:ice-candidate", ({ to, candidate }) => {
      io.to(to).emit("webrtc:ice-candidate", {
        from: socket.id,
        candidate,
      });
    });

    socket.on("media:status", ({ roomCode, status }) => {
      socket.to(roomCode).emit("media:status", {
        socketId: socket.id,
        user: socket.user,
        status,
      });
    });

    socket.on("webrtc:leave", ({ roomCode }) => {
      socket.to(roomCode).emit("webrtc:user-left", {
        socketId: socket.id,
      });
    });

    socket.on("notes:update", ({ roomCode, notes }) => {
      socket.to(roomCode).emit("notes:update", {
        notes,
      });
    });

    socket.on("whiteboard:draw", ({ roomCode, stroke }) => {
      socket.to(roomCode).emit("whiteboard:draw", {
        stroke,
      });
    });

    socket.on("whiteboard:clear", ({ roomCode }) => {
      socket.to(roomCode).emit("whiteboard:clear");
    });

    // Cursor updates
  socket.on("cursor:move", ({ roomId, userId, username, position }) => {
  socket.to(roomId).emit("cursor:move", {
    userId,
    username,
    position,
  });
});



    socket.on("cursor:leave", ({ roomId, userId }) => {
      socket.to(roomId).emit("cursor:leave", {
        userId,
      });
    });

    socket.on("selection:change", ({ roomId, userId, username, selection }) => {
      socket.to(roomId).emit("selection:change", {
        userId,
        username,
        selection,
      });
    });

    socket.on("selection:clear", ({ roomId, userId }) => {
      socket.to(roomId).emit("selection:clear", {
        userId,
      });
    });

    

    // Chat
socket.on("typing:start", ({ roomCode, username }) => {
  socket.to(roomCode).emit("typing:start", {
    username,
  });
});

socket.on("typing:stop", ({ roomCode, username }) => {
  socket.to(roomCode).emit("typing:stop", {
    username,
  });
});

socket.on("send-message", ({ roomCode, message, user }) => {
  Room.findOne({ roomCode }).then((room) => {
    const userId = getUserId(socket.user);
    const isMuted = room?.pairProgramming?.mutedParticipants?.some(
      (participantId) => participantId.toString() === userId?.toString()
    );

    if (isMuted) {
      socket.emit("chat:muted", {
        message: "You are muted in this room.",
      });
      return;
    }

  io.to(roomCode).emit("receive-message", {
    user,
    message,
    time: new Date().toLocaleTimeString(),
  });
  });

});

    socket.on("disconnect", async () => {
  console.log(`User Disconnected: ${socket.id}`);

  if (socket.roomCode) {
    const userId = socket.user?._id || socket.user?.id;

    if (socket.user) {
      socket.to(socket.roomCode).emit("system-message", {
        type: "leave",
        username: socket.user.name,
        message: `${socket.user.name} left the room`,
      });
    }

    if (userId) {
        socket.to(socket.roomCode).emit("cursor:leave", {
          userId,
        });

        socket.to(socket.roomCode).emit("webrtc:user-left", {
          socketId: socket.id,
        });

      socket.to(socket.roomCode).emit("selection:clear", {
    userId,
});

      const room = await Room.findOne({ roomCode: socket.roomCode });

      if (room?.pairProgramming?.presence?.[userId]) {
        const nextPresence = {
          ...(room.pairProgramming.presence || {}),
        };
        delete nextPresence[userId];
        room.pairProgramming.presence = nextPresence;
        await room.save();
        io.to(socket.roomCode).emit("pair:state", buildPairState(room));
      }
    }

    const sockets = await io.in(socket.roomCode).fetchSockets();

    const participants = sockets.map((s) => ({
      id: s.id,
      userId: getUserId(s.user),
      name: s.user?.name || "Anonymous",
    }));

    io.to(socket.roomCode).emit("participants-update", participants);
  }
});
  });
};

module.exports = socketHandler;
