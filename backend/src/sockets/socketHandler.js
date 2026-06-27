const socketHandler = (io) => {

    io.on("connection", (socket) => {

        console.log(`User Connected: ${socket.id}`);

        socket.on("join-room", (roomCode) => {

            socket.join(roomCode);

            console.log(`${socket.id} joined ${roomCode}`);

            io.to(roomCode).emit("user-joined", {
                socketId: socket.id,
                message: "A new user joined the room"
            });

        });

        socket.on("disconnect", () => {

            console.log(`User Disconnected: ${socket.id}`);

        });

    });

};

module.exports = socketHandler;