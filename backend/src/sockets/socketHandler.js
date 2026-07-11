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

    

    // Chat
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