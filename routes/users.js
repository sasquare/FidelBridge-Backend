const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const authMiddleware = require("../middleware/auth");

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // unique file name
  },
});

const upload = multer({ storage });

// User registration
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "User already exists" });

    const user = new User({ name, email, password, role });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// User login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret",
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get all users (excluding passwords)
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: "Server error while fetching users" });
  }
});

// Get a single user by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error while fetching user" });
  }
});

// Rate a professional
router.post("/:id/rate", async (req, res) => {
  const { customerId, score, comment } = req.body;

  try {
    const professional = await User.findById(req.params.id);
    if (!professional || professional.role !== "professional") {
      return res.status(404).json({ error: "Professional not found" });
    }

    const existingRatingIndex = professional.ratings.findIndex(
      (r) => r.customerId.toString() === customerId
    );

    if (existingRatingIndex !== -1) {
      professional.ratings[existingRatingIndex].score = score;
      professional.ratings[existingRatingIndex].comment = comment;
    } else {
      professional.ratings.push({ customerId, score, comment });
    }

    const totalScore = professional.ratings.reduce((sum, r) => sum + r.score, 0);
    professional.averageRating = totalScore / professional.ratings.length;

    await professional.save();

    res.status(200).json({ message: "Rating submitted", ratings: professional.ratings });
  } catch (err) {
    res.status(500).json({ error: "Server error while submitting rating" });
  }
});

// Upload profile picture (authenticated)
router.post(
  "/upload-picture",
  authMiddleware,
  upload.single("picture"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });

      const userId = req.user.id;

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Save the picture URL or path
      user.picture = `/uploads/${req.file.filename}`;
      await user.save();

      res.json({
        message: "Picture uploaded successfully",
        pictureUrl: user.picture,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error uploading picture" });
    }
  }
);

// Update profile (authenticated)
router.put("/update", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const updates = req.body;

  try {
    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
    }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Profile updated", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error updating profile" });
  }
});

module.exports = router;
