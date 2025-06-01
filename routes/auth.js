const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");

router.post("/register", authController.register);
router.post("/login", authController.login);

// Use controller directly to avoid inline clutter
router.get("/profile", authMiddleware, authController.getProfile);

module.exports = router;
