const express = require("express");
const router = express.Router();
const User = require("../model/Users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// User registration
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret", {
      expiresIn: "1d",
    });

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

// Get a single professional by ID
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

module.exports = router;
