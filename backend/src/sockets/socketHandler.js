const Room = require("../models/Room");

const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // Join Room
    socket.on("join-room", async ({ roomCode, user }) => {
      socket.join(roomCode);

      socket.roomCode = roomCode;
      socket.user = user;

      const room = await Room.findOne({ roomCode });

      if (room) {
        socket.emit("load-code", room.code);
      }

      // Get all users in this room
      const sockets = await io.in(roomCode).fetchSockets();

      const participants = sockets.map((s) => ({
        id: s.id,
        name: s.user?.name || "Anonymous",
      }));

      console.log("User joined:", user);
      console.log("Room Code:", roomCode);
      console.log("Sockets in room:", sockets.length);
      console.log("Participants:", participants);

      io.to(roomCode).emit("system-message", {
        type: "join",
        username: user.name,
        message: `${user.name} joined the room`,
      });

      io.to(roomCode).emit("participants-update", participants);
    });

    // Live code updates
    socket.on("code-change", async ({ roomCode, code }) => {
      socket.to(roomCode).emit("receive-code", code);

      await Room.findOneAndUpdate(
        { roomCode },
        { code }
      );
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

  io.to(roomCode).emit("receive-message", {
    user,
    message,
    time: new Date().toLocaleTimeString(),
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

      socket.to(socket.roomCode).emit("selection:clear", {
    userId,
});
    }

    const sockets = await io.in(socket.roomCode).fetchSockets();

    const participants = sockets.map((s) => ({
      id: s.id,
      name: s.user?.name || "Anonymous",
    }));

    io.to(socket.roomCode).emit("participants-update", participants);
  }
});
  });
};

module.exports = socketHandler;