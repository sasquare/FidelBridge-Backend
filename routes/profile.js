const express = require("express");
const router = express.Router();
const User = require("../models/User"); // Adjust path if needed
const { verifyToken } = require("../middleware/auth"); // Optional: if using auth middleware

// PUT /profile/update
router.put("/update", /* verifyToken, */ async (req, res) => {
  try {
    const { userId, name, email, bio, skills } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, bio, skills },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: "Profile updated", user: updatedUser });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error while updating profile" });
  }
});

module.exports = router;
