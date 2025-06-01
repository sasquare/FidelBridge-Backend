const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verifyToken } = require("../middleware/auth"); // Destructure properly

router.post("/register", authController.register);
router.post("/login", authController.login);

// Correct middleware usage
router.get("/profile", verifyToken, authController.getProfile);

module.exports = router;
