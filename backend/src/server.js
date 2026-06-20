const dotenv = require("dotenv");
const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");


dotenv.config();

connectDB();

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Collaborative Coding Platform API");
});

const PORT = process.env.PORT || 5000;
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});