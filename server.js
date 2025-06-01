const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Define allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://fidel-bridge-frontend.vercel.app",
  "https://fidel-bridge-frontend-kloswasz3-femis-projects-0c9c7b22.vercel.app",
  "https://fidel-bridge-frontend-9rcubtqqy-femis-projects-0c9c7b22.vercel.app",
  "https://fidel-bridge-frontend-dxdawwzpb-femis-projects-0c9c7b22.vercel.app"
];

// CORS middleware
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
  })
);

// Middleware
app.use(express.json());

// Serve uploads folder statically so uploaded files are accessible
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const dashboardRoutes = require("./routes/dashboardRoutes");
const requestRoutes = require("./routes/requests");
const messageRoutes = require("./routes/messages");

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/messages", messageRoutes);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Setup Socket.IO with explicit path and CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  path: "/socket.io",
});

io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });

  // Additional event handlers here if needed
});

// Start server using dynamic port for Render compatibility
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
