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

    const baseUrl = process.env.BASE_URL || "http://localhost:5000";
    const pictureUrl = `${baseUrl}/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { picture: pictureUrl },
      { new: true }
    ).select("-password");

    res.status(200).json({
      message: "Picture uploaded successfully",
      picture: pictureUrl,
    });
  } catch (error) {
    console.error("Upload picture error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const {
      headline,
      portfolio,
      links,
      contact,
      serviceType,
      businessRegNumber,
      videoUrl,
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
    if (videoUrl) updateData.videoUrl = videoUrl;

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

    const completeProfile = {
      id: professional._id,
      name: professional.name,
      email: professional.email,
      role: professional.role,
      headline: professional.headline || "",
      serviceType: professional.serviceType || "",
      businessRegNumber: professional.businessRegNumber || "",
      videoUrl: professional.videoUrl || "",
      picture: professional.picture || "",
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
};
