const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");  // <-- ADD THIS LINE
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
const server = http.createServer(app);

// Add ALL your deployed frontend origins here
const allowedOrigins = [
  "http://localhost:3000",
  "https://fidel-bridge-frontend.vercel.app",
  "https://fidel-bridge-frontend-kloswasz3-femis-projects-0c9c7b22.vercel.app",
  "https://fidel-bridge-frontend-9rcubtqqy-femis-projects-0c9c7b22.vercel.app",
  // add any other deployed frontend URLs here as needed
];

// CORS middleware for Express routes
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (e.g. mobile apps, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Middleware for JSON parsing
app.use(express.json());

// API routes
app.use("/api/auth", authRoutes);    // <-- ADD THIS LINE
app.use("/api/users", userRoutes);

// MongoDB connection without deprecated options
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Setup Socket.IO with matching CORS config
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });

  // Handle other custom socket events here
  // socket.on("event-name", (data) => { ... });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
