const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

// Configure multer for file uploads (images and videos)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|mp4/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only images and MP4 videos are allowed"));
  },
});

// Get profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Upload picture
router.post(
  "/upload-picture",
  auth,
  upload.single("picture"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const picturePath = `/Uploads/${req.file.filename}`;
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { picture: picturePath },
        { new: true }
      ).select("-password");
      res.json({ message: "Picture uploaded", picture: picturePath });
    } catch (error) {
      console.error("Upload picture error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Upload video
router.post("/upload-video", auth, upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No video uploaded" });
    }
    const videoPath = `/Uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { videoUrl: videoPath },
      { new: true }
    ).select("-password");
    res.json({ message: "Video uploaded", videoUrl: videoPath });
  } catch (error) {
    console.error("Upload video error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update profile
router.put("/profile", auth, async (req, res) => {
  try {
    const {
      headline,
      portfolio,
      links,
      contact,
      serviceType,
      businessRegNumber,
    } = req.body;
    const updateData = {};
    if (headline) updateData.headline = headline;
    if (portfolio) {
      if (!Array.isArray(portfolio) || portfolio.length > 2) {
        return res
          .status(400)
          .json({ message: "Portfolio must be an array with max 2 items" });
      }
      updateData.portfolio = portfolio.map((item) => ({
        title: item.title || "",
        image: item.image || "",
        description: item.description || "",
      }));
    }
    if (links) updateData.links = links;
    if (contact) updateData.contact = contact;
    if (serviceType) updateData.serviceType = serviceType;
    if (businessRegNumber) updateData.businessRegNumber = businessRegNumber;

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");
    res.json(user);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Rate professional
router.post("/:id/rate", auth, async (req, res) => {
  try {
    const { score, comment } = req.body;
    const professionalId = req.params.id;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ message: "Score must be between 1 and 5" });
    }

    const professional = await User.findById(professionalId);
    if (!professional || professional.role !== "professional") {
      return res.status(404).json({ message: "Professional not found" });
    }

    const existingRating = professional.ratings.find(
      (r) => r.customerId.toString() === req.user.id
    );
    if (existingRating) {
      return res
        .status(400)
        .json({ message: "You have already rated this professional" });
    }

    professional.ratings.push({
      customerId: req.user.id,
      score,
      comment,
    });

    await professional.save();
    res.json({ message: "Rating submitted" });
  } catch (error) {
    console.error("Rate error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Search professionals
router.get("/search", auth, async (req, res) => {
  try {
    const { query, serviceType, location } = req.query;
    const searchCriteria = { role: "professional" };

    if (query) {
      searchCriteria.$or = [
        { name: { $regex: query, $options: "i" } },
        { headline: { $regex: query, $options: "i" } },
      ];
    }
    if (serviceType) {
      searchCriteria.serviceType = serviceType;
    }
    if (location) {
      searchCriteria["contact.address"] = { $regex: location, $options: "i" };
    }

    const professionals = await User.find(searchCriteria).select("-password");
    res.json(professionals);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get professional by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const professional = await User.findById(req.params.id).select("-password");
    if (!professional || professional.role !== "professional") {
      return res.status(404).json({ message: "Professional not found" });
    }
    const completeProfile = {
      id: professional._id,
      name: professional.name,
      email: professional.email,
      role: professional.role,
      headline: professional.headline || "",
      serviceType: professional.serviceType || "",
      businessRegNumber: professional.businessRegNumber || "",
      videoUrl: professional.videoUrl || "",
      picture: professional.picture
        ? `${process.env.BASE_URL || "http://localhost:5000"}${
            professional.picture
          }`
        : "",
      portfolio: professional.portfolio || [],
      links: professional.links || {
        portfolio: "",
        socialMedia: { twitter: "", linkedin: "", instagram: "" },
        email: professional.email,
      },
      contact: professional.contact || { address: "", phone: "" },
      averageRating: professional.averageRating || 0,
      isOnline: professional.isOnline || false,
    };
    res.json(completeProfile);
  } catch (error) {
    console.error("Get professional error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
