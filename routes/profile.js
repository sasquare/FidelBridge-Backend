const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { verifyToken } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});

const upload = multer({ storage });

// PUT /profile/update
router.put(
  "/update",
  verifyToken,
  upload.single("picture"),
  async (req, res) => {
    try {
      const userId = req.user.id;

      const {
        name,
        email,
        headline,
        serviceType,
        businessRegNumber,
        "contact[address]": address,
        "contact[phone]": phone,
        "links[portfolio]": portfolio,
        "links[email]": linkEmail,
        "links[socialMedia][twitter]": twitter,
        "links[socialMedia][linkedin]": linkedin,
        "links[socialMedia][instagram]": instagram,
      } = req.body;

      const picture = req.file ? `/uploads/${req.file.filename}` : undefined;

      const updatedFields = {
        name,
        email,
        ...(headline && { headline }),
        ...(serviceType && { serviceType }),
        ...(businessRegNumber && { businessRegNumber }),
        contact: {
          address,
          phone,
        },
        links: {
          portfolio,
          email: linkEmail,
          socialMedia: {
            twitter,
            linkedin,
            instagram,
          },
        },
        ...(picture && { profilePicture: picture }),
      };

      // Clean up undefined nested fields
      if (!updatedFields.links.email && !portfolio && !twitter && !linkedin && !instagram) {
        delete updatedFields.links;
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updatedFields },
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
  }
);

module.exports = router;
