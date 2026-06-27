const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");
const socketHandler = require("./sockets/socketHandler");


connectDB();

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Collaborative Coding Platform API");
});

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

// Create HTTP Server
const server = http.createServer(app);

// Create Socket.IO Server
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Socket Connection
socketHandler(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});