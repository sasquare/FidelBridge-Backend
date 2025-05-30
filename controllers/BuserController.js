const User = require("../models/User");

exports.getProfile = async (req, res) => {
  try {
    console.log("Fetching profile for user:", req.user.id);
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      console.error("User not found:", req.user.id);
      return res.status(404).json({ message: "User not found" });
    }
    console.log("Profile fetched successfully:", user._id);
    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.uploadPicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const picturePath = `/uploads/${req.file.filename}`;
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
};

exports.updateProfile = async (req, res) => {
  try {
    const { headline, portfolio, links, contact } = req.body;
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

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");
    res.json(user);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.rateProfessional = async (req, res) => {
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
};

exports.getProfessional = async (req, res) => {
  try {
    const professional = await User.findById(req.params.id).select("-password");
    if (!professional || professional.role !== "professional") {
      return res.status(404).json({ message: "Professional not found" });
    }
    res.json(professional);
  } catch (error) {
    console.error("Get professional error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
