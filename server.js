const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://servicehub-client-new.vercel.app",
    ],
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://servicehub-client-new.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Socket.IO for online/offline status
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("setOnline", async (userId) => {
    await mongoose.model("User").findByIdAndUpdate(userId, { isOnline: true });
    io.emit("statusUpdate", { userId, isOnline: true });
  });
  socket.on("setOffline", async (userId) => {
    await mongoose.model("User").findByIdAndUpdate(userId, { isOnline: false });
    io.emit("statusUpdate", { userId, isOnline: false });
  });
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/requests", require("./routes/requests"));
app.use("/api/messages", require("./routes/messages"));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
