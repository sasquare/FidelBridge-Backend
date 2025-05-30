const User = require("../models/User");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    console.log("Register request body:", req.body);
    const {
      name,
      email,
      password,
      role,
      headline,
      serviceType,
      businessRegNumber,
      videoUrl,
    } = req.body;

    if (!name || !email || !password || !role) {
      console.log("Missing fields:", { name, email, password, role });
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!["customer", "professional"].includes(role.toLowerCase())) {
      console.log("Invalid role:", role);
      return res
        .status(400)
        .json({ message: "Role must be customer or professional" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Duplicate email:", email);
      return res.status(400).json({ message: "User already exists" });
    }

    console.log("Creating user:", { name, email, role });
    const user = new User({
      name,
      email,
      password,
      role: role.toLowerCase(),
      headline: headline || "",
      serviceType:
        role.toLowerCase() === "professional" ? serviceType || "" : "",
      businessRegNumber:
        role.toLowerCase() === "professional" ? businessRegNumber || "" : "",
      videoUrl: role.toLowerCase() === "professional" ? videoUrl || "" : "",
      picture: "",
      portfolio: [],
      links: {
        portfolio: "",
        socialMedia: { twitter: "", linkedin: "", instagram: "" },
        email: email,
      },
      contact: { address: "", phone: "" },
      averageRating: 0,
      isOnline: false,
    });

    await user.save();
    console.log("User saved:", user._id);

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    console.log("Token generated:", token);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        headline: user.headline,
        serviceType: user.serviceType,
        businessRegNumber: user.businessRegNumber,
        videoUrl: user.videoUrl,
        picture: user.picture,
        portfolio: user.portfolio,
        links: user.links,
        contact: user.contact,
        averageRating: user.averageRating,
        isOnline: user.isOnline,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    console.log("Login request body:", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      console.log("Missing fields:", { email, password });
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log("Password mismatch:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    user.isOnline = true;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    console.log("Login token generated:", token);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        headline: user.headline,
        serviceType: user.serviceType,
        businessRegNumber: user.businessRegNumber,
        videoUrl: user.videoUrl,
        picture: user.picture
          ? `${process.env.BASE_URL || "http://localhost:5000"}${user.picture}`
          : "",
        portfolio: user.portfolio || [],
        links: user.links || {
          portfolio: "",
          socialMedia: { twitter: "", linkedin: "", instagram: "" },
          email: user.email,
        },
        contact: user.contact || { address: "", phone: "" },
        averageRating: user.averageRating || 0,
        isOnline: true,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    console.log("Profile request user:", req.user);
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      console.log("User not found:", req.user.id);
      return res.status(404).json({ message: "User not found" });
    }

    const completeProfile = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      headline: user.headline || "",
      serviceType: user.serviceType || "",
      businessRegNumber: user.businessRegNumber || "",
      videoUrl: user.videoUrl || "",
      picture: user.picture
        ? `${process.env.BASE_URL || "http://localhost:5000"}${user.picture}`
        : "",
      portfolio: user.portfolio || [],
      links: user.links || {
        portfolio: "",
        socialMedia: { twitter: "", linkedin: "", instagram: "" },
        email: user.email,
      },
      contact: user.contact || { address: "", phone: "" },
      averageRating: user.averageRating || 0,
      isOnline: user.isOnline || false,
    };

    res.json(completeProfile);
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
