const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");
const judge0Routes = require("./routes/judge0Routes");
const aiReviewRoutes = require("./routes/aiReviewRoutes");
const aiExplainRoutes = require("./routes/aiExplainRoutes");
const aiFixRoutes = require("./routes/aiFixRoutes");
const socketHandler = require("./sockets/socketHandler");

connectDB();

const app = express();

app.use(
  cors({
  origin: [
  "http://localhost:5173",
  "https://collab-code-pi.vercel.app",
],
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Collaborative Coding Platform API");
});

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/judge0", judge0Routes);
app.use("/api/ai", aiReviewRoutes);
app.use("/api/ai", aiExplainRoutes);
app.use("/api/ai", aiFixRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://collab-code-pi.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

socketHandler(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
