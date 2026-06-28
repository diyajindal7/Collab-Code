const Room = require("../models/Room");

const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // Join room
    socket.on("join-room", async (roomCode) => {
      socket.join(roomCode);

      console.log(`${socket.id} joined ${roomCode}`);

      // Send latest saved code to the newly joined user
      const room = await Room.findOne({ roomCode });

      if (room) {
        socket.emit("load-code", room.code);
      }

      io.to(roomCode).emit("user-joined", {
        socketId: socket.id,
        message: "A new user joined the room",
      });
    });

    // Live code updates
    socket.on("code-change", async ({ roomCode, code }) => {
      socket.to(roomCode).emit("receive-code", code);

      await Room.findOneAndUpdate(
        { roomCode },
        { code }
      );
    });

    socket.on("disconnect", () => {
      console.log(`User Disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;