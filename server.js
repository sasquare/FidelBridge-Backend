const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const User = require("./models/User");

dotenv.config();

const app = express();
const server = http.createServer(app);

// Define allowed origins
const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];

// CORS middleware for Express
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    optionsSuccessStatus: 200,
  })
);

// Handle preflight requests
app.options("*", cors());

app.use(express.json());
app.use("/Uploads", express.static("Uploads"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Initialize Socket.IO with CORS settings
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Socket.IO events
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("setOnline", async (userId) => {
    try {
      await User.findByIdAndUpdate(userId, { isOnline: true });
      io.emit("statusUpdate", { userId, isOnline: true });
    } catch (error) {
      console.error("Set online error:", error);
    }
  });

  socket.on("setOffline", async (userId) => {
    try {
      await User.findByIdAndUpdate(userId, { isOnline: false });
      io.emit("statusUpdate", { userId, isOnline: false });
    } catch (error) {
      console.error("Set offline error:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// API routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/requests", require("./routes/requests"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
