const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const { verifyToken } = require("../middleware/auth"); // ✅ Destructure the correct function

// ✅ Use verifyToken instead of authMiddleware
router.post("/", verifyToken, messageController.sendMessage);
router.get("/:recipientId", verifyToken, messageController.getMessages);

module.exports = router;
