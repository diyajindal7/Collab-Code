const dotenv = require("dotenv");
const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");

dotenv.config();

connectDB();

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Collaborative Coding Platform API");
});

const PORT = process.env.PORT || 5000;
app.use("/api/auth", authRoutes);

app.use("/api/rooms", roomRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});