const User = require("../models/User");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    console.log("Register request body:", req.body);
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password || !role) {
      console.log("Missing fields:", { name, email, password, role });
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!["customer", "professional"].includes(role)) {
      console.log("Invalid role:", role);
      return res
        .status(400)
        .json({ message: "Role must be customer or professional" });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Duplicate email:", email);
      return res.status(400).json({ message: "User already exists" });
    }

    // Create and save user
    console.log("Creating user:", { name, email, role });
    const user = new User({ name, email, password, role });
    await user.save();
    console.log("User saved:", user._id);

    // Generate JWT (optional, added for consistency with login)
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    console.log("Token generated:", token);

    res.status(201).json({ message: "User registered successfully", token });
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
    res.json(user);
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
