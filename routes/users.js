const express = require("express");
const router = express.Router();
const User = require("../models/Users");

// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find({}, "-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
});

// Get professional by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Professional not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error });
  }
});

// Add a rating to a professional
router.post("/:id/rate", async (req, res) => {
  const { customerId, score, comment } = req.body;

  try {
    const professional = await User.findById(req.params.id);

    if (!professional) {
      return res.status(404).json({ message: "Professional not found" });
    }

    const existingRating = professional.ratings.find((r) =>
      r.customerId.equals(customerId)
    );

    if (existingRating) {
      return res.status(400).json({ message: "You have already rated this professional" });
    }

    professional.ratings.push({ customerId, score, comment });

    const total = professional.ratings.reduce((sum, r) => sum + r.score, 0);
    professional.averageRating = total / professional.ratings.length;

    await professional.save();

    res.status(201).json({ message: "Rating submitted", averageRating: professional.averageRating });
  } catch (error) {
    res.status(500).json({ message: "Error submitting rating", error });
  }
});

module.exports = router;
